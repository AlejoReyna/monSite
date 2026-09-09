"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";
import { Info, X, Minus, Maximize2, Minimize2, Sparkles, ArrowUp } from "lucide-react";
import styles from "./chat-interface.module.css";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import { useChat } from "@/hooks/useChat";

// Removed unused TypewriterText component and its props type

/* ========= Loading Spinner Component ========= */
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-1">
      <div className="relative w-4 h-4">
        <div className="absolute inset-0 rounded-full border-2 border-orange-400/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 animate-spin" />
        <div className="absolute inset-1 rounded-full border border-orange-300/40" />
      </div>
    </div>
  );
}

// Removed unused imports: alexisData, getRandomMusicArtist, getRandomTech
// Debug imports
import {
  detectEnhancedIntent,
  buildEnhancedHint,
  ENHANCED_SUGGESTIONS,
} from "./data/chat-enhancements";

type Intent = "casual" | "work" | "about" | "projects" | "contact" | "music" | "travel" | "tech";
type Suggestion = { en: string; es: string; zh: string; intent: Intent };

const UI_LABELS: Record<Language, {
  chatInfo: string;
  tooltip: string;
  autoName: string;
  howAreYou: string;
  howAreYouNamed: (name: string) => string;
  commands: string;
  placeholder: string;
  processing: string;
  rateLimit: string;
}> = {
  es: {
    chatInfo: "Información del chat",
    tooltip: "Este proyecto usa Kimi 2.6, y las respuestas tardan unos 6 segundos",
    autoName: "Amigo",
    howAreYou: "¿Cómo estás?",
    howAreYouNamed: (name) => `¿Cómo estás, ${name}?`,
    commands: "Comandos disponibles:",
    placeholder: "Pregúntame algo...",
    processing: "Procesando respuesta...",
    rateLimit: "Límite de velocidad alcanzado. Intenta en unos segundos...",
  },
  en: {
    chatInfo: "Chat info",
    tooltip: "This project uses Kimi 2.6, and answers take about 6 seconds",
    autoName: "Guest",
    howAreYou: "How are you?",
    howAreYouNamed: (name) => `How are you, ${name}?`,
    commands: "Available commands:",
    placeholder: "Ask me something...",
    processing: "Processing response...",
    rateLimit: "Rate limit reached. Try in a few seconds...",
  },
  zh: {
    chatInfo: "聊天信息",
    tooltip: "本项目使用 Kimi 2.6，回复大约需要 6 秒",
    autoName: "朋友",
    howAreYou: "你好吗？",
    howAreYouNamed: (name) => `${name}，你好吗？`,
    commands: "可用命令：",
    placeholder: "问我点什么……",
    processing: "正在处理回复……",
    rateLimit: "已达到速率限制。请稍后再试……",
  },
};

const AI_COPY = {
  en: { title: "Alexis · AI assistant", heading: "Chat with Alexis’s AI assistant", intro: "Ask about his projects, skills, or working together. No commands needed.", placeholder: "Ask the AI assistant…", send: "Send message", examples: "Try a question", projects: "Projects", skills: "Skills", contact: "Work together", projectQuestion: "What projects has Alexis built?", skillsQuestion: "What are Alexis’s technical skills?", contactQuestion: "How can I work with Alexis?" },
  es: { title: "Alexis · Asistente IA", heading: "Habla con el asistente IA de Alexis", intro: "Pregunta por sus proyectos, habilidades o cómo trabajar juntos. No necesitas comandos.", placeholder: "Pregúntale al asistente IA…", send: "Enviar mensaje", examples: "Prueba una pregunta", projects: "Proyectos", skills: "Habilidades", contact: "Colaborar", projectQuestion: "¿Qué proyectos ha creado Alexis?", skillsQuestion: "¿Cuáles son las habilidades técnicas de Alexis?", contactQuestion: "¿Cómo puedo trabajar con Alexis?" },
  zh: { title: "Alexis · AI 助手", heading: "与 Alexis 的 AI 助手聊天", intro: "了解他的项目、技能或合作方式。无需输入命令。", placeholder: "向 AI 助手提问…", send: "发送消息", examples: "试着问一问", projects: "项目", skills: "技能", contact: "合作", projectQuestion: "Alexis 做过哪些项目？", skillsQuestion: "Alexis 有哪些技术技能？", contactQuestion: "如何与 Alexis 合作？" },
} satisfies Record<Language, Record<string, string>>;

