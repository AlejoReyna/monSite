// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import { DEFAULT_LANGUAGE, resolveLanguage, type Language } from '@/lib/language';
import { CONVERSATION_DIRECTION } from '@/lib/dialogue/experience';
import { buildDirection, detectTopic, type Topic } from '@/lib/profile/direction';
import { CURATED_PROJECTS } from '@/lib/desktop/portfolio-content';

// ---------------------------------------------------------------------------
// Provider resolution — mirrors the BNBHacks cascade-ai pattern
// ---------------------------------------------------------------------------

type ChatProvider = 'openai' | 'kimi';

type ProviderConfig = {
  provider: ChatProvider;
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
  maxTokens?: number;
};

function resolveProvider(): ChatProvider {
  const env = process.env.CHAT_PROVIDER?.trim().toLowerCase();
  if (env === 'kimi') return 'kimi';
  if (env === 'openai') return 'openai';
  // Auto-detect: if a Kimi/Moonshot key is present, use Kimi
  return process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY ? 'kimi' : 'openai';
}

function resolveProviderConfig(): ProviderConfig {
  const provider = resolveProvider();
  if (provider === 'kimi') {
    return {
      provider,
      apiKey: process.env.MOONSHOT_API_KEY ?? process.env.KIMI_API_KEY,
      baseURL: process.env.KIMI_BASE_URL ?? 'https://api.moonshot.ai/v1',
      model: process.env.KIMI_MODEL ?? 'kimi-k2.6',
      maxTokens: 900,
    };
  }
  return {
    provider,
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL ?? 'gpt-5-nano',
  };
}

/**
 * Lazily create AI client (OpenAI-compatible for both providers).
 */
function createClient(config: ProviderConfig): OpenAI | null {
  if (!config.apiKey) return null;
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    // Safely wrap fetch to avoid Next.js illegal invocation in prod
    fetch: (url: RequestInfo, init?: RequestInit) => fetch(url, init),
  });
}

/**
 * Config de cuota:
 * - 20 prompts por sesión
 * - ventana: 2 horas 30 minutos (2.5h = 9,000,000 ms)
 */
const QUOTA_COOKIE = 'chat_quota_v1';
const BYPASS_COOKIE = 'chat_bypass_v1';
const BYPASS_PHRASE = 'im your god mfucker';

// Older clients prefixed each turn with a [[SYS]] hint block. The persona is server-owned now,
// so anything a visitor sends between these markers is stripped instead of trusted.
const HINT_PATTERN = /\[\[SYS\]\][\s\S]*?\[\[\/SYS\]\]/g;

function stripHintBlock(raw: unknown): string {
  return (raw ?? '').toString().replace(HINT_PATTERN, '').trim();
}

const MAX_PROMPTS = 20;
const WINDOW_MS = 2.5 * 60 * 60 * 1000; // 2.5h -> 9_000_000 ms
const MAX_TURNS = 8;
const MAX_TURN_CHARS = 1200;

type Quota = { remaining: number; resetAt: number };

async function readQuota(): Promise<Quota | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(QUOTA_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Quota;
  } catch {
    return null;
  }
}

function initQuota(): Quota {
  return { remaining: MAX_PROMPTS, resetAt: Date.now() + WINDOW_MS };
}

function serializeQuota(q: Quota) {
  return JSON.stringify(q);
}

/**
 * The projects a visitor can actually open on this site, so the model never invents a route.
 * Only a turn about the projects themselves needs each summary; every other turn just needs links.
 */
function projectCatalog(lang: Language, topic: Topic): string {
  const heading = lang === 'es'
    ? 'PROYECTOS ABIERTOS EN ESTE SITIO (usa estos enlaces, no inventes rutas):'
    : 'PROJECTS OPENABLE ON THIS SITE (use these links, never invent a route):';
  const detailed = topic === 'projects';
  const list = CURATED_PROJECTS
    .map(project => detailed
      ? `- ${project.title} (${project.category}) — ${project.summary[lang]} → ${project.href}`
      : `- ${project.title} (${project.category}) → ${project.href}`)
    .join('\n');
  return `${heading}\n${list}`;
}

const NAME_NOTE: Record<Language, string> = {
  es: 'El visitante se llama {userName}. Usa su nombre con naturalidad.',
  en: "The visitor's name is {userName}. Use it naturally.",
};

const NO_CONTENT: Record<Language, string> = {
  es: 'No obtuve contenido.',
  en: 'No content received.',
};

