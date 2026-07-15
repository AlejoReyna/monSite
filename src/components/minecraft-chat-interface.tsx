"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import { useChat } from "@/hooks/useChat";
import {
  detectEnhancedIntent,
  buildEnhancedHint,
  ENHANCED_PLACEHOLDERS,
} from "./data/chat-enhancements";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Intent =
  | "casual"
  | "work"
  | "about"
  | "projects"
  | "contact"
  | "music"
  | "travel"
  | "tech";

const UI_LABELS: Record<Language, {
  intro: string;
  autoName: string;
  visitor: string;
  joined: string;
  spam: string;
}> = {
  es: {
    intro: "Hola, soy Alexis_Bot. Pregúntame lo que quieras.",
    autoName: "Visitante",
    visitor: "Visitante",
    joined: " se unió al servidor",
    spam: "[SPAM] Espera un momento.",
  },
  en: {
    intro: "Hey, I'm Alexis_Bot. Ask me anything.",
    autoName: "Visitor",
    visitor: "Visitor",
    joined: " joined the server",
    spam: "[SPAM] Wait a moment.",
  },
  zh: {
    intro: "嘿，我是 Alexis_Bot。随便问我。",
    autoName: "访客",
    visitor: "访客",
    joined: " 加入了服务器",
    spam: "[SPAM] 请稍等。",
  },
};

/* ─────────────────────────────────────────────
   Minecraft colour palette (§ codes)
───────────────────────────────────────────── */
const MC = {
  white:    "#FFFFFF",
  yellow:   "#FFFF55",
  aqua:     "#55FFFF",
  green:    "#55FF55",
  red:      "#FF5555",
  gray:     "#AAAAAA",
  darkGray: "#555555",
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const HINT_START = "[[SYS]]";
const HINT_END   = "[[/SYS]]";

const stripHint = (raw: unknown) => {
  const text = (raw ?? "").toString();
  if (text.startsWith(HINT_START)) {
    const end = text.indexOf(HINT_END);
    if (end !== -1) {
      let out = text.slice(end + HINT_END.length);
      if (out.startsWith("\r\n")) out = out.slice(2);
      else if (out.startsWith("\n")) out = out.slice(1);
      return out;
    }
  }
  return text;
};

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/* ─────────────────────────────────────────────
   Tiny sub-components
───────────────────────────────────────────── */
function MCCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.85em",
        background: MC.white,
        marginLeft: 2,
        verticalAlign: "middle",
        animation: "mc-blink 1s step-end infinite",
      }}
    />
  );
}