const GREETINGS: Record<Language, string[]> = {
  en: [
    "Hey there! I'm Alexis. I code things that live on the internet, and this AI version of me is here to chat.",
    "Hi, I'm Alexis. Web developer by day, debugging wizard by night. This is my AI twin.",
    "Hello! Alexis here. I turn coffee into code, and this AI knows most of my tricks.",
    "Hey, I'm Alexis. I make pixels dance on screens, powered by AI magic.",
  ],
  es: [
    "¡Hey! Soy Alexis. Programo cosas que viven en internet, y esta versión AI de mí está aquí para charlar.",
    "Hola, soy Alexis. Desarrollador web de día, mago del debugging de noche. Este es mi gemelo AI.",
    "¡Hola! Alexis aquí. Convierto café en código, y esta AI conoce la mayoría de mis trucos.",
    "Hey, soy Alexis. Hago que los píxeles bailen en pantallas, con magia AI.",
  ],
  zh: [
    "嘿！我是 Alexis。我编写活在互联网上的东西，这个 AI 版的我可以陪你聊天。",
    "你好，我是 Alexis。白天是 Web 开发者，晚上是调试巫师。这是我的 AI 分身。",
    "你好！Alexis 在此。我把咖啡变成代码，这个 AI 知道我的大部分招数。",
    "嘿，我是 Alexis。我让像素在屏幕上跳舞，由 AI 魔法驱动。",
  ],
};

/* ========= Utils ========= */
const getRandomSuggestions = (all: Suggestion[], count = 5) =>
  [...all].sort(() => 0.5 - Math.random()).slice(0, count);

/* ========= Easter Egg (resumido, igual que antes) ========= */
// Removed unused easter egg variables: EASTER_GIBBERISH_ES, EASTER_GIBBERISH_EN, buildEasterFull

/* ========= Intents & Hints ========= */
const HINT_START = "[[SYS]]";
const HINT_END = "[[/SYS]]";
const deriveIntent = detectEnhancedIntent;
const buildHint = (intent: Intent, lang: Language) =>
  buildEnhancedHint(intent, lang);
