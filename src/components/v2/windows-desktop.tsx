"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Palette } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { useNavigation } from "@/contexts/navigation-context";
import styles from "./windows-desktop.module.css";

function DesktopIcon({ kind }: { kind: "computer" | "folder" | "web" }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true" shapeRendering="crispEdges">
      {kind === "computer" ? <>
        <path fill="#111" d="M4 2h23v22H4zM2 26h28v5H2z" />
        <path fill="#c0c0c0" d="M5 3h21v20H5zM12 23h8v4h-8zM3 27h26v3H3z" />
        <path stroke="#fff" d="M5 22V3h20M3 29v-2h25" />
        <path fill="#000080" d="M7 5h17v15H7z" /><path fill="#008080" d="M8 6h15v12H8z" />
        <path fill="#65dbdf" d="M9 7h12v2H9zM9 9h7v2H9z" /><path fill="#808080" d="M6 28h14v1H6z" />
      </> : kind === "folder" ? <>
        <path fill="#111" d="M2 7h12l3 3h13v19H2z" />
        <path fill="#c5a743" d="M3 8h10l3 3h13v17H3z" />
        <path fill="#ffff95" d="M3 14h27l-3 14H3z" />
        <path stroke="#fff" d="M3 27V14h26M3 12V8h10" /><path stroke="#808000" d="M4 28h23l3-14" />
      </> : <>
        <path fill="#111" d="M9 2h14v3h4v4h3v14h-3v4h-4v3H9v-3H5v-4H2V9h3V5h4z" />
        <path fill="#000080" d="M10 3h12v3h4v4h3v12h-3v4h-4v3H10v-3H6v-4H3V10h3V6h4z" />
        <path fill="#008080" d="M10 5h9v5h6v5h-8v6h-5v-7H6V9h4zM20 22h6v3h-6z" />
        <path stroke="#7ee5df" d="M8 7h15M5 15h22M8 24h15M15 3l-5 12 5 14M18 3l5 12-5 14" />
      </>}
    </svg>
  );
}

function WindowsFlag() {
  return <span className={styles.flag} aria-hidden="true"><i /><i /><i /><i /></span>;
}

export default function WindowsDesktop({ onChangeView, changeLabel }: { onChangeView: () => void; changeLabel: string }) {
  const { language } = useLanguage();
  const { navigateToSection } = useNavigation();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const labels = language === "es"
    ? { computer: "Mi portafolio", projects: "Mis proyectos", web: "Mi blog", start: "Inicio", contact: "Contacto" }
    : language === "zh"
      ? { computer: "我的作品集", projects: "我的项目", web: "我的博客", start: "开始", contact: "联系我" }
      : { computer: "My Portfolio", projects: "My Projects", web: "My Blog", start: "Start", contact: "Contact" };

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString(language === "es" ? "es-MX" : language === "zh" ? "zh-CN" : "en-US", { hour: "numeric", minute: "2-digit" }));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [language]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const projects = () => { setOpen(false); navigateToSection("inverater"); };

  return (
    <div className={styles.desktop}>
      <div className={styles.topBar} onKeyDown={event => event.stopPropagation()}>
        <span>Alexis Reyna&apos;s Portfolio</span>
        <button type="button" onClick={onChangeView}><Palette size={14} />{changeLabel}</button>
      </div>
      <div className={styles.wallpaper} aria-hidden="true">
        <WindowsFlag />
        <span className={styles.microsoft}>Microsoft</span>
        <span className={styles.wordmark}>Windows<span>95</span></span>
      </div>
      <nav className={styles.shortcuts} aria-label="Desktop shortcuts" onKeyDown={event => event.stopPropagation()}>
        <Link href="/legacy" className={styles.shortcut}><DesktopIcon kind="computer" /><span>{labels.computer}</span></Link>
        <button type="button" className={styles.shortcut} onClick={projects}><DesktopIcon kind="folder" /><span>{labels.projects}</span></button>
        <Link href="/blog" className={styles.shortcut}><DesktopIcon kind="web" /><span>{labels.web}</span></Link>
      </nav>
      <div className={styles.taskbar} onKeyDown={event => event.stopPropagation()}>
        <div ref={menuRef} className={styles.startArea} onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); startRef.current?.focus(); }
        }}>
          <button ref={startRef} type="button" className={`${styles.start} ${open ? styles.pressed : ""}`} aria-expanded={open} aria-controls="desktop-start-menu" onClick={() => setOpen(!open)}><WindowsFlag />{labels.start}</button>
          {open && <nav id="desktop-start-menu" className={styles.startMenu} aria-label={labels.start}>
            <div className={styles.menuBrand}>Windows <b>95</b></div>
            <div className={styles.menuLinks}>
              <Link href="/legacy" onClick={() => setOpen(false)}><DesktopIcon kind="computer" />{labels.computer}</Link>
              <button type="button" onClick={projects}><DesktopIcon kind="folder" />{labels.projects}</button>
              <Link href="/blog" onClick={() => setOpen(false)}><DesktopIcon kind="web" />{labels.web}</Link>
              <button type="button" onClick={() => { setOpen(false); navigateToSection("contact"); }}><DesktopIcon kind="folder" />{labels.contact}</button>
            </div>
          </nav>}
        </div>
        <div className={styles.divider} />
        <div className={styles.activeTask}><DesktopIcon kind="computer" /><span>Alexis Reyna</span></div>
        <button type="button" className={styles.projectTask} onClick={projects}><DesktopIcon kind="folder" /><span>{labels.projects}</span></button>
        <div className={styles.tray}><span aria-hidden="true">▥</span><time>{time || "\u00a0"}</time></div>
      </div>
    </div>
  );
}
