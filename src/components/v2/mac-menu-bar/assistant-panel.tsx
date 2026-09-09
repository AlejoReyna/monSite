"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { dispatchDesktopAction, useDesktopStore } from "@/lib/desktop/desktop-store";
import { ASSISTANT_NAME, type AssistantState } from "@/lib/desktop/types";
import styles from "./menu-bar.module.css";
import { useOutsideClick } from "./use-menu-dismiss";

type TranscriptLine = { role: "user" | "assistant" | "system"; text: string };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const MAX_RECORD_MS = 20_000;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speechLang(language: string) {
  if (language === "es") return "es-MX";
  if (language === "zh") return "zh-CN";
  return "en-US";
}

/** Split reply into speakable sentence phrases. Never feed tool JSON here. */
function splitPhrases(text: string): string[] {
  return text
    .split(/(?<=[.?!…])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

async function playAudioBuffer(buffer: ArrayBuffer, signal: AbortSignal) {
  const blob = new Blob([buffer], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  try {
    const audio = new Audio(url);
    if (signal.aborted) return;
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        audio.pause();
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AssistantOrbButton() {
  const { openMenu, setOpenMenu, assistantState } = useDesktopStore();
  const open = openMenu === "assistant";
  return (
    <button
      type="button"
      className={styles.iconBtn}
      aria-label={ASSISTANT_NAME}
      aria-expanded={open}
      onClick={() => setOpenMenu(open ? null : "assistant")}
    >
      <span
        className={`${styles.orb} ${
          assistantState === "listening"
            ? styles.orbListening
            : assistantState === "thinking" || assistantState === "executing"
              ? styles.orbThinking
              : ""
        }`.trim()}
        aria-hidden="true"
      />
    </button>
  );
}

export function AssistantPanel() {
  const { language } = useLanguage();
  const store = useDesktopStore();
  const open = store.openMenu === "assistant";
  const rootRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [micDenied, setMicDenied] = useState(false);
  const [interim, setInterim] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const sttAbortRef = useRef<AbortController | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  /** When true, MediaRecorder.onstop must NOT call STT / runTurn. */
  const discardRecordingRef = useRef(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const clearMaxTimer = () => {
    if (maxTimerRef.current != null) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  };

  const stopSpeechRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      }
    }
    setInterim("");
  }, []);

  /**
   * Discard capture + abort in-flight assistant/TTS/STT.
   * Close / unmount / Stop use this — onstop must not send.
   */
  const stopAll = useCallback(
    (opts?: { interrupted?: boolean }) => {
      discardRecordingRef.current = true;
      abortRef.current?.abort();
      abortRef.current = null;
      sttAbortRef.current?.abort();
      sttAbortRef.current = null;
      clearMaxTimer();
      stopSpeechRecognition();
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        try {
          mediaRef.current.stop();
        } catch {
          /* already stopped */
        }
      }
      mediaRef.current = null;
      chunksRef.current = [];
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      storeRef.current.setAssistantState(opts?.interrupted ? "interrupted" : "idle");
    },
    [stopSpeechRecognition],
  );

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => stopAll(), 0);
    return () => window.clearTimeout(timer);
  }, [open, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  const copy =
    language === "es"
      ? {
          title: ASSISTANT_NAME,
          subtitle: "Asistente del portafolio — no es Siri de Apple",
          placeholder: "Escribe una solicitud…",
          send: "Enviar",
          stop: "Detener",
          close: "Cerrar",
          listening: "Escuchando…",
          thinking: "Pensando…",
          executing: "Ejecutando…",
          speaking: "Hablando…",
          error: "Algo falló",
          unavailable: "Asistente no disponible (faltan credenciales del servidor).",
          micDenied: "Micrófono denegado — puedes usar texto.",
          tapToSend: "Toca el micrófono para enviar",
          suggestions: [
            "¿Qué proyectos has construido?",
            "Abre proyectos",
            "Llévame a contacto",
            "Cambia el idioma a inglés",
          ],
        }
      : language === "zh"
        ? {
            title: ASSISTANT_NAME,
            subtitle: "作品集助手 — 不是 Apple Siri",
            placeholder: "输入请求…",
            send: "发送",
            stop: "停止",
            close: "关闭",
            listening: "正在聆听…",
            thinking: "思考中…",
            executing: "执行中…",
            speaking: "播报中…",
            error: "出错了",
            unavailable: "助手不可用（服务器缺少凭证）。",
            micDenied: "麦克风被拒绝 — 仍可使用文字。",
            tapToSend: "再点麦克风以发送",
            suggestions: ["你做过哪些项目？", "打开项目", "带我去联系页", "把语言改成英语"],
          }
        : {
            title: ASSISTANT_NAME,
            subtitle: "Portfolio assistant — not Apple Siri",
            placeholder: "Type a request…",
            send: "Send",
            stop: "Stop",
            close: "Close",
            listening: "Listening…",
            thinking: "Thinking…",
            executing: "Executing…",
            speaking: "Speaking…",
            error: "Something went wrong",
            unavailable: "Assistant unavailable (server credentials missing).",
            micDenied: "Microphone denied — text still works.",
            tapToSend: "Tap mic again to send",
            suggestions: [
              "What projects have you built?",
              "Open projects",
              "Take me to contact",
              "Change language to English",
            ],
          };

  const stateLabel = (state: AssistantState) => {
    switch (state) {
      case "listening":
        return copy.listening;
      case "thinking":
        return copy.thinking;
      case "executing":
        return copy.executing;
      case "speaking":
        return copy.speaking;
      case "error":
        return copy.error;
      case "interrupted":
        return copy.stop;
      default:
        return store.assistantAvailable === false ? copy.unavailable : `${ASSISTANT_NAME} ready`;
    }
  };

  const speakReply = async (reply: string, controller: AbortController) => {
    // Phrase-sequential TTS via existing HTTP endpoint.
    // Full xAI WebSocket streaming STT/TTS proxy is not in this pass.
    const phrases = splitPhrases(reply);
    const queue = phrases.length ? phrases : [reply];
    for (const phrase of queue) {
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const tts = await fetch("/api/assistant/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          text: phrase.slice(0, 1200),
          voice: storeRef.current.preferences.assistantVoice,
          language,
        }),
      });
      if (!tts.ok) continue;
      const buffer = await tts.arrayBuffer();
      await playAudioBuffer(buffer, controller.signal);
    }
  };

  const runTurn = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    stopAll();
    const controller = new AbortController();
    abortRef.current = controller;
    setLines((prev) => [...prev, { role: "user", text: trimmed }]);
    storeRef.current.setAssistantState("thinking");
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ message: trimmed, language }),
      });
      const data = (await res.json()) as {
        reply?: string;
        actions?: Array<{ type: string; args?: Record<string, unknown> }>;
        error?: string;
        unavailable?: boolean;
      };
      if (!res.ok) {
        storeRef.current.setAssistantState("error");
        setLines((prev) => [
          ...prev,
          { role: "system", text: data.error || (data.unavailable ? copy.unavailable : copy.error) },
        ]);
        return;
      }
      if (data.actions?.length) {
        storeRef.current.setAssistantState("executing");
        for (const action of data.actions) {
          dispatchDesktopAction(action.type, action.args);
        }
      }
      // Speak only the natural-language reply — never tool payloads / action JSON.
      const reply = data.reply?.trim() || "";
      if (reply) {
        setLines((prev) => [...prev, { role: "assistant", text: reply }]);
        storeRef.current.setAssistantState("speaking");
        try {
          await speakReply(reply, controller);
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            storeRef.current.setAssistantState("interrupted");
            return;
          }
        }
      }
      storeRef.current.setAssistantState("idle");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        storeRef.current.setAssistantState("interrupted");
        return;
      }
      storeRef.current.setAssistantState("error");
      setLines((prev) => [...prev, { role: "system", text: copy.error }]);
    }
  };

  /** Intentional commit: stop recorder so onstop runs STT + runTurn. */
  const commitListening = useCallback(() => {
    discardRecordingRef.current = false;
    clearMaxTimer();
    stopSpeechRecognition();
    if (mediaRef.current && mediaRef.current.state === "recording") {
      try {
        mediaRef.current.stop();
      } catch {
        /* already stopped */
      }
    }
  }, [stopSpeechRecognition]);

  const startLiveCaptions = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    // Interim captions only — authoritative transcript still comes from xAI STT on commit.
    try {
      const rec = new Ctor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = speechLang(language);
      rec.onresult = (event) => {
        let live = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          live += event.results[i][0]?.transcript ?? "";
        }
        setInterim(live.trim());
      };
      rec.onerror = () => {
        /* non-fatal; xAI STT remains the commit path */
      };
      rec.onend = () => {
        /* browser may end early; leave interim as-is until commit/discard */
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      recognitionRef.current = null;
    }
  }, [language]);

  const startListening = async () => {
    if (storeRef.current.assistantAvailable === false) {
      setLines((prev) => [...prev, { role: "system", text: copy.unavailable }]);
      return;
    }
    // Abort any prior turn/TTS, discard leftover capture, then start fresh.
    stopAll();
    discardRecordingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (streamRef.current === stream) streamRef.current = null;
        const discarded = discardRecordingRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (mediaRef.current === recorder) mediaRef.current = null;
        if (discarded) {
          // Discard path: Close / Stop / unmount — do NOT STT or runTurn.
          return;
        }
        if (blob.size < 400) {
          storeRef.current.setAssistantState("idle");
          return;
        }
        storeRef.current.setAssistantState("thinking");
        const sttController = new AbortController();
        sttAbortRef.current = sttController;
        try {
          const form = new FormData();
          form.append("file", blob, "utterance.webm");
          form.append("language", language);
          const stt = await fetch("/api/assistant/stt", {
            method: "POST",
            body: form,
            signal: sttController.signal,
          });
          const data = (await stt.json()) as { text?: string; error?: string; unavailable?: boolean };
          if (!stt.ok || !data.text) {
            storeRef.current.setAssistantState("error");
            setLines((prev) => [
              ...prev,
              { role: "system", text: data.error || (data.unavailable ? copy.unavailable : copy.error) },
            ]);
            return;
          }
          await runTurn(data.text);
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            storeRef.current.setAssistantState("interrupted");
            return;
          }
          storeRef.current.setAssistantState("error");
        } finally {
          if (sttAbortRef.current === sttController) sttAbortRef.current = null;
        }
      };
      recorder.start();
      storeRef.current.setAssistantState("listening");
      startLiveCaptions();
      // Max duration COMMITS (sends) — not discard. Manual mic tap also commits.
      clearMaxTimer();
      maxTimerRef.current = window.setTimeout(() => {
        maxTimerRef.current = null;
        if (mediaRef.current && mediaRef.current.state === "recording") {
          commitListening();
        }
      }, MAX_RECORD_MS);
    } catch {
      setMicDenied(true);
      storeRef.current.setAssistantState("idle");
    }
  };

  const onMicClick = () => {
    const state = storeRef.current.assistantState;
    if (state === "listening") {
      // Manual stop-to-send
      commitListening();
      return;
    }
    // Barge-in: starting mic while speaking/thinking aborts then listens.
    if (state === "speaking" || state === "thinking" || state === "executing") {
      stopAll({ interrupted: true });
    }
    void startListening();
  };

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className={`${styles.popover} ${styles.menuRight} ${styles.assistantPanel}`}
      role="dialog"
      aria-modal="true"
      aria-label={ASSISTANT_NAME}
    >
      <div className={styles.stateLabel}>
        <span
          className={`${styles.orb} ${
            store.assistantState === "listening" ? styles.orbListening : ""
          }`.trim()}
          aria-hidden="true"
        />
        <div>
          <strong>{copy.title}</strong>
          <div>{copy.subtitle}</div>
          <div>{stateLabel(store.assistantState)}</div>
          {store.assistantState === "listening" && <div>{copy.tapToSend}</div>}
        </div>
      </div>
      <div className={styles.transcript} aria-live="polite">
        {lines.map((line, i) => (
          <p key={`${line.role}-${i}`}>
            <strong>{line.role === "user" ? "You" : line.role === "assistant" ? ASSISTANT_NAME : "System"}:</strong>{" "}
            {line.text}
          </p>
        ))}
        {interim && store.assistantState === "listening" && (
          <p>
            <strong>You:</strong> <em>{interim}</em>
          </p>
        )}
      </div>
      {micDenied && <div className={styles.stateLabel}>{copy.micDenied}</div>}
      <div className={styles.suggestions}>
        {copy.suggestions.map((s) => (
          <button key={s} type="button" onClick={() => void runTurn(s)}>
            {s}
          </button>
        ))}
      </div>
      <form
        className={styles.assistantInputRow}
        onSubmit={(event) => {
          event.preventDefault();
          const value = input;
          setInput("");
          void runTurn(value);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.placeholder}
        />
        <button type="submit">{copy.send}</button>
        <button
          type="button"
          aria-label="Microphone"
          aria-pressed={store.assistantState === "listening"}
          onClick={onMicClick}
        >
          <Mic size={16} />
        </button>
      </form>
      <div className={styles.assistantActions} style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            stopAll({ interrupted: true });
          }}
        >
          <Square size={14} /> {copy.stop}
        </button>
        <button
          type="button"
          onClick={() => {
            stopAll();
            store.setOpenMenu(null);
          }}
        >
          <X size={14} /> {copy.close}
        </button>
      </div>
    </div>
  );
}

export function AssistantControl() {
  const store = useDesktopStore();
  const open = store.openMenu === "assistant";
  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideClick(open, () => {
    store.setOpenMenu(null);
  }, rootRef);

  return (
    <div className={styles.item} style={{ position: "relative" }} ref={rootRef}>
      <AssistantOrbButton />
      <AssistantPanel />
    </div>
  );
}
