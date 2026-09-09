"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Folder, Globe2, Mail, Palette, Terminal } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { useNavigation } from "@/contexts/navigation-context";
import styles from "./ubuntu-desktop.module.css";

type UbuntuDesktopProps = {
  onChangeView: () => void;
  onTerminal: () => void;
  changeLabel: string;
};

export default function UbuntuDesktop({ onChangeView, onTerminal, changeLabel }: UbuntuDesktopProps) {
  const { language } = useLanguage();
  const { navigateToSection } = useNavigation();
  const [time, setTime] = useState("");
  const labels = language === "es"
    ? { activities: "Actividades", projects: "Proyectos", blog: "Blog", contact: "Contacto", terminal: "Terminal" }
    : language === "zh"
      ? { activities: "活动", projects: "项目", blog: "博客", contact: "联系", terminal: "终端" }
      : { activities: "Activities", projects: "Projects", blog: "Blog", contact: "Contact", terminal: "Terminal" };

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString(
      language === "es" ? "es-MX" : language === "zh" ? "zh-CN" : "en-US",
      { weekday: "short", hour: "numeric", minute: "2-digit" },
    ));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <div className={styles.desktop}>
      <div className={styles.topBar} onKeyDown={event => event.stopPropagation()}>
        <span>{labels.activities}</span>
        <time>{time}</time>
        <button type="button" onClick={onChangeView} aria-label={changeLabel}><Palette size={14} />{changeLabel}<ChevronDown size={12} /></button>
      </div>

      <nav className={styles.dock} aria-label="Ubuntu dock" onKeyDown={event => event.stopPropagation()}>
        <button type="button" onClick={() => navigateToSection("inverater")} aria-label={labels.projects} data-label={labels.projects}><Folder /></button>
        <Link href="/blog" aria-label={labels.blog} data-label={labels.blog}><Globe2 /></Link>
        <button type="button" onClick={() => navigateToSection("contact")} aria-label={labels.contact} data-label={labels.contact}><Mail /></button>
        <button type="button" onClick={onTerminal} aria-label={labels.terminal} data-label={labels.terminal}><Terminal /></button>
      </nav>

      <div className={styles.character} aria-hidden="true">
        <Image
          src="/16.gif"
          alt=""
          fill
          priority
          unoptimized
          sizes="(min-width: 768px) 36vw, 56vw"
        />
      </div>

      <div className={styles.desktopLabel} aria-hidden="true">
        <span>Ubuntu</span>
        <small>Alexis Reyna / Portfolio</small>
      </div>
    </div>
  );
}
