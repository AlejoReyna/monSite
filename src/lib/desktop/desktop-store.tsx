"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLanguage } from "@/components/lang-context";
import { useNavigation } from "@/contexts/navigation-context";
import {
  applyFocusModeClass,
  applyMotionPreference,
  loadPreferences,
  savePreferences,
} from "./preferences";
import {
  FOCUS_DURATION_MS,
  type AssistantState,
  type ConnectionStatus,
  type DesktopPreferences,
  type DesktopWindow,
  type DesktopWindowId,
  type FocusModeState,
  type MenuId,
} from "./types";

export type OpenProjectsOpts = { projectId?: string };

export type DesktopStoreValue = {
  windows: DesktopWindow[];
  focusedWindowId: DesktopWindowId;
  activeAppName: string;
  projectsOpen: boolean;
  terminalOpen: boolean;
  mailOpen: boolean;
  desktopHidden: boolean;
  openMenu: MenuId;
  setOpenMenu: Dispatch<SetStateAction<MenuId>>;
  closeMenus: () => void;
  preferences: DesktopPreferences;
  updatePreferences: (patch: Partial<DesktopPreferences>) => void;
  focusMode: FocusModeState;
  toggleFocus: (enabled?: boolean) => void;
  connection: ConnectionStatus;
  checkConnection: () => Promise<void>;
  assistantAvailable: boolean | null;
  assistantState: AssistantState;
  setAssistantState: (state: AssistantState) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  openProjects: (opts?: OpenProjectsOpts) => void;
  closeProjects: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  openMail: () => void;
  closeMail: () => void;
  setTerminalOpen: (open: boolean) => void;
  closeActiveWindow: () => void;
  bringForward: (id: DesktopWindowId) => void;
  showDesktop: () => void;
  restoreDesktop: () => void;
  openAbout: () => void;
  openPreferences: () => void;
  openTour: () => void;
  openShortcuts: () => void;
  aboutOpen: boolean;
  preferencesOpen: boolean;
  tourOpen: boolean;
  shortcutsOpen: boolean;
  setAboutOpen: (v: boolean) => void;
  setPreferencesOpen: (v: boolean) => void;
  setTourOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  navigateHome: () => void;
  navigateContact: () => void;
  navigateBlog: () => void;
  reduceEffects: () => void;
};

const DesktopStoreContext = createContext<DesktopStoreValue | null>(null);

const WINDOW_TITLES: Record<DesktopWindowId, string> = {
  finder: "Finder",
  terminal: "Terminal",
  mail: "Mail",
  about: "About This Portfolio",
  preferences: "Preferences",
  tour: "Quick Tour",
};

/** Clear menus unless Orbit is speaking/open — orbit actions must not kill TTS. */
function dismissUnlessAssistant(setOpenMenu: Dispatch<SetStateAction<MenuId>>) {
  setOpenMenu((m) => (m === "assistant" ? m : null));
}