const stripHintFromUserMessage = (raw: unknown) => {
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

type ChatInterfaceProps = {
  /** Extra classes on outer wrapper (e.g. embed in hero panel). */
  className?: string;
  /** Extra classes on terminal chrome when variant is `card` (inner shell). */
  terminalClassName?: string;
  /** `panel`: root element is the terminal (fills hero column). `card`: centered layout with inner terminal frame. */
  variant?: "card" | "panel";
  theme?: "default" | "windows" | "mac" | "ubuntu";
  onClose?: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  maximized?: boolean;
  /** `window` (default) keeps desktop chrome; `mind-sheet` is the mobile bottom sheet body. */
  presentation?: "window" | "mind-sheet";
  /** Fires whenever the chat loading state changes (for thought-bubble pulse, etc.). */
  onBusyChange?: (busy: boolean) => void;
  /** Show projects / about / contact shortcut chips (mind-sheet). */
  showQuickCommands?: boolean;
  /** Optional portrait shown in mind-sheet chrome (parent may also render one). */
  portraitSrc?: string | null;
  /** Override the shell / sheet title. */
  titleOverride?: string;
};

const QUICK_COMMANDS: { intent: Intent; en: string; es: string; zh: string }[] = [
  { intent: "projects", en: "projects", es: "proyectos", zh: "项目" },
  { intent: "about", en: "about", es: "sobre mí", zh: "关于" },
  { intent: "contact", en: "contact", es: "contacto", zh: "联系" },
];

export default function ChatInterface({
  className,
  terminalClassName,
  variant = "card",
  theme = "default",
  onClose, onMinimize, onToggleMaximize, maximized = false,
  presentation = "window",
  onBusyChange,
  showQuickCommands = false,
  portraitSrc = null,
  titleOverride,
}: ChatInterfaceProps) {
  const { language: currentLang } = useLanguage();
  const labels = UI_LABELS[currentLang];
  const aiCopy = AI_COPY[currentLang];

  /* ========= Estado base ========= */
  const [userName, setUserName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Removed unused overlay state variables: showWelcome, setShowWelcome, welcomeOpacity, setWelcomeOpacity,
  // showNameStep, setNameOpacity, showLangStep, langOpacity, showNameInput, nameInputOpacity, setNameInput

  // Chat
  const { messages, isLoading, error, sendMessage, isRateLimit } = useChat(userName);
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  // Removed unused pendingUserText state

  const rootRef = useRef<HTMLDivElement>(null);

  /* ========= Load persisted ========= */
  useEffect(() => {
    try {
      const savedName =
        typeof window !== "undefined" ? (localStorage.getItem("userName") || "").trim() : "";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedName) setUserName(savedName);

      const needsSetup = !savedName;
      setShowNamePrompt(needsSetup);

      if (!needsSetup) {
        setShowChat(true);
      }
    } catch {
      setShowNamePrompt(true);
    }
  }, []);

  // Initialize suggestions on client side to prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuggestions(getRandomSuggestions(ENHANCED_SUGGESTIONS, 5));
  }, []);

  useEffect(() => {
    onBusyChange?.(isLoading);
  }, [isLoading, onBusyChange]);

  // Messages end ref para autoscroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  /* ========= Handlers ========= */
  // Removed unused handlers: handleLanguageSelection, handleNameStepComplete

  // Removed unused handlers: handleNameSubmit, handleNameKey (these were for name input functionality that's not being used)

  const handleSendMessage = () => {
    const raw = inputValue.trim();
    if (!raw || isLoading) return;
    if (!userName) {
      const autoName = labels.autoName;
      setUserName(autoName);
      try {
        localStorage.setItem("userName", autoName);
      } catch {}
      setShowNamePrompt(false);
      setShowChat(true);
    }
    const intent = deriveIntent(raw, currentLang);
    const payload = buildHint(intent, currentLang) + "\n" + raw;
    sendMessage(payload);
    setInputValue("");
    if (!showChat) setShowChat(true);
  };

  const handleSuggestionClick = (text: string, intent: Intent) => {
    if (isLoading) return;
    if (!userName) {
      const autoName = labels.autoName;
      setUserName(autoName);
      try {
        localStorage.setItem("userName", autoName);
      } catch {}
      setShowNamePrompt(false);
      setShowChat(true);
    }
    const payload = buildHint(intent, currentLang) + "\n" + text;
    sendMessage(payload);
    if (!showChat) setShowChat(true);
  };

  /* ========= Intro text (portada) ========= */
  const [displayed, setDisplayed] = useState("");
  const [typewriterComplete, setTypewriterComplete] = useState(false);
  const [visibleButtons, setVisibleButtons] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [showInfoTip, setShowInfoTip] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreetingIndex(Math.floor(Math.random() * GREETINGS[currentLang].length));
  }, [currentLang]);

  const baseGreeting = GREETINGS[currentLang][greetingIndex];
  const text = userName
    ? `${baseGreeting} ${labels.howAreYouNamed(userName)}`
    : `${baseGreeting} ${labels.howAreYou}`;

  useEffect(() => {
    if (!showChat) {
      let i = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayed("");
      setTypewriterComplete(false);
      const id = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(id);
          setTypewriterComplete(true);
        }
      }, 40);
      return () => clearInterval(id);
    }
  }, [text, showChat]);

  useEffect(() => {
    if (!showNamePrompt && typewriterComplete && !showChat && visibleButtons < suggestions.length) {
      const timer = setTimeout(() => setVisibleButtons((p) => p + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [typewriterComplete, visibleButtons, showChat, showNamePrompt, suggestions.length]);

  useEffect(() => {
    if (!showNamePrompt && typewriterComplete && !showChat && visibleButtons === suggestions.length && !showInput) {
      const timer = setTimeout(() => setShowInput(true), 300);
      return () => clearTimeout(timer);
    }
  }, [typewriterComplete, visibleButtons, showChat, showNamePrompt, showInput, suggestions.length]);

  /* ========= UI normal del chat ========= */
  const sorted = [...messages].sort((a, b) => +a.timestamp - +b.timestamp);

  /* ========= Screen-reader announcements for assistant messages & loading ========= */
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const lastAnnouncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiveAnnouncement(labels.processing);
      return;
    }
    const lastAssistant = sorted.filter((m) => m.role === "assistant").pop();
    if (lastAssistant && lastAssistant.id !== lastAnnouncedIdRef.current) {
      setLiveAnnouncement(lastAssistant.content);
      lastAnnouncedIdRef.current = lastAssistant.id;
    }
  }, [isLoading, sorted, labels.processing]);

  const isPanel = variant === "panel";
  const themed = theme !== "default";
  const prompt = theme === "windows" ? "C:\\ALEXIS>" : theme === "mac" ? <><span>➜</span><span className={styles.directory}>~</span></> : theme === "ubuntu" ? "alexis@ubuntu:~$" : ">";
  const isMindSheet = presentation === "mind-sheet";
  const shellTitle = titleOverride
    ?? (isMindSheet
      ? "alexis / mind"
      : theme === "windows"
        ? "MS-DOS Prompt"
        : theme === "mac"
          ? aiCopy.title
          : "alexis@ubuntu: ~");
  void portraitSrc;
  const session = theme === "windows" ? "Microsoft Windows 95 [Version 4.00.950]" : theme === "mac" ? "" : "alexis@ubuntu:~$ ./portfolio";
  const windowLabels = currentLang === "es" ? ["Cerrar terminal", "Minimizar al Dock", "Maximizar terminal", "Restaurar tamaño"] : currentLang === "zh" ? ["关闭终端", "最小化到程序坞", "最大化终端", "恢复大小"] : ["Close terminal", "Minimize to Dock", "Maximize terminal", "Restore window size"];
  const shellClass = themed ? `${styles.shell} ${styles[theme]}` : "";

  const rootClassName = isMindSheet
    ? [
        styles.mindSheet,
        "pointer-events-auto relative z-10 flex flex-col w-full overflow-hidden min-h-0 h-full",
        shellClass,
        terminalClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")
    : isPanel
    ? [
        "pointer-events-auto relative z-10 flex flex-col w-full rounded-lg border border-gray-500/35 bg-black/30 backdrop-blur-md shadow-2xl shadow-black/35 overflow-hidden min-h-0",
        shellClass,
        terminalClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")
    : [
        "relative z-10 flex flex-col px-0 lg:px-4 w-full max-w-3xl mx-auto mb-0 lg:mb-12 h-full lg:h-auto",
        className,
      ]
        .filter(Boolean)
        .join(" ");

  const innerShellClassName = [
    shellClass,
    "pointer-events-auto w-full rounded-lg border border-gray-500/35 bg-black/30 backdrop-blur-md shadow-2xl shadow-black/35 overflow-hidden max-h-[35vh] lg:h-auto flex flex-col",
    terminalClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const terminalFrame = (body: React.ReactNode) =>
    isPanel ? body : <div className={innerShellClassName}>{body}</div>;

  return (
    <div ref={rootRef} className={rootClassName} data-terminal-theme={theme} data-mind-sheet={isMindSheet ? "true" : undefined} data-presentation={presentation}>
      {/* Live region for assistant messages and loading state */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>
      {terminalFrame(
        <>
          {themed && !isMindSheet && (
            <div className={styles.titlebar} data-drag-handle="" onDoubleClick={theme === "mac" ? onToggleMaximize : undefined}>
              {theme === "mac" && <span className={styles.trafficLights} onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}>
                <button type="button" onClick={onClose} aria-label={windowLabels[0]} title={windowLabels[0]}><X size={9} /></button>
                <button type="button" onClick={onMinimize} aria-label={windowLabels[1]} title={windowLabels[1]}><Minus size={9} /></button>
                <button type="button" onClick={onToggleMaximize} aria-label={windowLabels[maximized ? 3 : 2]} title={windowLabels[maximized ? 3 : 2]} aria-pressed={maximized}>{maximized ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button>
              </span>}
              {theme === "windows" && <span className={styles.dosIcon} aria-hidden="true">C:\</span>}
              <span className={styles.title}>{shellTitle}</span>
              {theme !== "mac" && <span className={styles.windowControls} aria-hidden="true"><i>−</i><i>□</i><i>×</i></span>}

            </div>
          )}
          {/* Links and chat information for the alternate terminal themes. */}
          <div
            className={`${theme === "mac" || isMindSheet ? styles.hide : ""} ${themed ? styles.toolbar : ""} flex items-center px-4 py-3 bg-black/40 border-b border-gray-500/35 shrink-0 ${isPanel ? "cursor-default" : "cursor-move"}`}
            {...(!isPanel && !isMindSheet ? { "data-drag-handle": "" } : {})}
          >
            <div className={`flex items-center gap-2 ${themed ? styles.hide : ""}`}>
              <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600" />
              <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
            </div>
            {themed && <span className={styles.toolbarLabel}>{theme === "windows" ? "COMMAND.COM" : theme === "mac" ? "⌘  ~ / portfolio" : "Terminal · ~/portfolio"}</span>}
            <div className="flex items-center gap-3 ml-auto">
              <a
                href="https://github.com/AlejoReyna"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58V20.9c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.57.12-3.27 0 0 1.01-.32 3.3 1.23a11.48 11.48 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.7.24 2.96.12 3.27.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.61-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0012 .5z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
            <div className="relative ml-3">
              <button
                type="button"
                aria-label={labels.chatInfo}
                className="flex items-center text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                onClick={() => setShowInfoTip((v) => !v)}
                onMouseEnter={() => setShowInfoTip(true)}
                onMouseLeave={() => setShowInfoTip(false)}
              >
                <Info size={16} strokeWidth={2.2} />
              </button>
              {showInfoTip && (
                <div
                  role="tooltip"
                  className="absolute right-0 top-full mt-2 w-56 rounded-md bg-black/90 border border-gray-500/40 px-3 py-2 text-[12px] leading-5 text-gray-200 font-mono shadow-lg z-50 animate-fadeIn"
                >
                  {labels.tooltip}
                  <span className="absolute -top-1 right-1.5 h-2 w-2 rotate-45 bg-black/90 border-l border-t border-gray-500/40" />
                </div>
              )}
            </div>
          </div>

        {/* Contenido — min-h-0 + scroll interno para que el texto de portada/comandos no quede cortado */}
        <div className={`${themed ? styles.content : ""} p-2 lg:p-4 flex-1 flex flex-col min-h-0 overflow-hidden`}>
          <div className="flex-1 min-h-0 flex flex-col gap-4 mb-4 overflow-y-auto">
            {themed && theme !== "mac" && !isMindSheet && <div className={styles.session}>{session}<br /><span>{theme === "windows" ? "C:\\ALEXIS> ALEXIS.EXE" : "# Alexis Reyna · portfolio"}</span></div>}
            {theme === "mac" && sorted.length === 0 && !showChat && (
              <section className={styles.aiWelcome} aria-label={aiCopy.heading}>
                <h2><Sparkles size={18} aria-hidden="true" />{aiCopy.heading}</h2>
                <p>{aiCopy.intro}</p>
                <div className={styles.aiExamples} role="group" aria-label={aiCopy.examples}>
                  {([
                    [aiCopy.projects, aiCopy.projectQuestion, "projects"],
                    [aiCopy.skills, aiCopy.skillsQuestion, "tech"],
                    [aiCopy.contact, aiCopy.contactQuestion, "contact"],
                  ] as const).map(([label, question, intent]) => (
                    <button key={intent} type="button" disabled={isLoading} onClick={() => handleSuggestionClick(question, intent)}>{label}</button>
                  ))}
                </div>
              </section>
            )}
            {/* Portada */}
            {theme !== "mac" && !showChat && (
              <div className="shrink-0 font-mono text-[14px] lg:text-[16px] xl:text-[17px] leading-6">
                <span className={themed ? styles.prompt : "text-gray-200"}>{themed ? prompt : ">"}</span>
                <span className="text-gray-400 ml-2">Alexis-K2.6</span>
                <span className="text-gray-100 ml-2">
                  {displayed || text}
                  {!showNamePrompt && displayed.length < text.length && (
                    <span className="ml-1 inline-block h-4 w-0.5 align-[-0.15em] bg-gray-300 animate-pulse" />
                  )}
                </span>
              </div>
            )}

            {/* Chat messages */}
            {(sorted.length > 0 || showChat) && (
              <div
                className="space-y-4 overflow-y-auto flex-1 min-h-0"
                data-carousel-scrollable="true"
              >
                {sorted.map((m) => {
                const isUser = m.role === "user";
                const key = (m.id ?? String(+m.timestamp)) as string;
                const content = isUser ? stripHintFromUserMessage(m.content) : m.content ?? "";
                return (
                  <div key={key} className="font-mono text-[14px] lg:text-[16px] xl:text-[17px] leading-6 animate-fadeIn">
                    {isUser ? (
                      // Usuario - estilo comando de terminal con wrap correcto
                      <div className="mb-2">
                        <div className="text-[14px] lg:text-[16px] xl:text-[17px]">
                          <span className={themed ? styles.prompt : "text-gray-200"}>{themed ? prompt : ">"}</span>
                          {theme !== "mac" && <span className="text-gray-400 ml-2">Alexis-K2.6</span>}
                          <span className="text-gray-100 ml-2">{content}</span>
                        </div>
                        <div className="text-[14px] text-gray-500 mt-1">
                          {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ) : (
                      // Respuesta del sistema
                      <div className="mb-2">
                        <div className={`${themed ? styles.response : ""} text-gray-100 bg-black/10 rounded p-3 border-l-4 border-orange-500 text-[14px] lg:text-[16px] xl:text-[17px] leading-6`}>
                          {content}
                        </div>
                        <div className="text-[14px] text-gray-500 mt-1">
                          {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="font-mono text-[14px] lg:text-[16px] xl:text-[17px] animate-fadeIn">
                  <div className={`${themed ? styles.response : ""} text-gray-100 bg-black/10 rounded p-3 border-l-4 border-orange-500 flex items-center gap-3`}>
                    <LoadingSpinner />
                    <span>{labels.processing}</span>
                  </div>
                </div>
              )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-black/30 border-l-4 border-red-500 text-red-100 p-4 rounded font-mono text-[14px] lg:text-[16px] xl:text-[17px] animate-fadeIn shrink-0">
                <div className="flex items-center text-[14px] mb-2">
                  <span className={themed ? styles.prompt : "text-gray-200"}>{themed ? prompt : ">"}</span>
                  {theme !== "mac" && <span className="text-gray-400 ml-2">Alexis-K2.6</span>}
                  <span className="text-red-300 ml-2">error</span>
                </div>
                <div className="ml-6">
                  <p className="text-red-200">bash: {error}</p>
                  {isRateLimit && (
                    <p className="text-xs mt-2 opacity-80 text-red-300">
                      {labels.rateLimit}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sugerencias antes de iniciar chat */}
            {theme !== "mac" && !showNamePrompt && !showChat && sorted.length === 0 && (
              <div className="space-y-2 shrink-0">
              <div className="text-xs text-gray-400 font-mono mb-3">{labels.commands}</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, index) => {
                  const label = s[currentLang];
                  return (
                    <button
                      key={s.en}
                      onClick={() => handleSuggestionClick(label, s.intent)}
                      className={`text-xs bg-black/20 hover:bg-orange-900/30 text-gray-300 hover:text-orange-200 px-3 py-2 rounded border border-orange-500/30 hover:border-orange-400/60 transition-all duration-300 font-mono transform hover:scale-105 ${
                        index < visibleButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      ./{label.replace(/\s+/g, "_").toLowerCase()}
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Quick commands — mobile mind-sheet shortcuts */}
          {showQuickCommands && (
            <div className={styles.quickCommands} role="group" aria-label={labels.commands}>
              {QUICK_COMMANDS.map((cmd) => {
                const label = cmd[currentLang];
                return (
                  <button
                    key={cmd.intent}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSuggestionClick(label, cmd.intent)}
                    className={styles.quickCommand}
                  >
                    ./{cmd.en}
                  </button>
                );
              })}
            </div>
          )}

          {/* Input - siempre al final */}
          <div className={`${themed ? styles.inputRow : ""} border-t border-gray-500/30 pt-3 shrink-0`}>
            <label htmlFor={isMindSheet ? "mind-sheet-chat-input" : "chat-input"} className="sr-only">
              {theme === "mac" ? aiCopy.placeholder : labels.placeholder}
            </label>
            <div className="flex items-center font-mono text-[14px] lg:text-[16px] xl:text-[17px]">
              <span className={themed ? styles.prompt : "text-gray-200 ml-2"}>{prompt}</span>

              <input
                id={isMindSheet ? "mind-sheet-chat-input" : "chat-input"}
                data-empty={inputValue.length === 0}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={theme === "mac" ? aiCopy.placeholder : labels.placeholder}
                className="min-w-0 flex-1 bg-transparent text-gray-100 placeholder-gray-400 font-mono text-[14px] lg:text-[16px] xl:text-[17px] focus:outline-none disabled:opacity-50 caret-gray-300 ml-2"
                disabled={isLoading}
                maxLength={500}
                autoFocus={false}
              />

              {theme === "mac" && (
                <button className={styles.aiSend} type="button" aria-label={aiCopy.send} title={aiCopy.send} disabled={isLoading || !inputValue.trim()} onClick={handleSendMessage}>
                  <ArrowUp size={18} aria-hidden="true" />
                </button>
              )}
              {isLoading && (
                <div className="ml-2">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            {/* Terminal status line */}
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500 font-mono">
              <span>{inputValue.length}/500</span>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
