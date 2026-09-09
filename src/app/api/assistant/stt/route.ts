import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 2_500_000; // ~2.5MB utterance cap
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

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
      { error: "Speech-to-text unavailable (XAI_API_KEY missing).", unavailable: true },
      { status: 503 },
    );
  }
  if (!rateLimit(clientKey(req))) {
    return NextResponse.json({ error: "STT rate limit exceeded." }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const language = String(form.get("language") || "en");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Audio file required." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Audio too large." }, { status: 413 });
    }

    const outbound = new FormData();
    outbound.append("file", file, "utterance.webm");
    if (language) outbound.append("language", language === "zh" ? "zh" : language === "es" ? "es" : "en");

    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outbound,
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("xAI STT error:", res.status, detail.slice(0, 400));
      return NextResponse.json({ error: "Transcription failed." }, { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    // Do not persist raw mic audio — only return transcript text.
    return NextResponse.json({ text: (data.text || "").trim() });
  } catch (error) {
    console.error("STT proxy error:", error);
    return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
  }
}
