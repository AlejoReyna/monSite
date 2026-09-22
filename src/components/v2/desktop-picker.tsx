"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { BookOpen, Folder, Globe, MoreHorizontal, Moon, Sparkles, Terminal, Mail, Github } from "lucide-react";
import { useLanguage, type Language } from "@/components/lang-context";
import { DesktopStoreProvider, useDesktopStore } from "@/lib/desktop/desktop-store";
import { clampDockSize, DOCK_COPY, DOCK_PRESETS, DOCK_SIZE, DOCK_SIZE_NAMES, stepDockSize } from "@/lib/desktop/dock-layout";
import DesktopContextMenu, { type ContextMenuEntry } from "./desktop-context-menu";
import { MacMenuBar } from "./mac-menu-bar";
import MacProjects from "./mac-projects";
import MacMail from "./mac-mail";
import MacCoffeeDrawing from "./mac-coffee-drawing";
import styles from "./desktop-picker.module.css";

type MobileView = "assistant" | "folders";

const LANGUAGES: { id: Language; label: string; title: string }[] = [
  { id: "en", label: "EN", title: "English" },
  { id: "es", label: "ES", title: "Español" },
  { id: "zh", label: "中文", title: "中文" },
];

function MacDesktop({ macMobile = false, mobileView, onMobileViewChange }: { macMobile?: boolean; mobileView?: MobileView; onMobileViewChange?: (view: MobileView) => void }) {
  const { language, setLanguage } = useLanguage();
  const store = useDesktopStore();
  const dock = DOCK_COPY[language];
  // lg and up is where the desktop is the macOS desktop: the artwork shows and the Dock is the Dock,
  // with a resize handle. Below it the top Dock uses compact tiles.
  const [lgViewport, setLgViewport] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dockMenu, setDockMenu] = useState<{ x: number; y: number; host: HTMLElement; keyboard: boolean } | null>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLgViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // The Dock divider resizes the Dock, exactly like the macOS one. The pointer is tracked on the
  // window rather than on the handle, for the same reason the icon drags are: pointer capture is not
  // delivered reliably everywhere, and a lost pointerup would leave the Dock stuck mid-resize.
  const resize = useRef<((commit: boolean) => void) | null>(null);
  useEffect(() => {
    const session = resize;
    return () => session.current?.(false);
  }, []);

  const startResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0 || !lgViewport) return;
    event.preventDefault();
    resize.current?.(false);
    const pointerId = event.pointerId;
    const startY = event.clientY;
    const from = store.dockSize;
    let size = from;
    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== pointerId) return;
      // A mouse moving with no button held was released somewhere we never heard about.
      if (move.pointerType === "mouse" && !(move.buttons & 1)) return resize.current?.(true);
      // Dragging up grows the Dock and down shrinks it; the handle follows the pointer 1:1.
      size = clampDockSize(from + (startY - move.clientY));
      store.previewDockSize(size);
    };
    const onUp = (up: PointerEvent) => { if (up.pointerId === pointerId) resize.current?.(true); };
    const onCancel = (cancel: PointerEvent) => { if (cancel.pointerId === pointerId) resize.current?.(false); };
    const onBlur = () => resize.current?.(false);
    // Escape leaves the Dock the size it was, as it does during an icon drag.
    const onKeyDown = (key: KeyboardEvent) => {
      if (key.key !== "Escape") return;
      key.preventDefault();
      resize.current?.(false);
    };
    const end = (commit: boolean) => {
      if (resize.current !== end) return;
      resize.current = null;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", onBlur);
      dockRef.current?.removeAttribute("data-resizing");
      // Committing the size it already had still clears the preview, so a cancel snaps back.
      store.setDockSize(commit ? size : from);
    };
    resize.current = end;
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", onBlur);
    dockRef.current?.setAttribute("data-resizing", "");
  };

  const stepResize = (event: ReactKeyboardEvent<HTMLElement>) => {
    const steps = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : event.key === "ArrowDown" || event.key === "ArrowLeft" ? -1 : 0;
    if (steps) store.setDockSize(stepDockSize(store.dockSize, steps));
    else if (event.key === "Home") store.setDockSize(DOCK_SIZE.min);
    else if (event.key === "End") store.setDockSize(DOCK_SIZE.max);
    else return;
    event.preventDefault();
  };

  // Right-click the divider or the Dock's own frame for its sizes, the way macOS does. The tiles keep
  // the browser's menu, so Open in New Tab still works on the links among them.
  const openDockMenu = (event: ReactMouseEvent<HTMLElement>) => {
    const host = rootRef.current;
    if (!host || !lgViewport || (event.target as Element | null)?.closest("button, a")) return;
    event.preventDefault();
    resize.current?.(false);
    // Shift+F10 and the Menu key carry no pointer position; anchor those to the Dock itself.
    const keyboard = event.button !== 2 && !event.ctrlKey;
    const rect = event.currentTarget.getBoundingClientRect();
    setDockMenu({ x: keyboard ? rect.left + rect.width / 2 : event.clientX, y: keyboard ? rect.top : event.clientY, host, keyboard });
  };

  const dockMenuEntries = (): ContextMenuEntry[] => [
    { type: "submenu", id: "dockSize", label: dock.size, entries: DOCK_SIZE_NAMES.map(name => ({
      type: "item", id: `dockSize-${name}`, label: dock[name], checked: store.dockSize === DOCK_PRESETS[name],
      onSelect: () => store.setDockSize(DOCK_PRESETS[name]),
    })) },
    { type: "separator", id: "dockMenu-separator" },
    { type: "item", id: "dockSettings", label: dock.settings, onSelect: () => store.openPreferences() },
  ];

  // The mobile Dock's More panel is a modal <dialog>, so Escape, the focus trap and the focus return to the
  // More button come from the platform.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (sheetOpen && !sheet.open) sheet.showModal();
    else if (!sheetOpen && sheet.open) sheet.close();
  }, [sheetOpen]);


  const copy =
    language === "es"
      ? {
          projects: "Proyectos",
          contact: "Contacto",
          view: "Vista",
          terminal: "Terminal",
          folders: "Carpetas",
          more: "Más",
          settings: "Ajustes",
          language: "Idioma",
          motion: "Reducir efectos",
          focus: "Modo Focus",
          story: "Mi historia",
        }
      : language === "zh"
        ? {
            projects: "项目",
            contact: "联系我",
            view: "视图",
            terminal: "终端",
            folders: "文件夹",
            more: "更多",
            settings: "设置",
            language: "语言",
            motion: "降低效果",
            focus: "Focus 模式",
            story: "我的故事",
          }
        : {
            projects: "Projects",
            contact: "Contact",
            view: "View",
            terminal: "Terminal",
            folders: "Folders",
            more: "More",
            settings: "Settings",
            language: "Language",
            motion: "Reduce effects",
            focus: "Focus mode",
            story: "My story",
          };

  return (
    // data-desktop-root / data-desktop-background: where desktop icon drags and the desktop context menu live.
    <div ref={rootRef} data-desktop-root="" data-mobile-view={mobileView} className={`${styles.mac} ${macMobile ? styles.macMobile : ""} ${store.focusMode.active || store.preferences.reducedMotion ? styles.macCalm : ""}`.trim()}>
      <div className={styles.wallpaper} data-desktop-background="" aria-hidden="true" />
      {!store.desktopHidden && (!macMobile || lgViewport) && (
        <div className={styles.macGif} data-desktop-background="" aria-hidden="true">
          <MacCoffeeDrawing />
        </div>
      )}
      <MacMenuBar />
      {!store.desktopHidden && (
        <>
          <MacProjects
            desktopFoldersInteractive={mobileView !== "assistant"}
            open={store.projectsOpen}
            onOpen={() => store.openProjects()}
            onClose={store.closeProjects}
            selectedProjectId={store.selectedProjectId}
            projectRequest={store.projectRequest}
          />
          <MacMail open={store.mailOpen} onClose={store.closeMail} />
        </>
      )}
      {/* The switcher and Dock are independently positioned across the mobile top row. */}
      <div className={styles.rail}>
        {macMobile && (
          <div className={styles.viewTrack} role="group" aria-label={copy.view}>
            {(["assistant", "folders"] as const).map(view => (
              <button
                key={view}
                type="button"
                data-launcher={view === "assistant" ? "terminal" : "projects"}
                aria-label={view === "assistant" ? copy.terminal : copy.folders}
                title={view === "assistant" ? copy.terminal : copy.folders}
                aria-pressed={(mobileView ?? "assistant") === view}
                onClick={() => {
                  (document.activeElement as HTMLElement | null)?.blur();
                  store.closeProjects();
                  store.closeMail();
                  onMobileViewChange?.(view);
                }}
              >
                {view === "assistant" ? <Terminal size={22} aria-hidden="true" /> : <Folder size={22} aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
        <nav ref={dockRef} className={styles.dock} aria-label="Dock" onContextMenu={openDockMenu} onKeyDown={(event) => event.stopPropagation()}>
          <button
            onClick={() => store.openProjects()}
            id="mac-projects-launcher"
            data-launcher="projects"
            aria-expanded={store.projectsOpen}
            aria-label={copy.projects}
            data-label={copy.projects}
            className={styles.finder}
          >
            <Folder />
          </button>
          <Link href="/blog" aria-label="Blog" data-label="Blog" className={styles.safari}>
            <Globe />
          </Link>
          <a
            href="https://github.com/AlejoReyna"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            data-label="GitHub"
            className={styles.github}
          >
            <Github />
          </a>
          <button
            onClick={() => store.openMail()}
            id="mac-mail-launcher"
            data-launcher="mail"
            aria-expanded={store.mailOpen}
            aria-label={copy.contact}
            data-label={copy.contact}
            className={styles.mail}
          >
            <Mail />
          </button>
          {/* The divider doubles as the Dock's resize handle: drag it, or focus it and use the arrows. */}
          <span
            className={styles.resizer}
            data-label={lgViewport ? dock.resize : undefined}
            role={lgViewport ? "slider" : "separator"}
            tabIndex={lgViewport ? 0 : undefined}
            aria-orientation="vertical"
            aria-label={lgViewport ? dock.size : undefined}
            aria-valuemin={lgViewport ? DOCK_SIZE.min : undefined}
            aria-valuemax={lgViewport ? DOCK_SIZE.max : undefined}
            aria-valuenow={lgViewport ? store.dockSize : undefined}
            aria-valuetext={lgViewport ? `${store.dockSize} px` : undefined}
            onPointerDown={startResize}
            onKeyDown={stepResize}
          />
          <button
            onClick={() => store.openTerminal()}
            id="mac-terminal-launcher"
            data-launcher="terminal"
            aria-label="Terminal"
            data-label="Terminal"
            className={styles.terminal}
          >
            <Terminal />
          </button>
          {macMobile && (
            <button
              type="button"
              className={styles.more}
              aria-label={copy.more}
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              <MoreHorizontal size={22} aria-hidden="true" />
            </button>
          )}
        </nav>
      </div>
      {dockMenu && createPortal(
        // Keyed by position: a right-click elsewhere reopens a fresh menu even when React batches close + open.
        <DesktopContextMenu key={`${dockMenu.x},${dockMenu.y}`} host={dockMenu.host} x={dockMenu.x} y={dockMenu.y} label={dock.dock} entries={dockMenuEntries()} focusFirst={dockMenu.keyboard} onClose={() => setDockMenu(null)} />,
        dockMenu.host,
      )}
      {/* The menu bar is hidden below lg, so its language, motion and Focus controls live here. */}
      {macMobile && (
        <dialog
          ref={sheetRef}
          className={styles.sheet}
          aria-label={copy.settings}
          onClose={() => setSheetOpen(false)}
          onClick={(event) => {
            if (event.target === sheetRef.current) setSheetOpen(false);
          }}
        >
          <div className={styles.sheetBody}>
            <span className={styles.grabber} aria-hidden="true" />

            <h2 className={styles.sheetLabel}>{copy.language}</h2>
            <div className={styles.segmented} role="group" aria-label={copy.language}>
              {LANGUAGES.map(option => (
                <button
                  key={option.id}
                  type="button"
                  title={option.title}
                  aria-pressed={language === option.id}
                  onClick={() => setLanguage(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.sheetRow}>
              <Sparkles size={20} aria-hidden="true" />
              <span>{copy.motion}</span>
              <button
                type="button"
                role="switch"
                aria-checked={store.preferences.reducedMotion}
                aria-label={copy.motion}
                className={styles.toggle}
                onClick={() => store.updatePreferences({ reducedMotion: !store.preferences.reducedMotion })}
              >
                <span aria-hidden="true" />
              </button>
            </div>

            <div className={styles.sheetRow}>
              <Moon size={20} aria-hidden="true" />
              <span>{copy.focus}</span>
              <button
                type="button"
                role="switch"
                aria-checked={store.focusMode.active}
                aria-label={copy.focus}
                className={styles.toggle}
                onClick={() => store.toggleFocus()}
              >
                <span aria-hidden="true" />
              </button>
            </div>

            <Link href="/historia" className={styles.sheetRow} onClick={() => setSheetOpen(false)}>
              <BookOpen size={20} aria-hidden="true" />
              <span>{copy.story}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 5 16 12 9 19" />
              </svg>
            </Link>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default function DesktopPicker({
  terminalOpen,
  onTerminalOpenChange,
  macMobileStage = false,
  mobileView,
  onMobileViewChange,
}: {
  terminalOpen?: boolean;
  onTerminalOpenChange?: (open: boolean) => void;
  /** When true (mobile mac + stage active), hide desktop macGif and clear dock for the sheet. */
  macMobileStage?: boolean;
  mobileView?: MobileView;
  onMobileViewChange?: (view: MobileView) => void;
}) {
  return (
    <DesktopStoreProvider terminalOpen={terminalOpen} onTerminalChange={onTerminalOpenChange}>
      <MacDesktop macMobile={macMobileStage} mobileView={mobileView} onMobileViewChange={onMobileViewChange} />
    </DesktopStoreProvider>
  );
}
