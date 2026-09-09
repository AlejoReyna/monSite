import { NextResponse } from "next/server";

function hasKimi() {
  return Boolean(process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY);
}

function hasXai() {
  return Boolean(process.env.XAI_API_KEY);
}

export async function GET() {
  const kimi = hasKimi();
  const xai = hasXai();
  return NextResponse.json({
    available: kimi,
    kimi,
    stt: xai,
    tts: xai,
    assistantName: "Orbit",
    timestamp: new Date().toISOString(),
  });
}