export function DesktopStoreProvider({
  children,
  terminalOpen: terminalOpenProp,
  onTerminalChange,
}: {
  children: ReactNode;
  terminalOpen?: boolean;
  onTerminalChange?: (open: boolean) => void;
}) {
  const { setLanguage } = useLanguage();
  const { navigateToSection } = useNavigation();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [internalTerminal, setInternalTerminal] = useState(true);
  const terminalOpen = terminalOpenProp ?? internalTerminal;
  const setTerminalOpen = useCallback(
    (open: boolean) => {
      if (onTerminalChange) onTerminalChange(open);
      else setInternalTerminal(open);
    },
    [onTerminalChange],
  );

  const [desktopHidden, setDesktopHidden] = useState(false);
  const desktopSnapshot = useRef<{ projects: boolean; terminal: boolean; mail: boolean } | null>(null);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [preferences, setPreferences] = useState<DesktopPreferences>(() => loadPreferences());
  const [focusMode, setFocusMode] = useState<FocusModeState>({ active: false, endsAt: null });
  const [connection, setConnection] = useState<ConnectionStatus>("checking");
  const [assistantAvailable, setAssistantAvailable] = useState<boolean | null>(null);
  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [focusedWindowId, setFocusedWindowId] = useState<DesktopWindowId>("finder");

  useEffect(() => {
    applyMotionPreference(preferences.reducedMotion);
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    applyFocusModeClass(focusMode.active);
  }, [focusMode.active]);

  useEffect(() => {
    if (!focusMode.active || !focusMode.endsAt) return;
    const remaining = focusMode.endsAt - Date.now();
    const timer = window.setTimeout(
      () => setFocusMode({ active: false, endsAt: null }),
      Math.max(remaining, 0),
    );
    return () => window.clearTimeout(timer);
  }, [focusMode]);

  const checkConnection = useCallback(async () => {
    setConnection("checking");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch("/api/chat", { method: "GET", signal: controller.signal, cache: "no-store" });
      setConnection(res.ok || res.status === 503 ? "reachable" : "unreachable");
    } catch {
      setConnection("unreachable");
    } finally {
      window.clearTimeout(timer);
    }
    try {
      const health = await fetch("/api/assistant/health", { method: "GET", cache: "no-store" });
      if (health.ok) {
        const data = (await health.json()) as { available?: boolean };
        setAssistantAvailable(Boolean(data.available));
      } else {
        setAssistantAvailable(false);
      }
    } catch {
      setAssistantAvailable(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkConnection();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkConnection]);

  const openProjects = useCallback((opts?: OpenProjectsOpts) => {
    setDesktopHidden(false);
    setProjectsOpen(true);
    setFocusedWindowId("finder");
    if (opts?.projectId) setSelectedProjectId(opts.projectId);
    dismissUnlessAssistant(setOpenMenu);
  }, []);

  const closeProjects = useCallback(() => {
    setProjectsOpen(false);
    if (terminalOpen) setFocusedWindowId("terminal");
  }, [terminalOpen]);

  const openTerminal = useCallback(() => {
    setDesktopHidden(false);
    setProjectsOpen(false);
    setTerminalOpen(true);
    setFocusedWindowId("terminal");
    dismissUnlessAssistant(setOpenMenu);
  }, [setTerminalOpen]);

  const closeTerminal = useCallback(() => {
    setTerminalOpen(false);
    if (projectsOpen) setFocusedWindowId("finder");
  }, [projectsOpen, setTerminalOpen]);

  const openMail = useCallback(() => {
    setDesktopHidden(false);
    setMailOpen(true);
    setFocusedWindowId("mail");
    dismissUnlessAssistant(setOpenMenu);
  }, []);

  const closeMail = useCallback(() => {
    setMailOpen(false);
    if (projectsOpen) setFocusedWindowId("finder");
    else if (terminalOpen) setFocusedWindowId("terminal");
  }, [projectsOpen, terminalOpen]);

  const closeActiveWindow = useCallback(() => {
    if (focusedWindowId === "finder" && projectsOpen) closeProjects();
    else if (focusedWindowId === "terminal" && terminalOpen) closeTerminal();
    else if (focusedWindowId === "mail" && mailOpen) closeMail();
    else if (aboutOpen) setAboutOpen(false);
    else if (preferencesOpen) setPreferencesOpen(false);
    else if (tourOpen) setTourOpen(false);
    else if (shortcutsOpen) setShortcutsOpen(false);
  }, [
    focusedWindowId,
    projectsOpen,
    terminalOpen,
    mailOpen,
    aboutOpen,
    preferencesOpen,
    tourOpen,
    shortcutsOpen,
    closeProjects,
    closeTerminal,
    closeMail,
  ]);

  const bringForward = useCallback(
    (id: DesktopWindowId) => {
      setDesktopHidden(false);
      if (id === "finder") openProjects();
      else if (id === "terminal") openTerminal();
      else if (id === "mail") openMail();
      else if (id === "about") {
        setAboutOpen(true);
        setFocusedWindowId("about");
      } else if (id === "preferences") {
        setPreferencesOpen(true);
        setFocusedWindowId("preferences");
      } else if (id === "tour") {
        setTourOpen(true);
        setFocusedWindowId("tour");
      }
      dismissUnlessAssistant(setOpenMenu);
    },
    [openProjects, openTerminal, openMail],
  );

  const showDesktop = useCallback(() => {
    desktopSnapshot.current = { projects: projectsOpen, terminal: terminalOpen, mail: mailOpen };
    setProjectsOpen(false);
    setTerminalOpen(false);
    setMailOpen(false);
    setAboutOpen(false);
    setPreferencesOpen(false);
    setTourOpen(false);
    setShortcutsOpen(false);
    setDesktopHidden(true);
    setOpenMenu(null);
  }, [projectsOpen, terminalOpen, mailOpen, setTerminalOpen]);

  const restoreDesktop = useCallback(() => {
    const snap = desktopSnapshot.current;
    setDesktopHidden(false);
    if (snap) {
      setProjectsOpen(snap.projects);
      setTerminalOpen(snap.terminal);
      setMailOpen(snap.mail);
      setFocusedWindowId(snap.mail ? "mail" : snap.projects ? "finder" : snap.terminal ? "terminal" : "finder");
    }
    desktopSnapshot.current = null;
  }, [setTerminalOpen]);

  const toggleFocus = useCallback((enabled?: boolean) => {
    setFocusMode((prev) => {
      const next = enabled ?? !prev.active;
      if (!next) return { active: false, endsAt: null };
      return { active: true, endsAt: Date.now() + FOCUS_DURATION_MS };
    });
  }, []);

  const updatePreferences = useCallback((patch: Partial<DesktopPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const reduceEffects = useCallback(() => {
    updatePreferences({ reducedMotion: true });
  }, [updatePreferences]);

  const windows = useMemo<DesktopWindow[]>(() => {
    const list: DesktopWindow[] = [
      {
        id: "finder",
        title: WINDOW_TITLES.finder,
        open: projectsOpen && !desktopHidden,
        focused: focusedWindowId === "finder" && projectsOpen,
      },
      {
        id: "terminal",
        title: WINDOW_TITLES.terminal,
        open: terminalOpen && !desktopHidden,
        focused: focusedWindowId === "terminal" && terminalOpen,
      },
      {
        id: "mail",
        title: WINDOW_TITLES.mail,
        open: mailOpen && !desktopHidden,
        focused: focusedWindowId === "mail" && mailOpen,
      },
    ];
    if (aboutOpen) {
      list.push({ id: "about", title: WINDOW_TITLES.about, open: true, focused: focusedWindowId === "about" });
    }
    if (preferencesOpen) {
      list.push({
        id: "preferences",
        title: WINDOW_TITLES.preferences,
        open: true,
        focused: focusedWindowId === "preferences",
      });
    }
    if (tourOpen) {
      list.push({ id: "tour", title: WINDOW_TITLES.tour, open: true, focused: focusedWindowId === "tour" });
    }
    return list;
  }, [projectsOpen, terminalOpen, mailOpen, desktopHidden, focusedWindowId, aboutOpen, preferencesOpen, tourOpen]);

  const activeAppName = useMemo(() => {
    const focused = windows.find((w) => w.focused && w.open);
    return focused?.title ?? "Finder";
  }, [windows]);

  const value = useMemo<DesktopStoreValue>(
    () => ({
      windows,
      focusedWindowId,
      activeAppName,
      projectsOpen,
      terminalOpen,
      mailOpen,
      desktopHidden,
      openMenu,
      setOpenMenu,
      closeMenus: () => setOpenMenu(null),
      preferences,
      updatePreferences,
      focusMode,
      toggleFocus,
      connection,
      checkConnection,
      assistantAvailable,
      assistantState,
      setAssistantState,
      selectedProjectId,
      setSelectedProjectId,
      openProjects,
      closeProjects,
      openTerminal,
      closeTerminal,
      openMail,
      closeMail,
      setTerminalOpen,
      closeActiveWindow,
      bringForward,
      showDesktop,
      restoreDesktop,
      openAbout: () => {
        setAboutOpen(true);
        setFocusedWindowId("about");
        setOpenMenu(null);
      },
      openPreferences: () => {
        setPreferencesOpen(true);
        setFocusedWindowId("preferences");
        setOpenMenu(null);
      },
      openTour: () => {
        setTourOpen(true);
        setFocusedWindowId("tour");
        setOpenMenu(null);
      },
      openShortcuts: () => {
        setShortcutsOpen(true);
        setOpenMenu(null);
      },
      aboutOpen,
      preferencesOpen,
      tourOpen,
      shortcutsOpen,
      setAboutOpen,
      setPreferencesOpen,
      setTourOpen,
      setShortcutsOpen,
      navigateHome: () => {
        navigateToSection("home");
        dismissUnlessAssistant(setOpenMenu);
      },
      navigateContact: () => {
        navigateToSection("contact");
        dismissUnlessAssistant(setOpenMenu);
      },
      navigateBlog: () => {
        window.location.assign("/blog");
      },
      reduceEffects,
    }),
    [
      windows,
      focusedWindowId,
      activeAppName,
      projectsOpen,
      terminalOpen,
      mailOpen,
      desktopHidden,
      openMenu,
      preferences,
      updatePreferences,
      focusMode,
      toggleFocus,
      connection,
      checkConnection,
      assistantAvailable,
      assistantState,
      selectedProjectId,
      openProjects,
      closeProjects,
      openTerminal,
      closeTerminal,
      openMail,
      closeMail,
      setTerminalOpen,
      closeActiveWindow,
      bringForward,
      showDesktop,
      restoreDesktop,
      aboutOpen,
      preferencesOpen,
      tourOpen,
      shortcutsOpen,
      navigateToSection,
      reduceEffects,
    ],
  );

  // Expose action bridge for assistant client
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { action?: string; args?: Record<string, unknown> };
      if (!detail?.action) return;
      switch (detail.action) {
        case "open_projects":
          openProjects(
            typeof detail.args?.projectId === "string"
              ? { projectId: detail.args.projectId }
              : undefined,
          );
          break;
        case "open_terminal":
          openTerminal();
          break;
        case "navigate_contact":
          navigateToSection("contact");
          dismissUnlessAssistant(setOpenMenu);
          break;
        case "change_language":
          if (detail.args?.language === "en" || detail.args?.language === "es" || detail.args?.language === "zh") {
            setLanguage(detail.args.language);
          }
          break;
        case "toggle_focus":
          toggleFocus(typeof detail.args?.enabled === "boolean" ? detail.args.enabled : undefined);
          break;
        default:
          break;
      }
    };
    window.addEventListener("mac-desktop-action", handler);
    return () => window.removeEventListener("mac-desktop-action", handler);
  }, [openProjects, openTerminal, navigateToSection, setLanguage, toggleFocus]);

  return <DesktopStoreContext.Provider value={value}>{children}</DesktopStoreContext.Provider>;
}

export function useDesktopStore() {
  const ctx = useContext(DesktopStoreContext);
  if (!ctx) throw new Error("useDesktopStore must be used within DesktopStoreProvider");
  return ctx;
}

export function dispatchDesktopAction(action: string, args?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mac-desktop-action", { detail: { action, args } }));
}
