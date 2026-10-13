"use client";

import { useCopy } from "@/components/use-copy";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import { Folder, Github, Linkedin, Maximize2, Minimize2, Minus, Square, X } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { ContactEmailForm } from "@/components/contact-gateway";
import { useChat } from "@/hooks/useChat";
import { useTerminalIntro } from "@/hooks/useTerminalIntro";
import { INTRO_BUTTON_STAGGER_MS, INTRO_FADE_MS } from "@/lib/terminal/intro";
import { CURATED_PROJECTS } from "@/lib/desktop/portfolio-content";
import { dispatchDesktopAction } from "@/lib/desktop/desktop-store";
import { TERMINAL_ABOUT, TERMINAL_COPY } from "@/lib/terminal/copy";
import { completeTerminalCommand, parseTerminalCommand, TERMINAL_COMMANDS, type TerminalCommand } from "@/lib/terminal/commands";
import styles from "./chat-interface.module.css";

type ChatInterfaceProps = {
  className?: string;
  terminalClassName?: string;
  variant?: "card" | "panel";
  theme?: "default" | "mac";
  onClose?: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  maximized?: boolean;
  presentation?: "window" | "mind-sheet";
  onBusyChange?: (busy: boolean) => void;
  portraitSrc?: string | null;
  titleOverride?: string;
  titlebarContent?: ReactNode;
  compact?: boolean;
  onTitlebarMenu?: (x: number, y: number) => void;
  introVisible?: boolean;
};

