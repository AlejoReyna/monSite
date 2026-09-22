"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Folder, Maximize2, Minimize2, Minus, Square, X } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { ContactEmailForm } from "@/components/contact-gateway";
import { useChat } from "@/hooks/useChat";
import { CURATED_PROJECTS } from "@/lib/desktop/portfolio-content";
import { dispatchDesktopAction } from "@/lib/desktop/desktop-store";
import { buildEnhancedHint, detectEnhancedIntent } from "./data/chat-enhancements";
import { TERMINAL_ABOUT, TERMINAL_COPY } from "@/lib/terminal/copy";
import { completeTerminalCommand, parseTerminalCommand, TERMINAL_COMMANDS, type TerminalCommand } from "@/lib/terminal/commands";
import styles from "./chat-interface.module.css";

type ChatInterfaceProps = {
  className?: string;
  terminalClassName?: string;
  variant?: "card" | "panel";
  theme?: "default" | "windows" | "mac" | "ubuntu";
  onClose?: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  maximized?: boolean;
  presentation?: "window" | "mind-sheet";
  onBusyChange?: (busy: boolean) => void;
  portraitSrc?: string | null;
  titleOverride?: string;
  compact?: boolean;
};

type LocalEntry = { id: string; timestamp: Date; command: string; kind: TerminalCommand | "unknown" | "opened"; output?: string };
const stripHint = (content: string) => content.replace(/^\[\[SYS\]\][\s\S]*?\[\[\/SYS\]\]\r?\n?/, "");