function TypingDots() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            animation: `mc-dot 1.2s ${i * 0.3}s ease-in-out infinite`,
            marginRight: 1,
            color: MC.gray,
          }}
        >
          ■
        </span>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function MinecraftChatInterface() {
  const { language: lang } = useLanguage();
  const labels = UI_LABELS[lang];

  /* ── state ── */
  const [userName, setUserName]     = useState("");
  const [showChat, setShowChat]     = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState(
    ENHANCED_PLACEHOLDERS[lang][0]
  );
  const [introDisplayed, setIntroDisplayed] = useState("");
  const [introDone, setIntroDone]           = useState(false);
  const [joinTime]                          = useState(() => fmt(new Date()));

  const { messages, isLoading, error, sendMessage, isRateLimit } = useChat(userName);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  /* ── session restore ── */
  useEffect(() => {
    try {
      const name = (localStorage.getItem("userName") || "").trim();
      if (name) setUserName(name);
      if (name) setShowChat(true);
    } catch { /* noop */ }
  }, []);

  /* ── cycling placeholder ── */
  const pickPlaceholder = useCallback(() => {
    const pool = ENHANCED_PLACEHOLDERS[lang];
    setPlaceholder(pool[Math.floor(Math.random() * pool.length)]);
  }, [lang]);

  useEffect(() => {
    pickPlaceholder();
    const id = setInterval(pickPlaceholder, 5000);
    return () => clearInterval(id);
  }, [pickPlaceholder]);

  /* ── autoscroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  /* ── intro typewriter ── */
  const introText = labels.intro;

  useEffect(() => {
    if (showChat) return;
    let i = 0;
    setIntroDisplayed("");
    setIntroDone(false);
    const id = setInterval(() => {
      if (i < introText.length) { setIntroDisplayed(introText.slice(0, ++i)); }
      else { clearInterval(id); setIntroDone(true); }
    }, 35);
    return () => clearInterval(id);
  }, [introText, showChat]);

  /* ── send ── */
  const handleSend = () => {
    const raw = inputValue.trim();
    if (!raw || isLoading) return;
    const name = userName || labels.autoName;
    if (!userName) {
      setUserName(name);
      try { localStorage.setItem("userName", name); } catch {}
    }
    const intent = detectEnhancedIntent(raw, lang);
    sendMessage(buildEnhancedHint(intent as Intent, lang) + "\n" + raw);
    setInputValue("");
    if (!showChat) setShowChat(true);
    pickPlaceholder();
  };

  const sorted      = [...messages].sort((a, b) => +a.timestamp - +b.timestamp);
  const visitorName = userName || labels.visitor;

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        .mc-root, .mc-root * {
          font-family: 'VT323', 'Courier New', monospace;
          box-sizing: border-box;
        }

        @keyframes mc-blink {
          0%, 49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        @keyframes mc-dot {
          0%,100% { opacity: 0.2; transform: scaleY(0.7); }
          50%     { opacity: 1;   transform: scaleY(1.1); }
        }
        @keyframes mc-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .mc-text {
          font-family: 'VT323', monospace;
          font-size: 17px;
          line-height: 1.35;
          color: #FFFFFF;
          text-shadow: 2px 2px 0px #3f3f3f;
          word-break: break-word;
        }

        .mc-message {
          animation: mc-fadein 0.12s ease-out both;
          margin-bottom: 1px;
        }

        /* scrollbar */
        .mc-scroll::-webkit-scrollbar       { width: 4px; }
        .mc-scroll::-webkit-scrollbar-track { background: transparent; }
        .mc-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }

        /* input */
        .mc-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          color: #FFFFFF;
          font-family: 'VT323', monospace;
          font-size: 17px;
          text-shadow: 2px 2px 0px #3f3f3f;
          outline: none;
          caret-color: #FFFFFF;
        }
        .mc-input::placeholder {
          color: rgba(255,255,255,0.28);
          text-shadow: none;
        }
        .mc-input:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="mc-root" style={{ width: "100%", maxWidth: 504 }}>
        {/* ── bare semi-transparent panel ── */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            padding: "5px 6px 4px",
          }}
        >
          {/* messages */}
          <div
            className="mc-scroll"
            style={{
              overflowY: "auto",
              overflowX: "hidden",
              maxHeight: 324,
              marginBottom: 3,
            }}
          >
            {/* server join line */}
            <div className="mc-message mc-text" style={{ color: MC.yellow }}>
              [{joinTime}]&nbsp;
              <span style={{ color: MC.green }}>Alexis_Bot</span>
              <span style={{ color: MC.white }}>
                {labels.joined}
              </span>
            </div>

            {/* intro typewriter (only before first real chat) */}
            {!showChat && (
              <div className="mc-message mc-text">
                <span style={{ color: MC.gray }}>[{joinTime}]&nbsp;</span>
                <span style={{ color: MC.green }}>Alexis_Bot</span>
                <span style={{ color: MC.white }}>:&nbsp;</span>
                <span style={{ color: MC.white }}>
                  {introDisplayed || introText}
                  {!introDone && <MCCursor />}
                </span>
              </div>
            )}

            {/* conversation */}
            {sorted.map((m) => {
              const isUser  = m.role === "user";
              const key     = (m.id ?? String(+m.timestamp)) as string;
              const content = isUser ? stripHint(m.content) : (m.content ?? "");
              const time    = fmt(m.timestamp);
              return (
                <div key={key} className="mc-message mc-text">
                  <span style={{ color: MC.gray }}>[{time}]&nbsp;</span>
                  {isUser ? (
                    <>
                      <span style={{ color: MC.aqua }}>{visitorName}</span>
                      <span style={{ color: MC.white }}>:&nbsp;{content}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: MC.green }}>Alexis_Bot</span>
                      <span style={{ color: MC.white }}>:&nbsp;{content}</span>
                    </>
                  )}
                </div>
              );
            })}

            {/* typing indicator */}
            {isLoading && (
              <div className="mc-message mc-text">
                <span style={{ color: MC.gray }}>
                  [{fmt(new Date())}]&nbsp;
                </span>
                <span style={{ color: MC.green }}>Alexis_Bot</span>
                <span style={{ color: MC.gray }}>:&nbsp;</span>
                <TypingDots />
              </div>
            )}

            {/* error */}
            {error && (
              <div className="mc-message mc-text" style={{ color: MC.red }}>
                [{fmt(new Date())}]&nbsp;
                {isRateLimit
                  ? labels.spam
                  : `[ERROR] ${error}`}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── input row ── */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.15)",
              paddingTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="mc-text" style={{ color: MC.gray, flexShrink: 0 }}>
              {visitorName}:
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleSend(); }
              }}
              placeholder={placeholder}
              className="mc-input"
              disabled={isLoading}
              maxLength={500}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