type LocalEntry = { id: string; timestamp: Date; command: string; kind: TerminalCommand | "unknown" | "opened"; output?: string };
const stripHint = (content: string) => content.replace(/^\[\[SYS\]\][\s\S]*?\[\[\/SYS\]\]\r?\n?/, "");
// randomUUID exists only in secure contexts; a phone opening the dev server over the LAN is not one.
const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function ChatInterface({
  className, terminalClassName, variant = "card", theme = "default", onClose, onMinimize,
  onToggleMaximize, maximized = false, presentation = "window", onBusyChange,
  titleOverride, titlebarContent, compact = false, onTitlebarMenu, introVisible = true,
}: ChatInterfaceProps) {
  const copyText = useCopy();
  const { language } = useLanguage();
  const copy = TERMINAL_COPY[language];
  // The portrait sits between the first paragraph of About and the rest.
  const [aboutLead, ...aboutRest] = TERMINAL_ABOUT[language].split("\n\n");
  const chat = useChat({ language });
  const [mode, setMode] = useState<"shell" | "assistant">("shell");
  const [input, setInput] = useState("");
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);
  const [welcome, setWelcome] = useState(true);
  const [welcomeVersion, setWelcomeVersion] = useState(0);
  const intro = useTerminalIntro({ heading: copy.welcomeHeading, prefix: copy.welcomePrefix, portfolio: copy.welcomePortfolio, invitation: copy.assistantInvitation }, introVisible, `${language}-${welcomeVersion}`);
  const [menuId, setMenuId] = useState<string | null>("welcome");
  const isWelcomeMenu = welcome && menuId === "welcome";
  const inputPlaceholder = isWelcomeMenu
    ? ""
    : compact
      ? (mode === "assistant" ? copy.compactAiPlaceholder : copy.compactPlaceholder)
      : (mode === "assistant" ? copy.aiPlaceholder : copy.placeholder);
  const [selection, setSelection] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const savedDraft = useRef("");
  const [unread, setUnread] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followOutput = useRef(true);
  const revealId = useRef<string | null>(null);
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
  ];
  const subtitleText = `${copy.welcomePrefix} ${copy.welcomePortfolio}`;
  const commandDescriptions = [copy.help, copy.projects, copy.about, copy.contact, copy.ai, copy.menu, copy.clear, copy.exit];

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    // Keep the welcome screen at its beginning; only follow actual output.
    if (!chat.messages.length && !localEntries.length && !busy && !chat.error) return;
    // A section opens at its first line. Following it to the end left the short phone terminal
    // showing only the last lines of About, Projects or Help; a section that fits still ends at the bottom.
    const section = revealId.current ? viewport.querySelector(`[data-entry="${revealId.current}"]`) : null;
    revealId.current = null;
    if (section) {
      viewport.scrollTop += section.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 12;
      followOutput.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48;
    } else if (followOutput.current) viewport.scrollTop = viewport.scrollHeight;
    else setUnread(true);
  }, [chat.messages, localEntries, busy, chat.error]);

  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 128)}px`;
  }, [input, inputPlaceholder]);

  // On touch screens a focused composer raises the keyboard over the output that was just opened,
  // so a tap leaves it closed; typed commands keep the keyboard the visitor is already using.
  const focusInput = (typed = true) => {
    if (!typed && window.matchMedia("(pointer: coarse)").matches) return;
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };
  const scrollToLatest = () => {
    followOutput.current = true;
    setUnread(false);
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };
  const addEntry = (command: string, kind: LocalEntry["kind"], output?: string) => {
    const id = newId();
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
    setMode("shell");
    setInput("");
    setLocalEntries([]);
    setWelcome(true);
    setWelcomeVersion(version => version + 1);
    setMenuId("welcome");
    setSelection(0);
    setHistory([]);
    setHistoryIndex(null);
    savedDraft.current = "";
    setUnread(false);
    revealId.current = null;
    followOutput.current = true;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
    if (busy && !command) return;
    if (command === "/clear") {
      clear();
      focusInput(fromComposer);
      return;
    }
    scrollToLatest();
    remember(value);
    if (fromComposer) setInput("");
    setMenuId(null);
    // Reuse the mounted form so revisiting Contact preserves an unsent draft.
    if (command === "/contact" && latestContact) { focusContact(); return; }
    if (command) {
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
      revealId.current = id;
    } else {
      if (mode !== "assistant") {
        addEntry("/ai", "/ai");
        setMode("assistant");
      }
      // The persona and the CV dossier live on the server; the composer only sends what was typed.
      void chat.sendMessage(value);
    }
    focusInput(fromComposer);
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
    <div ref={menuRef} className={styles.menu} role="group" aria-label={copy.navigation} inert={id === "welcome" && !intro.controlsVisible} onKeyDown={event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
      const current = buttons.indexOf(event.target as HTMLButtonElement);
      buttons[(current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }}>
      <div className={styles.menuOptions}>
      {menuItems.map((item, index) => (
        <button key={item.command} type="button" title={item.hint} data-selected={selection === index} className={id === "welcome" ? styles.introControls : undefined} data-revealed={id === "welcome" ? intro.controlsVisible : undefined} style={{ transitionDelay: intro.controlsVisible && !intro.reduced ? `${index * INTRO_BUTTON_STAGGER_MS}ms` : "0ms" } as CSSProperties} onFocus={() => setSelection(index)} onMouseEnter={() => setSelection(index)} onClick={() => execute(item.command)}>
          <span className={styles.menuMarker} aria-hidden="true">{selection === index ? "❯" : " "}</span>
          <span className={styles.menuLabel}>{copyText(item.label)}</span><span className={styles.menuCommand} aria-hidden="true">{item.command}</span>
        </button>
      ))}
      </div>
    </div>
  );

  const prompt = (assistant = false) => <span className={styles.prompt} aria-hidden="true">{assistant ? "❯" : <><span>➜</span><span className={styles.directory}>~</span></>}</span>;
  const renderLocal = (entry: LocalEntry) => (
    <div className={styles.turn} key={entry.id} data-entry={entry.id}>
      <div className={styles.commandLine}>{prompt()}<span className={entry.kind === "/ai" ? styles.assistantTitle : undefined}>{entry.kind === "/ai" ? copy.ai : entry.command}</span></div>
      <div className={`${styles.localOutput} ${entry.kind === "/ai" ? styles.assistantOutput : ""}`}>
        {entry.kind === "/about" && <>
          <p>{aboutLead}</p>
          <Image className={styles.aboutPhoto} src="/alexis-portrait.jpg" alt={copy.aboutPhoto} width={1200} height={1600} sizes="200px" />
          <p>{aboutRest.join("\n\n")}</p>
        </>}
        {entry.kind === "/projects" && <>
          <p className={styles.muted}>{copy.projectsIntro}</p>
          <div className={styles.projectList}>
            {CURATED_PROJECTS.map(project => <button type="button" key={project.id} onClick={() => {
              scrollToLatest();
              addEntry(`open ${project.id}`, "opened", project.title);
              dispatchDesktopAction("open_projects", { projectId: project.id });
            }}><span aria-hidden="true">↗</span><span>{copyText(project.title)}</span></button>)}
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
          <div className={styles.helpList}>{TERMINAL_COMMANDS.map((command, index) => <button type="button" key={command} onClick={() => execute(command)}><span>{command}</span><span className={styles.muted}>{commandDescriptions[index]}</span></button>)}</div>
          <p className={styles.muted}>{copy.helpHint}</p>
        </>}
        {entry.kind === "/menu" && renderMenu(entry.id)}
        {entry.kind === "/exit" && <p className={styles.muted}>{copy.returned}</p>}
        {entry.kind === "unknown" && <p className={styles.errorText}>{copy.unknown}</p>}
        {entry.kind === "opened" && <p className={styles.muted}>{copy.opened}: {entry.output}</p>}
      </div>
    </div>
  );

  // Phones carry the way back in the title bar's right corner, leaving the output the terminal's full height.
  const navInTitlebar = compact && !isSheet;
  const backToMenu = !menuId && <button type="button" onClick={() => execute("/menu")}>{copy.backToMenu}</button>;

  const shell = <>
    {!isSheet && <div className={styles.titlebar} data-drag-handle="" tabIndex={onTitlebarMenu ? 0 : undefined} onDoubleClick={onToggleMaximize} onContextMenu={event => {
      if (!onTitlebarMenu) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      onTitlebarMenu(event.clientX || rect.left + rect.width / 2, event.clientY || rect.top + rect.height / 2);
    }} onKeyDown={event => {
      if (!onTitlebarMenu || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      onTitlebarMenu(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }}>
      <div className={styles.windowControls} onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
        <button type="button" onClick={onClose} disabled={!onClose} aria-label={copy.close} title={copy.close}><X size={10} /></button>
        <button type="button" onClick={onMinimize} disabled={!onMinimize} aria-label={copy.minimize} title={copy.minimize}><Minus size={10} /></button>
        <button type="button" onClick={onToggleMaximize} disabled={!onToggleMaximize} aria-label={maximized ? copy.restore : copy.maximize} title={maximized ? copy.restore : copy.maximize} aria-pressed={maximized}>{maximized ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button>
      </div>
      {titlebarContent ?? <div className={styles.title}><Folder size={13} aria-hidden="true" /><span>{titleOverride ?? (compact ? (mode === "assistant" ? copy.assistant : copy.shell) : `alexis — portfolio — ${mode === "assistant" ? "AI" : "shell"}`)}</span></div>}
      {navInTitlebar && backToMenu && <div className={styles.titlebarNavigation} onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>{backToMenu}</div>}
    </div>}
    <div className={styles.workspace} data-terminal-content="">
      {!navInTitlebar && backToMenu && <div className={styles.sectionNavigation}>{backToMenu}</div>}
      <div className={styles.scrollback} ref={scrollRef} tabIndex={0} role="region" aria-label={copy.transcript} data-carousel-scrollable="true" data-welcome-only={welcome && entries.length === 0 && !busy && !chat.error ? "true" : undefined} onScroll={event => {
        const element = event.currentTarget;
        followOutput.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
        if (followOutput.current) setUnread(false);
      }}>
        {welcome && <div key={`${language}-${welcomeVersion}`} className={styles.welcome}>
          <div className={styles.welcomeBody}>
            <h2 className={styles.welcomeTitle} aria-label={`${copy.welcomeHeading}!`}>
              <span className={styles.typingText} aria-hidden="true">
                <span className={styles.typingReserve}>{copy.welcomeHeading}!</span>
                <span className={styles.typingVisible}>{intro.heading.slice(0, copy.welcomeHeading.length)}<span className={styles.welcomePunctuation}>{intro.heading.endsWith("!") ? "!" : ""}</span></span>
              </span>
            </h2>
            <p className={styles.welcomeSubtitle} aria-label={subtitleText} data-revealed={intro.subtitleVisible}>
              <span className={styles.typingText} aria-hidden="true">
                <span className={styles.typingReserve}>{copy.welcomePrefix} <em>{copy.welcomePortfolio}</em></span>
                <span className={styles.typingVisible}>{intro.prefix}<em>{intro.portfolio}</em></span>
              </span>
            </p>
            <nav className={`${styles.socialLinks} ${styles.introControls}`} aria-label={copy.socialLinks} data-revealed={intro.controlsVisible} inert={!intro.controlsVisible}>
              <a href="https://github.com/AlejoReyna" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><Github size={19} aria-hidden="true" /></a>
              <a href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><Linkedin size={19} aria-hidden="true" /></a>
            </nav>
          </div>
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
        {canRetry && <button type="button" className={styles.retry} onClick={() => { scrollToLatest(); void chat.retry(); focusInput(false); }}>↻ {copy.retry}</button>}
      </div>
      {unread && <button type="button" className={styles.latest} onClick={scrollToLatest}>{copy.latest}</button>}
      <div className={styles.composer}>
        <form onSubmit={event => { event.preventDefault(); execute(input, true); }} className={styles.inputRow}>
          {prompt(true)}
          <label htmlFor={inputId} className={styles.srOnly}>{isWelcomeMenu ? copy.assistantInvitation : copy.draft}</label>
          <div className={styles.inputField}>
            <textarea ref={inputRef} id={inputId} rows={1} value={input} onChange={event => { setInput(event.target.value); setHistoryIndex(null); }} onKeyDown={handleInputKey} placeholder={inputPlaceholder} maxLength={500} autoComplete="off" autoCapitalize="sentences" enterKeyHint="send" spellCheck={false} aria-describedby={`${inputId}-hint`} />
            {isWelcomeMenu && <span key={`${language}-${welcomeVersion}`} className={styles.assistantInvitation} data-hidden={input.length > 0} aria-hidden="true">
              <span className={styles.typingReserve}>{copy.assistantInvitation}</span>
              <span className={styles.typingVisible}>{intro.invitation}</span>
            </span>}
          </div>
          {busy && <button type="button" className={styles.stopButton} onClick={chat.stop} title={`${copy.stop} (Esc)`} aria-label={copy.stop}><Square size={13} fill="currentColor" /></button>}
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
    if (event.ctrlKey && event.key.toLowerCase() === "l") { event.preventDefault(); clear(); focusInput(); }
  }} data-intro-reduced={intro.reduced} style={{ "--terminal-intro-fade": `${INTRO_FADE_MS}ms` } as CSSProperties}>
    <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    <div className={[styles.shell, terminalClassName].filter(Boolean).join(" ")}>{shell}</div>
  </div>;
}