export default function ChatInterface({
  className, terminalClassName, variant = "card", theme = "default", onClose, onMinimize,
  onToggleMaximize, maximized = false, presentation = "window", onBusyChange,
  titleOverride, compact = false,
}: ChatInterfaceProps) {
  const { language } = useLanguage();
  const copy = TERMINAL_COPY[language];
  const chat = useChat();
  const [mode, setMode] = useState<"shell" | "assistant">("shell");
  const [input, setInput] = useState("");
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);
  const [welcome, setWelcome] = useState(true);
  const [menuId, setMenuId] = useState<string | null>("welcome");
  const [selection, setSelection] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const savedDraft = useRef("");
  const [unread, setUnread] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followOutput = useRef(true);
  const contactRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const busy = chat.isLoading;
  const isSheet = presentation === "mind-sheet";
  const lastUser = chat.messages.findLast(message => message.role === "user");
  const lastAssistant = chat.messages.findLast(message => message.role === "assistant");
  const announcement = busy ? copy.thinking : chat.error ? (chat.isRateLimit ? copy.rateLimit : copy.error) : lastUser?.outcome === "stopped" ? copy.stopped : lastAssistant?.content ?? "";
  const canRetry = !busy && (lastUser?.outcome === "failed" || lastUser?.outcome === "stopped");
  const latestContact = localEntries.findLast(entry => entry.kind === "/contact")?.id;
  const entries = [
    ...localEntries.map(entry => ({ source: "local" as const, entry })),
    ...chat.messages.map(entry => ({ source: "chat" as const, entry })),
  ].sort((a, b) => +a.entry.timestamp - +b.entry.timestamp);
  const menuItems = [
    { command: "/projects", label: copy.projects, hint: copy.projectHint },
    { command: "/about", label: copy.about, hint: copy.aboutHint },
    { command: "/contact", label: copy.contact, hint: copy.contactHint },
    { command: "/ai", label: copy.ai, hint: copy.aiHint },
  ];
  const commandDescriptions = [copy.help, copy.projects, copy.about, copy.contact, copy.ai, copy.menu, copy.clear, copy.exit];

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    // Keep the welcome screen at its beginning; only follow actual output.
    if (!chat.messages.length && !localEntries.length && !busy && !chat.error) return;
    if (followOutput.current) viewport.scrollTop = viewport.scrollHeight;
    else setUnread(true);
  }, [chat.messages, localEntries, busy, chat.error]);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
  }, [input]);

  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  const scrollToLatest = () => {
    followOutput.current = true;
    setUnread(false);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };
  const addEntry = (command: string, kind: LocalEntry["kind"], output?: string) => {
    const id = crypto.randomUUID();
    setLocalEntries(previous => [...previous, { id, timestamp: new Date(), command, kind, output }]);
    return id;
  };
  const remember = (value: string) => {
    setHistory(previous => previous.at(-1) === value ? previous : [...previous, value].slice(-100));
    setHistoryIndex(null);
    savedDraft.current = "";
  };
  const clear = () => {
    chat.clearMessages();
    setLocalEntries([]);
    setWelcome(false);
    setMenuId(null);
    setUnread(false);
    followOutput.current = true;
  };
  const focusContact = () => requestAnimationFrame(() => {
    const form = contactRef.current;
    const viewport = scrollRef.current;
    if (!form || !viewport) return;
    followOutput.current = false;
    viewport.scrollTop += form.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 16;
    form.querySelector<HTMLInputElement>('input:not([tabindex="-1"])')?.focus({ preventScroll: true });
  });
  const execute = (raw: string, fromComposer = false) => {
    const value = raw.trim();
    if (!value) return;
    const command = parseTerminalCommand(value, menuId && /^[1-4]$/.test(value) ? "shell" : mode);
    if (busy && (!command || command === "/clear")) return;
    scrollToLatest();
    remember(value);
    if (fromComposer) setInput("");
    setMenuId(null);
    // Reuse the mounted form so revisiting Contact preserves an unsent draft.
    if (command === "/contact" && latestContact) { focusContact(); return; }
    if (command === "/clear") {
      clear();
    } else if (command) {
      const id = addEntry(value, command);
      if (command === "/ai") setMode("assistant");
      if (command === "/exit") { chat.stop(); setMode("shell"); }
      if (command === "/menu") {
        chat.stop();
        setMode("shell");
        setMenuId(id);
        setSelection(0);
        requestAnimationFrame(() => {
          const menu = menuRef.current;
          const viewport = scrollRef.current;
          if (menu && viewport) {
            viewport.scrollTop += menu.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 12;
          }
          menu?.querySelector("button")?.focus({ preventScroll: true });
        });
        return;
      }
      if (command === "/contact") {
        focusContact();
        return;
      }
    } else {
      if (mode !== "assistant") {
        addEntry("/ai", "/ai");
        setMode("assistant");
      }
      const payload = buildEnhancedHint(detectEnhancedIntent(value, language), language) + "\n" + value;
      void chat.sendMessage(payload);
    }
    focusInput();
  };

  const handleInputKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      execute(input, true);
    } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey) {
      const field = event.currentTarget;
      if (field.selectionStart !== field.selectionEnd) return;
      const atBoundary = event.key === "ArrowUp"
        ? !input.slice(0, field.selectionStart).includes("\n")
        : !input.slice(field.selectionEnd).includes("\n");
      if (!atBoundary || !history.length) return;
      if (event.key === "ArrowDown" && historyIndex === null) return;
      event.preventDefault();
      if (historyIndex === null) savedDraft.current = input;
      const next = Math.max(0, Math.min(history.length, (historyIndex ?? history.length) + (event.key === "ArrowUp" ? -1 : 1)));
      setHistoryIndex(next === history.length ? null : next);
      setInput(next === history.length ? savedDraft.current : history[next]);
      requestAnimationFrame(() => { const field = inputRef.current; field?.setSelectionRange(field.value.length, field.value.length); });
    } else if (event.key === "Tab" && !event.shiftKey) {
      const matches = completeTerminalCommand(input);
      if (matches.length === 1 && matches[0] !== input) {
        event.preventDefault();
        setInput(matches[0]);
        setHistoryIndex(null);
      }
    }
  };

  const renderMenu = (id: string) => menuId === id && (
    <div ref={menuRef} className={styles.menu} role="group" aria-label={copy.menu} onKeyDown={event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
      const current = buttons.indexOf(event.target as HTMLButtonElement);
      buttons[(current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }}>
      {menuItems.map((item, index) => (
        <button key={item.command} type="button" data-selected={selection === index} onFocus={() => setSelection(index)} onMouseEnter={() => setSelection(index)} onClick={() => execute(item.command)}>
          <span className={styles.menuMarker} aria-hidden="true">{selection === index ? "❯" : " "}</span>
          <span className={`${styles.muted} ${styles.menuNumber}`} aria-hidden="true">{index + 1}.</span>
          <span>{item.label}</span><span className={styles.menuHint}>{item.hint}</span>
        </button>
      ))}
      <p className={styles.keyboardHint}>{copy.menuHint}</p>
    </div>
  );

  const prompt = (assistant = false) => <span className={styles.prompt} aria-hidden="true">{assistant ? "❯" : theme === "windows" ? "C:\\ALEXIS>" : <><span>➜</span><span className={styles.directory}>~</span></>}</span>;
  const renderLocal = (entry: LocalEntry) => (
    <div className={styles.turn} key={entry.id}>
      <div className={styles.commandLine}>{prompt()}<span className={entry.kind === "/ai" ? styles.assistantTitle : undefined}>{entry.kind === "/ai" ? copy.ai : entry.command}</span></div>
      <div className={`${styles.localOutput} ${entry.kind === "/ai" ? styles.assistantOutput : ""}`}>
        {entry.kind === "/about" && <p>{TERMINAL_ABOUT[language]}</p>}
        {entry.kind === "/projects" && <>
          <p className={styles.muted}>{copy.projectsIntro}</p>
          <div className={styles.projectList}>
            {CURATED_PROJECTS.map(project => <button type="button" key={project.id} onClick={() => {
              scrollToLatest();
              addEntry(`open ${project.id}`, "opened", project.title);
              dispatchDesktopAction("open_projects", { projectId: project.id });
            }}><span aria-hidden="true">↗</span><span>{project.title}</span></button>)}
          </div>
        </>}
        {entry.kind === "/contact" && <>
          <p className={styles.muted}>{copy.contactIntro}</p>
          {latestContact === entry.id && <div ref={contactRef} className={styles.contactForm}><ContactEmailForm /></div>}
        </>}
        {entry.kind === "/ai" && <div className={styles.assistantWelcome}>
          <p>{copy.assistantIntro}</p>
          {chat.messages.length === 0 && <div className={styles.examples}>{copy.examples.map(example => <button type="button" key={example} disabled={busy} onClick={() => execute(example)}>› {example}</button>)}</div>}
        </div>}
        {entry.kind === "/help" && <>
          <p>{copy.help}</p>
          <div className={styles.helpList}>{TERMINAL_COMMANDS.map((command, index) => <button type="button" key={command} disabled={busy && command === "/clear"} onClick={() => execute(command)}><span>{command}</span><span className={styles.muted}>{commandDescriptions[index]}</span></button>)}</div>
          <p className={styles.muted}>{copy.helpHint}</p>
        </>}
        {entry.kind === "/menu" && renderMenu(entry.id)}
        {entry.kind === "/exit" && <p className={styles.muted}>{copy.returned}</p>}
        {entry.kind === "unknown" && <p className={styles.errorText}>{copy.unknown}</p>}
        {entry.kind === "opened" && <p className={styles.muted}>{copy.opened}: {entry.output}</p>}
      </div>
    </div>
  );

  const shell = <>
    {!isSheet && <div className={styles.titlebar} data-drag-handle="" onDoubleClick={onToggleMaximize}>
      <div className={styles.windowControls} onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
        <button type="button" onClick={onClose} disabled={!onClose} aria-label={copy.close} title={copy.close}><X size={10} /></button>
        <button type="button" onClick={onMinimize} disabled={!onMinimize} aria-label={copy.minimize} title={copy.minimize}><Minus size={10} /></button>
        <button type="button" onClick={onToggleMaximize} disabled={!onToggleMaximize} aria-label={maximized ? copy.restore : copy.maximize} title={maximized ? copy.restore : copy.maximize} aria-pressed={maximized}>{maximized ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button>
      </div>
      <div className={styles.title}><Folder size={13} aria-hidden="true" /><span>{titleOverride ?? (compact ? (mode === "assistant" ? copy.assistant : copy.shell) : `alexis — portfolio — ${mode === "assistant" ? "AI" : "shell"}`)}</span></div>
    </div>}
    <div className={styles.workspace}>
      {!menuId && <div className={styles.sectionNavigation}>
        <button type="button" onClick={() => execute("/menu")}>{copy.backToMenu}</button>
      </div>}
      <div className={styles.scrollback} ref={scrollRef} tabIndex={0} role="region" aria-label={copy.transcript} data-carousel-scrollable="true" onScroll={event => {
        const element = event.currentTarget;
        followOutput.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
        if (followOutput.current) setUnread(false);
      }}>
        {welcome && <div className={styles.welcome}>
          <div className={styles.commandLine}>{prompt()}<span>./portfolio</span></div>
          <div className={styles.welcomeBody}><strong>{copy.title}</strong><p>{compact ? copy.compactWelcome : copy.welcome}</p>{!compact && <p className={styles.muted}>{copy.intro}</p>}</div>
          {renderMenu("welcome")}
        </div>}
        {entries.map(item => item.source === "local" ? renderLocal(item.entry) : <div key={item.entry.id} className={styles.turn}>
          {item.entry.role === "user"
            ? <div className={styles.userLine}>{prompt(true)}<span>{stripHint(item.entry.content)}</span></div>
            : <div className={styles.response}><span className={styles.responseMarker} aria-hidden="true">●</span><div>{item.entry.content}{item.entry.pending && <span className={styles.cursor} aria-hidden="true" />}</div></div>}
          {item.entry.role === "assistant" && item.entry.outcome === "complete" && <div className={styles.completion}>· {copy.done} · {((item.entry.durationMs ?? 0) / 1000).toFixed(1)}s</div>}
          {item.entry.role === "user" && item.entry.outcome === "stopped" && <div className={styles.completion}>^C · {copy.stopped}</div>}
        </div>)}
        {busy && <div className={styles.activity}><span className={styles.activityMark} aria-hidden="true">✳</span><span>{chat.isStreaming ? copy.writing : copy.thinking}…</span><span className={styles.muted}>{(chat.waitMs / 1000).toFixed(1)}s</span></div>}
        {chat.error && <div className={styles.errorBlock}>
          <p>{chat.isRateLimit ? copy.rateLimit : chat.error === "timeout" ? copy.timeout : copy.error}</p>
          {chat.error !== "timeout" && <details><summary>{copy.details}</summary><p>{chat.error}</p></details>}
        </div>}
        {canRetry && <button type="button" className={styles.retry} onClick={() => { scrollToLatest(); void chat.retry(); focusInput(); }}>↻ {copy.retry}</button>}
      </div>
      {unread && <button type="button" className={styles.latest} onClick={scrollToLatest}>{copy.latest}</button>}
      <div className={styles.composer}>
        <form onSubmit={event => { event.preventDefault(); execute(input, true); }} className={styles.inputRow}>
          {prompt(true)}
          <label htmlFor={inputId} className={styles.srOnly}>{copy.draft}</label>
          <textarea ref={inputRef} id={inputId} rows={1} value={input} onChange={event => { setInput(event.target.value); setHistoryIndex(null); }} onKeyDown={handleInputKey} placeholder={compact ? (mode === "assistant" ? copy.compactAiPlaceholder : copy.compactPlaceholder) : (mode === "assistant" ? copy.aiPlaceholder : copy.placeholder)} maxLength={500} autoComplete="off" autoCapitalize="sentences" spellCheck={false} aria-describedby={`${inputId}-hint`} />
          {busy ? <button type="button" className={styles.send} onClick={chat.stop} title={`${copy.stop} (Esc)`} aria-label={copy.stop}><Square size={13} fill="currentColor" /></button>
            : <button type="submit" className={styles.send} disabled={!input.trim()} title={copy.send} aria-label={copy.send}><ArrowUp size={17} /></button>}
        </form>
        <div className={styles.statusLine} id={`${inputId}-hint`}>
          <span>{compact ? (busy ? copy.touchBusyHint : copy.touchHint) : busy ? copy.busyHint : <><span className={styles.fullHint}>{copy.inputHint}</span><span className={styles.shortHint}>{copy.shortHint}</span></>}</span>
          <span className={styles.statusRight}>{input.length > 400 ? `${input.length}/500` : chat.modelUsed ?? copy.commandHint}</span>
        </div>
      </div>
    </div>
  </>;

  return <div className={[styles.root, styles[theme], variant === "card" ? styles.card : styles.panel, compact ? styles.compact : "", isSheet ? styles.mindSheet : "", className].filter(Boolean).join(" ")} data-terminal-theme={theme} data-presentation={presentation} data-mind-sheet={isSheet ? "true" : undefined} onKeyDown={event => {
    const target = event.target as HTMLElement;
    const inContact = !!contactRef.current?.contains(target);
    if (event.key === "Escape" && busy) { event.preventDefault(); event.stopPropagation(); chat.stop(); }
    if (inContact) return;
    if (event.ctrlKey && event.key.toLowerCase() === "c" && !window.getSelection()?.toString() && !(target instanceof HTMLTextAreaElement && target.selectionStart !== target.selectionEnd)) {
      event.preventDefault();
      if (busy) chat.stop();
      else { setInput(""); setHistoryIndex(null); }
    }
    if (event.ctrlKey && event.key.toLowerCase() === "l" && !busy) { event.preventDefault(); clear(); focusInput(); }
  }}>
    <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    <div className={[styles.shell, terminalClassName].filter(Boolean).join(" ")}>{shell}</div>
  </div>;
}
