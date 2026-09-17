"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Globe, Terminal, Mail, Github } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { DesktopStoreProvider, useDesktopStore } from "@/lib/desktop/desktop-store";
import { MacMenuBar } from "./mac-menu-bar";
import MacProjects from "./mac-projects";
import MacMail from "./mac-mail";
import MacCoffeeDrawing from "./mac-coffee-drawing";
import styles from "./desktop-picker.module.css";

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
    // data-desktop-root / data-desktop-background: where desktop icon drags and the desktop context menu live.
    <div data-desktop-root="" data-mobile-view={mobileView} className={`${styles.mac} ${macMobile ? styles.macMobile : ""} ${store.focusMode.active || store.preferences.reducedMotion ? styles.macCalm : ""}`.trim()}>
      <div className={styles.wallpaper} data-desktop-background="" aria-hidden="true" />
      {!store.desktopHidden && (!macMobile || desktopArtwork) && (
        <div className={styles.macGif} data-desktop-background="" aria-hidden="true">
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
