import { NextRequest, NextResponse } from "next/server";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const hits = new Map<string, { count: number; resetAt: number }>();
const VOICES = new Set(["eve", "ara", "leo", "rex", "sal", "luna"]);

function clientKey(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Text-to-speech unavailable (XAI_API_KEY missing).", unavailable: true },
      { status: 503 },
    );
  }
  if (!rateLimit(clientKey(req))) {
    return NextResponse.json({ error: "TTS rate limit exceeded." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as { text?: string; voice?: string; language?: string };
    const text = (body.text || "").trim().slice(0, 1500);
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    const voice = VOICES.has(body.voice || "") ? body.voice : "eve";
    const language =
      body.language === "zh" ? "zh" : body.language === "es" ? "es-MX" : "en";

    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voice,
        language,
        output_format: { codec: "mp3", sample_rate: 24000 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("xAI TTS error:", res.status, detail.slice(0, 400));
      return NextResponse.json({ error: "Speech synthesis failed." }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { audio?: string; content_type?: string };
      if (!data.audio) return NextResponse.json({ error: "No audio returned." }, { status: 502 });
      const bytes = Buffer.from(data.audio, "base64");
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": data.content_type || "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS proxy error:", error);
    return NextResponse.json({ error: "Speech synthesis failed." }, { status: 500 });
  }
}
