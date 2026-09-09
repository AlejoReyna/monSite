import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { cookies } from "next/headers";
import type { Language } from "@/components/lang-context";
import {
  ASSISTANT_TOOLS,
  answerFromCurated,
  explainProjectText,
  parseToolCall,
} from "@/lib/desktop/actions";
import { buildAssistantSystemPrompt, findProject } from "@/lib/desktop/portfolio-content";
import {
  QUOTA_COOKIE,
  WINDOW_MS,
  allowIpTurn,
  clientIp,
  decodeQuotaCookie,
  encodeQuotaCookie,
} from "@/lib/desktop/orbit-quota";

function resolveKimi() {
  const apiKey = process.env.MOONSHOT_API_KEY ?? process.env.KIMI_API_KEY;
  return {
    apiKey,
    baseURL: process.env.KIMI_BASE_URL ?? "https://api.moonshot.ai/v1",
    model: process.env.KIMI_MODEL ?? "kimi-k2.6",
  };
}

function isLang(value: unknown): value is Language {
  return value === "en" || value === "es" || value === "zh";
}

async function readQuota() {
  const store = await cookies();
  return decodeQuotaCookie(store.get(QUOTA_COOKIE)?.value);
}

/** Kimi accepts a provider-specific `thinking` field; cast keeps OpenAI SDK types satisfied. */
async function kimiChat(
  client: OpenAI,
  model: string,
  body: Omit<OpenAI.ChatCompletionCreateParamsNonStreaming, "model">,
) {
  const payload = {
    model,
    ...body,
    thinking: { type: "disabled" as const },
  };
  return client.chat.completions.create(
    payload as OpenAI.ChatCompletionCreateParamsNonStreaming,
  );
}

export async function POST(req: NextRequest) {
  const kimi = resolveKimi();
  if (!kimi.apiKey) {
    return NextResponse.json(
      {
        error: "Orbit is unavailable because Kimi credentials are not configured on the server.",
        unavailable: true,
      },
      { status: 503 },
    );
  }

  // Cookie HMAC is not enough — also enforce a server-side IP budget (same idea as STT).
  if (!allowIpTurn(clientIp(req))) {
    return NextResponse.json(
      { error: "Orbit rate limit exceeded. Try again shortly." },
      { status: 429 },
    );
  }

  let body: { message?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message || "").toString().trim().slice(0, 1200);
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  const language: Language = isLang(body.language) ? body.language : "en";

  const quota = await readQuota();
  if (quota.remaining <= 0) {
    return NextResponse.json(
      {
        error: "Orbit turn limit reached. Try again later.",
        retryAt: new Date(quota.resetAt).toISOString(),
      },
      { status: 429 },
    );
  }

  const client = new OpenAI({
    apiKey: kimi.apiKey,
    baseURL: kimi.baseURL,
    fetch: (url: RequestInfo, init?: RequestInit) => fetch(url, init),
  });

  const system = buildAssistantSystemPrompt(language);
  const actions: Array<{ type: string; args?: Record<string, unknown> }> = [];
  let reply = "";

  try {
    const completion = await kimiChat(client, kimi.model, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
      temperature: 1,
      max_tokens: 800,
    });

    const choice = completion.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];

    if (toolCalls.length) {
      const followups: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: system },
        { role: "user", content: message },
        {
          role: "assistant",
          content: choice?.content || null,
          tool_calls: toolCalls,
        },
      ];

      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const parsed = parseToolCall(call.function.name, call.function.arguments);
        if ("error" in parsed) {
          followups.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ ok: false, error: parsed.error }),
          });
          continue;
        }

        let toolResult: Record<string, unknown> = { ok: true, action: parsed.type };

        switch (parsed.type) {
          case "answer_portfolio":
            toolResult = {
              ok: true,
              text: answerFromCurated(parsed.args.topic, language),
            };
            break;
          case "explain_project": {
            const project = findProject(parsed.args.projectId);
            toolResult = project
              ? { ok: true, text: explainProjectText(project, language) }
              : { ok: false, error: "Project not found" };
            break;
          }
          case "open_projects":
          case "navigate_contact":
          case "open_terminal":
          case "change_language":
          case "toggle_focus":
            actions.push({
              type: parsed.type,
              args: "args" in parsed ? (parsed.args as Record<string, unknown>) : {},
            });
            toolResult = { ok: true, queued: parsed.type };
            break;
          default:
            break;
        }

        followups.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }

      const second = await kimiChat(client, kimi.model, {
        messages: followups,
        temperature: 1,
        max_tokens: 600,
      });
      reply = second.choices[0]?.message?.content?.trim() || "";

      if (!reply) {
        const answerTool = toolCalls.find(
          (c) => c.type === "function" && c.function.name === "answer_portfolio",
        );
        const explainTool = toolCalls.find(
          (c) => c.type === "function" && c.function.name === "explain_project",
        );
        if (explainTool && explainTool.type === "function") {
          const parsed = parseToolCall("explain_project", explainTool.function.arguments);
          if (!("error" in parsed) && parsed.type === "explain_project") {
            const project = findProject(parsed.args.projectId);
            if (project) reply = explainProjectText(project, language);
          }
        } else if (answerTool && answerTool.type === "function") {
          const parsed = parseToolCall("answer_portfolio", answerTool.function.arguments);
          if (!("error" in parsed) && parsed.type === "answer_portfolio") {
            reply = answerFromCurated(parsed.args.topic, language);
          }
        } else if (actions.length) {
          reply = language === "es" ? "Listo." : language === "zh" ? "好的。" : "Done.";
        }
      }
    } else {
      reply = choice?.content?.trim() || answerFromCurated(message, language);
    }

    const res = NextResponse.json({
      reply,
      actions,
      model: kimi.model,
      provider: "kimi",
      assistantName: "Orbit",
    });

    quota.remaining -= 1;
    res.cookies.set(QUOTA_COOKIE, encodeQuotaCookie(quota), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: Math.floor(WINDOW_MS / 1000),
    });
    return res;
  } catch (error) {
    console.error("Orbit assistant error:", error);
    return NextResponse.json({ error: "Orbit failed to respond." }, { status: 500 });
  }
}

export async function GET() {
  const kimi = resolveKimi();
  return NextResponse.json({
    status: kimi.apiKey ? "healthy" : "unhealthy",
    provider: "kimi",
    model: kimi.model,
    available: Boolean(kimi.apiKey),
  });
}
