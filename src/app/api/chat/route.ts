// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cookies } from 'next/headers';
import type { Language } from '@/components/lang-context';

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
      maxTokens: 2500,
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
const HINT_START = '[[SYS]]';
const HINT_END = '[[/SYS]]';

function stripHintBlock(raw: unknown): string {
  const text = (raw ?? '').toString();
  if (text.startsWith(HINT_START)) {
    const end = text.indexOf(HINT_END);
    if (end !== -1) {
      let out = text.slice(end + HINT_END.length);
      if (out.startsWith('\r\n')) out = out.slice(2);
      else if (out.startsWith('\n')) out = out.slice(1);
      return out;
    }
  }
  return text;
}

/**
 * Extract the content *inside* a [[SYS]]...[[/SYS]] block.
 * Returns null if no hint block is present.
 */
function extractHintContent(raw: unknown): string | null {
  const text = (raw ?? '').toString();
  const startIdx = text.indexOf(HINT_START);
  const endIdx = text.indexOf(HINT_END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.slice(startIdx + HINT_START.length, endIdx).trim();
  }
  return null;
}

/**
 * Detect the requested response language from the injected hint block.
 * Falls back to Spanish if no hint is present.
 */
function detectLanguageFromHint(messages: ChatMessage[]): Language {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'es';
  const raw = lastUser.content;
  if (raw.includes('Responde ÚNICAMENTE en')) {
    if (raw.includes('中文')) return 'zh';
    if (raw.includes('ESPAÑOL')) return 'es';
    if (raw.includes('ENGLISH')) return 'en';
  }
  return 'es';
}

const MAX_PROMPTS = 20;
const WINDOW_MS = 2.5 * 60 * 60 * 1000; // 2.5h -> 9_000_000 ms

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
 * Developer persona para Responses API
 * — breve, directo, tuteo, y con tus rutas de portfolio/contacto
 */
const PORTFOLIO_CONTEXT = `
PORTFOLIO PANELS (alexisreyna.dev):
1. Hero — AI chat terminal (this conversation)
2. This Cafetería — Blockchain agentic commerce platform (Solidity, .NET, React)
3. Plebes — Social platform for community
4. NoNamedBot — Discord/Telegram bot project
5. Wedding Service — Wedding planning & coordination platform
6. Contact — "Let's talk" form

PROJECTS: Link users to scroll down or visit specific panels.
If they ask "what have you built?" → mention these projects with brief descriptions.
`;

const DEVELOPER_PERSONA: Record<Language, string> = {
  es: `Eres Alexis, desarrollador full-stack mexicano, nacido en Montemorelos, Nuevo León. Tono breve, directo y amable; tuteo; respuesta primero, tecnologías React/Next.js/TS/Node/PostgreSQL/Rails/AWS/Docker/Linux; si piden proyectos -> /portfolio; contacto -> /contacto o alexis.reynasz@hotmail.com; no inventes; idioma del usuario o español por defecto.\nFormato: texto plano, sin markdown (sin **, sin #, sin listas con -). Escribe como en un chat informal.\n${PORTFOLIO_CONTEXT}`,
  en: `You are Alexis, a Mexican full-stack developer from Montemorelos, Nuevo León. Tone: brief, direct, and friendly; use "you"; answer first, then 1–3 bullets if they add value; technologies React/Next.js/TS/Node/PostgreSQL/Rails/AWS/Docker/Linux; projects -> /portfolio; contact -> /contacto or alexis.reynasz@hotmail.com; don't make things up; user's language or English by default.\nFormat: plain text only, no markdown (no **, no #, no lists with -). Write as in a casual chat.\n${PORTFOLIO_CONTEXT}`,
  zh: `你是 Alexis，一名来自墨西哥 Nuevo León 州 Montemorelos 的全栈开发者。语气简短、直接、友好；使用"你"称呼；先给出回答，然后视情况补充 1–3 个要点；技术栈 React/Next.js/TS/Node/PostgreSQL/Rails/AWS/Docker/Linux; 若询问项目 -> /portfolio；若联系 -> /contacto 或 alexis.reynasz@hotmail.com；不要编造；使用用户的语言，默认西班牙语。\n格式：纯文本，不使用 markdown（不用 **、#、- 列表）。像在聊天中一样书写。\n${PORTFOLIO_CONTEXT}`,
};

const NAME_NOTE: Record<Language, string> = {
  es: 'El usuario se llama {userName}. Usa su nombre naturalmente.',
  en: "The user's name is {userName}. Use it naturally.",
  zh: '用户名为 {userName}。自然地使用这个名字。',
};

const NO_CONTENT: Record<Language, string> = {
  es: 'No obtuve contenido.',
  en: 'No content received.',
  zh: '未获取到内容。',
};

