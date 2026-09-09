"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Globe, Terminal, Mail, Github, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { DesktopStoreProvider, useDesktopStore } from "@/lib/desktop/desktop-store";
import { MacMenuBar } from "./mac-menu-bar";
import MacProjects from "./mac-projects";
import MacMail from "./mac-mail";
import MacCoffeeDrawing from "./mac-coffee-drawing";
import WindowsDesktop from "./windows-desktop";
import UbuntuDesktop from "./ubuntu-desktop";
import styles from "./desktop-picker.module.css";

export type DesktopTheme = "windows" | "mac" | "ubuntu";

type MobileView = "assistant" | "folders";

function MacDesktop({ macMobile = false, mobileView, onMobileViewChange }: { macMobile?: boolean; mobileView?: MobileView; onMobileViewChange?: (view: MobileView) => void }) {
  const { language } = useLanguage();
  const store = useDesktopStore();
  const [desktopArtwork, setDesktopArtwork] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopArtwork(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);


  const copy =
    language === "es"
      ? { projects: "Proyectos", contact: "Contacto" }
      : language === "zh"
        ? { projects: "项目", contact: "联系我" }
        : { projects: "Projects", contact: "Contact" };

  return (
    <div data-mobile-view={mobileView} className={`${styles.mac} ${macMobile ? styles.macMobile : ""} ${store.focusMode.active || store.preferences.reducedMotion ? styles.macCalm : ""}`.trim()}>
      <div className={styles.wallpaper} aria-hidden="true" />
      {!store.desktopHidden && (!macMobile || desktopArtwork) && (
        <div className={styles.macGif} aria-hidden="true">
          <MacCoffeeDrawing />
        </div>
      )}
      <MacMenuBar />
      {macMobile && (
        <div className={styles.mobileViewSwitcher} role="group" aria-label={language === "es" ? "Vista móvil" : language === "zh" ? "移动视图" : "Mobile view"}>
          {(["assistant", "folders"] as const).map(view => (
            <button key={view} type="button" aria-label={view === "assistant" ? (language === "es" ? "Terminal" : language === "zh" ? "终端" : "Terminal") : (language === "es" ? "Carpetas" : language === "zh" ? "文件夹" : "Folders")} title={view === "assistant" ? (language === "es" ? "Terminal" : language === "zh" ? "终端" : "Terminal") : (language === "es" ? "Carpetas" : language === "zh" ? "文件夹" : "Folders")} aria-pressed={(mobileView ?? "assistant") === view} onClick={() => {
              (document.activeElement as HTMLElement | null)?.blur();
              store.closeProjects();
              store.closeMail();
              onMobileViewChange?.(view);
            }}>
              {view === "assistant" ? <Terminal size={19} aria-hidden="true" /> : <Folder size={19} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
      {!store.desktopHidden && (
        <>
          <MacProjects
            desktopFoldersInteractive={mobileView !== "assistant"}
            open={store.projectsOpen}
            onOpen={() => store.openProjects()}
            onClose={store.closeProjects}
            selectedProjectId={store.selectedProjectId}
          />
          <MacMail open={store.mailOpen} onClose={store.closeMail} />
        </>
      )}
      <nav className={styles.dock} aria-label="Dock" onKeyDown={(event) => event.stopPropagation()}>
        <button
          onClick={() => store.openProjects()}
          id="mac-projects-launcher"
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
          aria-expanded={store.mailOpen}
          aria-label={copy.contact}
          data-label={copy.contact}
          className={styles.mail}
        >
          <Mail />
        </button>
        <span className={styles.separator} />
        <button
          onClick={() => store.openTerminal()}
          id="mac-terminal-launcher"
          aria-label="Terminal"
          data-label="Terminal"
          className={styles.terminal}
        >
          <Terminal />
        </button>
      </nav>
    </div>
  );
}

export default function DesktopPicker({
  theme,
  onChange,
  onTerminal,
  terminalOpen,
  onTerminalOpenChange,
  macMobileStage = false,
  mobileView,
  onMobileViewChange,
}: {
  theme: DesktopTheme;
  onChange: (theme: DesktopTheme) => void;
  onTerminal: () => void;
  terminalOpen?: boolean;
  onTerminalOpenChange?: (open: boolean) => void;
  /** When true (mobile mac + stage active), hide desktop macGif and clear dock for the sheet. */
  macMobileStage?: boolean;
  mobileView?: MobileView;
  onMobileViewChange?: (view: MobileView) => void;
}) {
  const { language } = useLanguage();
  // macOS is the sole public view. Keep the picker and alternate renderers in
  // this component so they can be restored later without recreating them.
  const isPickerOpen = false;

  useEffect(() => {
    document.body.classList.toggle("desktop-picker-welcome-active", isPickerOpen);
    return () => document.body.classList.remove("desktop-picker-welcome-active");
  }, [isPickerOpen]);

  const copy =
    language === "es"
      ? {
          title: "¿Cuál es tu escritorio?",
          detail: "Elige cómo quieres explorar mi portafolio. Puedes cambiar cuando quieras.",
          change: "Cambiar vista",
          close: "Cerrar",
          classic: "Un clásico de 1995",
          modern: "Un espacio más minimalista",
          ubuntu: "El original, con energía Ubuntu",
        }
      : language === "zh"
        ? {
            title: "选择你的桌面",
            detail: "选择浏览作品集的方式，随时可以切换。",
            change: "切换视图",
            close: "关闭",
            classic: "1995 年的经典",
            modern: "简约的工作空间",
            ubuntu: "原始 Ubuntu 风格",
          }
        : {
            title: "Choose your desktop",
            detail: "Pick a home for exploring my portfolio. You can switch anytime.",
            change: "Change view",
            close: "Close",
            classic: "A 1995 classic",
            modern: "A quieter workspace",
            ubuntu: "The original Ubuntu energy",
          };

  const choose = (value: DesktopTheme) => {
    onChange(value);
  };
  // Intentionally a no-op while macOS is the only exposed experience.
  const openPicker = () => {};

  return (
    <>
      {isPickerOpen && (
        <div
          id="desktop-picker-welcome"
          className={styles.startup}
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-picker-title"
          aria-describedby="desktop-picker-description"
        >
          <div className={styles.startupDialog}>
            <button className={styles.close} aria-label={copy.close}>
              ×
            </button>
            <span className={styles.eyebrow}>ALEXIS REYNA / PORTFOLIO</span>
            <h2 id="desktop-picker-title">{copy.title}</h2>
            <p id="desktop-picker-description">{copy.detail}</p>
            <div className={styles.options}>
              <button onClick={() => choose("windows")} aria-pressed={theme === "windows"}>
                <span className={styles.winPreview}>
                  <span>▦</span>
                  <i>Start</i>
                </span>
                <strong>Windows 95</strong>
                <small>{copy.classic}</small>
              </button>
              <button onClick={() => choose("mac")} aria-pressed={theme === "mac"}>
                <span className={styles.macPreview}>
                  <i />
                </span>
                <strong>macOS</strong>
                <small>{copy.modern}</small>
              </button>
              <button onClick={() => choose("ubuntu")} aria-pressed={theme === "ubuntu"}>
                <span className={styles.ubuntuPreview}>
                  <LayoutDashboard size={30} />
                  <i />
                </span>
                <strong>Ubuntu</strong>
                <small>{copy.ubuntu}</small>
              </button>
            </div>
          </div>
        </div>
      )}
      {theme === "windows" ? (
        <WindowsDesktop onChangeView={openPicker} changeLabel={copy.change} />
      ) : theme === "ubuntu" ? (
        <UbuntuDesktop onChangeView={openPicker} onTerminal={onTerminal} changeLabel={copy.change} />
      ) : (
        <DesktopStoreProvider terminalOpen={terminalOpen} onTerminalChange={onTerminalOpenChange}>
          <MacDesktop macMobile={macMobileStage} mobileView={mobileView} onMobileViewChange={onMobileViewChange} />
        </DesktopStoreProvider>
      )}
    </>
  );
}