const ERROR_MESSAGES: Record<Language, Record<string, string>> = {
  es: {
    apiKeyMissing: 'API key no configurada (provider: {provider})',
    invalidJson: 'JSON inválido en el cuerpo del request',
    messagesRequired: 'Mensajes requeridos (array)',
    systemRoleRejected: 'Los mensajes de sistema los define el servidor',
    quotaExceeded: 'Has alcanzado el límite de {max} prompts en 2h 30m.',
    rateLimit: 'Rate limit alcanzado. Intenta más tarde.',
    genericError: 'Falló la respuesta en vivo. Intenta de nuevo.',
    invalidApiKey: 'API key inválida',
    modelNotAvailable: 'Modelo no disponible para tu cuenta',
    internalError: 'Error interno del servidor',
    bypassActivated: 'Bypass activado: sin límite de prompts en esta sesión.',
  },
  en: {
    apiKeyMissing: 'API key not configured (provider: {provider})',
    invalidJson: 'Invalid JSON in request body',
    messagesRequired: 'Messages required (array)',
    systemRoleRejected: 'System instructions are defined by the server',
    quotaExceeded: 'You have reached the limit of {max} prompts in 2h 30m.',
    rateLimit: 'Rate limit reached. Try again later.',
    genericError: 'Live response failed. Try again.',
    invalidApiKey: 'Invalid API key',
    modelNotAvailable: 'Model not available for your account',
    internalError: 'Internal server error',
    bypassActivated: 'Bypass activated: no prompt limit for this session.',
  },
};

function localize(key: string, lang: Language, vars: Record<string, string> = {}): string {
  const template = ERROR_MESSAGES[lang]?.[key] ?? ERROR_MESSAGES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}