const ERROR_MESSAGES: Record<Language, Record<string, string>> = {
  es: {
    apiKeyMissing: 'API key no configurada (provider: {provider})',
    invalidJson: 'JSON inválido en el cuerpo del request',
    messagesRequired: 'Mensajes requeridos (array)',
    quotaExceeded: 'Has alcanzado el límite de {max} prompts en 2h 30m.',
    rateLimit: 'Rate limit alcanzado. Intenta más tarde.',
    invalidApiKey: 'API key inválida',
    modelNotAvailable: 'Modelo no disponible para tu cuenta',
    internalError: 'Error interno del servidor',
    bypassActivated: 'Bypass activado: sin límite de prompts en esta sesión.',
  },
  en: {
    apiKeyMissing: 'API key not configured (provider: {provider})',
    invalidJson: 'Invalid JSON in request body',
    messagesRequired: 'Messages required (array)',
    quotaExceeded: 'You have reached the limit of {max} prompts in 2h 30m.',
    rateLimit: 'Rate limit reached. Try again later.',
    invalidApiKey: 'Invalid API key',
    modelNotAvailable: 'Model not available for your account',
    internalError: 'Internal server error',
    bypassActivated: 'Bypass activated: no prompt limit for this session.',
  },
  zh: {
    apiKeyMissing: '未配置 API 密钥（provider: {provider}）',
    invalidJson: '请求体中的 JSON 无效',
    messagesRequired: '需要消息（数组）',
    quotaExceeded: '你已达到 {max} 条消息的 2 小时 30 分钟限制。',
    rateLimit: '已达到速率限制。请稍后再试。',
    invalidApiKey: 'API 密钥无效',
    modelNotAvailable: '你的账户无法使用该模型',
    internalError: '服务器内部错误',
    bypassActivated: 'Bypass 已激活：本次会话无消息数量限制。',
  },
};

function localize(key: string, lang: Language, vars: Record<string, string> = {}): string {
  const template = ERROR_MESSAGES[lang]?.[key] ?? ERROR_MESSAGES.es[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'developer';
  content: string;
}

/**
 * Helper function to get output_text from Responses API
 */
function getOutputText(response: { output_text?: string }, lang: Language): string {
  return response.output_text || NO_CONTENT[lang];
}

export async function POST(req: NextRequest) {
  // 0) Validaciones de entorno
  const config = resolveProviderConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { error: localize('apiKeyMissing', 'es', { provider: config.provider }) },
      { status: 503 }
    );
  }

  // 1) Parse body primero (necesario para evaluar bypass incluso si ya no hay cuota)
  let body: { messages?: ChatMessage[]; userName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: localize('invalidJson', 'es') },
      { status: 400 }
    );
  }

  const { messages, userName } = body ?? {};
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: localize('messagesRequired', 'es') },
      { status: 400 }
    );
  }

  const lang = detectLanguageFromHint(messages);

  // 2) Bypass secreto: si el último mensaje de usuario es la frase mágica, activa bypass y responde
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const lastUserContent = stripHintBlock(lastUser?.content).trim().toLowerCase();
  if (lastUserContent === BYPASS_PHRASE) {
    const res = NextResponse.json({
      success: true,
      model: 'gpt-5-nano',
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

  // 3) Enforce cuota por sesión salvo que exista bypass activo
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

  // 3) Recortar historial para ahorrar tokens (últimas 4-8 mensajes)
  const SHORT_HISTORY = messages.slice(-8); // últimas 8 entradas
  // Truncar el último mensaje si es muy largo (≤1200 chars)
  const last = SHORT_HISTORY[SHORT_HISTORY.length - 1];
  if (last?.content && last.content.length > 1200) {
    last.content = last.content.slice(0, 1200);
  }

  // 4) Construir input para Responses API
  let developerContent = DEVELOPER_PERSONA[lang];
  if (userName) {
    developerContent += `\n\n${NAME_NOTE[lang].replace('{userName}', userName)}`;
  }

  // Convertir mensajes del historial a formato de texto, filtrando system messages
  const conversationHistory = SHORT_HISTORY
    .filter(msg => msg.role !== 'system')
    .map(msg =>
      `${msg.role === 'user' ? 'Usuario' : 'Alexis'}: ${msg.content}`
    ).join('\n\n');

  const input = `${developerContent}\n\n${conversationHistory}`;

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

    if (config.provider === 'kimi') {
      // 5a) Kimi uses chat.completions (OpenAI-compatible)
      // Extract the hint from the last user message and promote it to the system role
      const lastUserMsg = SHORT_HISTORY.filter(m => m.role === 'user').pop();
      const hintContent = extractHintContent(lastUserMsg?.content);
      const systemContent = hintContent
        ? `${developerContent}\n\n${hintContent}`
        : developerContent;

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemContent },
        ...SHORT_HISTORY
          .filter(msg => msg.role !== 'system')
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: stripHintBlock(msg.content),
          })),
      ];
      const completion = await client.chat.completions.create({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: 1,
      });
      text = completion.choices[0]?.message?.content ?? NO_CONTENT[lang];
      usage = completion.usage ?? null;
    } else {
      // 5b) OpenAI Responses API
      const resp = await client.responses.create({
        model: config.model,
        input,
      });
      text = getOutputText(resp, lang);
      usage = resp.usage ?? null;
    }

    // 6) Decrementar cuota y setear cookie (solo si NO hay bypass)
    const res = NextResponse.json({
      success: true,
      model: config.model,
      provider: config.provider,
      message: text,
      usage,
      quota: { remaining: quota.remaining, resetAt: quota.resetAt },
    });

    if (!hasBypass) {
      quota.remaining -= 1;
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
      { status: 'unhealthy', error: localize('apiKeyMissing', 'es', { provider: config.provider }) },
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