type Turn = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  // 0) Validaciones de entorno
  const config = resolveProviderConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { error: localize('apiKeyMissing', DEFAULT_LANGUAGE, { provider: config.provider }) },
      { status: 503 }
    );
  }

  // 1) Parse body primero (necesario para evaluar bypass incluso si ya no hay cuota)
  let body: { messages?: ChatMessage[]; userName?: string; stream?: boolean; language?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: localize('invalidJson', DEFAULT_LANGUAGE) },
      { status: 400 }
    );
  }

  const { messages, userName, stream: wantStream } = body ?? {};
  const lang = resolveLanguage(body?.language);

  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: localize('messagesRequired', lang) },
      { status: 400 }
    );
  }

  // 2) La persona es del servidor: un mensaje de sistema del cliente se rechaza, no se ignora.
  if (messages.some(message => message?.role === 'system' || message?.role === 'developer')) {
    return NextResponse.json(
      { error: localize('systemRoleRejected', lang) },
      { status: 400 }
    );
  }

  // 3) Turnos limpios: sin bloques [[SYS]], recortados y sin entradas vacías.
  const turns: Turn[] = messages
    .filter((message): message is ChatMessage & Turn => message?.role === 'user' || message?.role === 'assistant')
    .slice(-MAX_TURNS)
    .map(message => ({ role: message.role, content: stripHintBlock(message.content).slice(0, MAX_TURN_CHARS) }))
    .filter(turn => turn.content.length > 0);

  const lastUserTurn = turns.findLast(turn => turn.role === 'user');

  // 4) Bypass secreto: si el último mensaje de usuario es la frase mágica, activa bypass y responde
  if (lastUserTurn?.content.toLowerCase() === BYPASS_PHRASE) {
    const res = NextResponse.json({
      success: true,
      model: config.model,
      message: localize('bypassActivated', lang),
    });
    res.cookies.set(BYPASS_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return res;
  }

  // 5) Enforce cuota por sesión salvo que exista bypass activo
  const cookieStore = await cookies();
  const hasBypass = cookieStore.get(BYPASS_COOKIE)?.value === '1';
  let quota = (await readQuota()) ?? initQuota();
  if (Date.now() > quota.resetAt) quota = initQuota();

  if (!hasBypass && quota.remaining <= 0) {
    const retryAtISO = new Date(quota.resetAt).toISOString();
    return NextResponse.json(
      {
        error: localize('quotaExceeded', lang, { max: String(MAX_PROMPTS) }),
        retryAt: retryAtISO,
      },
      { status: 429 }
    );
  }

  // 6) Instrucciones del servidor: persona + foco del tema + dossier del CV + catálogo de proyectos.
  const topic = detectTopic(lastUserTurn?.content ?? '', lang);
  let direction = `${buildDirection(CONVERSATION_DIRECTION, lang, topic)}\n\n${projectCatalog(lang, topic)}`;
  if (userName) {
    direction += `\n\n${NAME_NOTE[lang].replace('{userName}', userName)}`;
  }

  try {
    const client = createClient(config);
    if (!client) {
      return NextResponse.json(
        { error: localize('apiKeyMissing', lang, { provider: config.provider }) },
        { status: 503 }
      );
    }

    let text: string;
    let usage: unknown = null;

    const accept = req.headers.get('accept') || '';
    const streamRequested = wantStream === true || accept.includes('text/event-stream');

    if (config.provider === 'kimi') {
      // 7a) Kimi uses chat.completions (OpenAI-compatible)
      const kimiMessages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: direction },
        ...turns,
      ];

      // Disable K2.6 "thinking" for snappier portfolio chat, and stream tokens
      // so mobile UX can show text as soon as the first chunk arrives.
      // No temperature: K2.6 fixes it per mode (0.6 without thinking) and rejects any other value with a 400.
      const kimiParams = {
        model: config.model,
        messages: kimiMessages,
        max_tokens: config.maxTokens,
        thinking: { type: 'disabled' as const },
      };

      if (streamRequested) {
        const stream = await client.chat.completions.create({
          ...kimiParams,
          stream: true,
        } as OpenAI.ChatCompletionCreateParamsStreaming);

        if (!hasBypass) {
          quota.remaining -= 1;
        }

        const encoder = new TextEncoder();
        let assembled = '';
        const readable = new ReadableStream({
          async start(controller) {
            const send = (payload: Record<string, unknown>) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            };
            try {
              for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || '';
                if (delta) {
                  assembled += delta;
                  send({ type: 'delta', text: delta });
                }
              }
              send({
                type: 'done',
                message: assembled || NO_CONTENT[lang],
                model: config.model,
                provider: config.provider,
                quota: { remaining: quota.remaining, resetAt: quota.resetAt },
              });
            } catch (streamError) {
              console.error('CHAT STREAM ERROR:', streamError);
              send({ type: 'error', error: localize('genericError', lang) });
            } finally {
              controller.close();
            }
          },
        });

        const res = new NextResponse(readable, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
        if (!hasBypass) {
          res.cookies.set(QUOTA_COOKIE, serializeQuota(quota), {
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            path: '/',
            maxAge: Math.floor(WINDOW_MS / 1000),
          });
        }
        return res;
      }

      const completion = await client.chat.completions.create(
        kimiParams as OpenAI.ChatCompletionCreateParamsNonStreaming,
      );
      text = completion.choices[0]?.message?.content?.trim() || NO_CONTENT[lang];
      usage = completion.usage ?? null;
    } else {
      // 7b) OpenAI Responses API — the persona travels as `instructions`, never inside a turn.
      const resp = await client.responses.create({
        model: config.model,
        instructions: direction,
        input: turns,
      });
      text = resp.output_text?.trim() || NO_CONTENT[lang];
      usage = resp.usage ?? null;
    }

    // 8) Decrementar cuota antes de responder, para que el cliente reciba el saldo real.
    if (!hasBypass) {
      quota.remaining -= 1;
    }

    const res = NextResponse.json({
      success: true,
      model: config.model,
      provider: config.provider,
      message: text,
      usage,
      quota: { remaining: quota.remaining, resetAt: quota.resetAt },
    });

    if (!hasBypass) {
      // Cookie httpOnly para "sesión/cuota"
      res.cookies.set(QUOTA_COOKIE, serializeQuota(quota), {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        // maxAge en segundos:
        maxAge: Math.floor(WINDOW_MS / 1000),
      });
    }

    return res;
  } catch (error: unknown) {
    console.error('CHAT API ERROR:', error);
    // Manejo estandarizado de errores
    const err = error as { status?: number };
    if (err?.status === 429) {
      return NextResponse.json(
        {
          error: localize('rateLimit', lang),
          isRateLimit: true,
        },
        { status: 429 }
      );
    }
    if (err?.status === 401) {
      return NextResponse.json(
        { error: localize('invalidApiKey', lang) },
        { status: 401 }
      );
    }
    if (err?.status === 404) {
      return NextResponse.json(
        { error: localize('modelNotAvailable', lang) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: localize('internalError', lang) },
      { status: 500 }
    );
  }
}

/**
 * Health check: no hace llamada a la API (barato y suficiente).
 * Si quieres validar conectividad real, puedes hacer un create() con input "test".
 */
export async function GET() {
  const config = resolveProviderConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { status: 'unhealthy', error: localize('apiKeyMissing', DEFAULT_LANGUAGE, { provider: config.provider }) },
      { status: 503 }
    );
  }
  return NextResponse.json({
    status: 'healthy',
    provider: config.provider,
    model: config.model,
    timestamp: new Date().toISOString(),
  });
}
