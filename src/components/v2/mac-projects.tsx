"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowUpRight, Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { animateGenie } from "@/lib/desktop/genie";
import styles from "./mac-projects.module.css";

const projects = [
  { id: "inverater", title: "Inverater", category: "Proptech", color: "#9aab78", image: null, mark: "inverater.", tags: ["Infrastructure", "Product engineering"], href: "https://www.inverater.com", description: { en: "Real-estate investing made accessible. My work spans infrastructure, hosting and product engineering, keeping the platform running while shipping its next chapter.", es: "Inversión inmobiliaria accesible. Mi trabajo abarca infraestructura, hosting e ingeniería de producto, manteniendo la plataforma mientras construyo su siguiente etapa.", zh: "让房地产投资更易参与。我的工作涵盖基础设施、托管和产品工程，维护平台运行并持续开发新功能。" } },
  { id: "plebes", title: "Plebes DAO", category: "Community / Web3", color: "#ac9ee2", image: "/plebes_bg.png", mark: "PLEBES", tags: ["ICP", "Motoko", "Figma", "UI/UX"], href: "https://plebes.xyz", description: { en: "Community-driven DAO on Internet Computer. Full design, branding and user experience built from scratch.", es: "DAO impulsada por la comunidad en Internet Computer. Diseño completo, branding y experiencia de usuario desde cero.", zh: "基于 Internet Computer 的社区驱动型 DAO。从零开始完成设计、品牌与用户体验。" } },
  { id: "cafeteria", title: "Artisanal Brew", category: "Coffee / Web3", color: "#d0a17b", image: "/blog/artisanal-brew-assets/layer-0.webp", mark: "ARTISANAL BREW", tags: ["Blazor", ".NET", "Solidity", "PostgreSQL"], href: "https://cafe.alexisrs.dev", description: { en: "A pixel-art coffee experience with multichain integrations across Ethereum, BNB Chain and Solana. Built with Blazor and .NET.", es: "Una experiencia de café con pixel art e integraciones en Ethereum, BNB Chain y Solana. Construida con Blazor y .NET.", zh: "像素艺术咖啡体验，集成 Ethereum、BNB Chain 和 Solana。使用 Blazor 与 .NET 构建。" } },
  { id: "wedding", title: "Andrea & Aldo", category: "Wedding / Interactive", color: "#d5a4b2", image: "/andrea_hero.jpeg", mark: "A & A", tags: ["Next.js", "Google Maps", "Framer Motion"], href: "/weddings/andrea", description: { en: "An interactive wedding invitation with an RSVP flow, schedule and maps. A personal digital keepsake for a shared celebration.", es: "Invitación de boda interactiva con RSVP, itinerario y mapas. Un recuerdo digital personal para una celebración compartida.", zh: "互动婚礼邀请函，包含 RSVP、日程与地图。为共同庆祝留下专属数字纪念。" } },
  { id: "nonamedbot", title: "NoNamedBot", category: "AI / Trading agent", color: "#86b8ad", image: null, mark: ">_ NoNamedBot", tags: ["Python", "pandas", "TWAK", "Next.js"], href: "https://github.com/AlejoReyna/no-named-yet-bot", description: { en: "An autonomous BNB Chain trading agent built for BNB Hack. Python scores tokens with regime-aware guardrails; TWAK executes self-custody swaps.", es: "Agente autónomo de trading en BNB Chain para BNB Hack. Python evalúa tokens con controles de riesgo y TWAK ejecuta swaps de autocustodia.", zh: "为 BNB Hack 构建的自主 BNB Chain 交易代理。Python 在风险防护下评估代币，TWAK 执行自托管交换。" } },
];

export default function MacProjects({
  open,
  onOpen,
  onClose,
  selectedProjectId = null,
  desktopFoldersInteractive = true,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedProjectId?: string | null;
  desktopFoldersInteractive?: boolean;
}) {
  const { language } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  // Sync Spotlight / Orbit project selection when Finder opens or the id changes.
  useEffect(() => {
    if (!selectedProjectId) return;
    const timer = window.setTimeout(() => setSelected(selectedProjectId), 0);
    return () => window.clearTimeout(timer);
  }, [selectedProjectId, open]);
  const windowRef = useRef<HTMLElement>(null);
  const minimized = useRef(false);
  const cancelGenie = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (!open || !windowRef.current) return;
    cancelGenie.current?.();
    if (minimized.current) {
      cancelGenie.current = animateGenie(windowRef.current, document.getElementById("mac-projects-launcher"), true, () => closeRef.current?.focus({ preventScroll: true }));
      minimized.current = false;
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => () => cancelGenie.current?.(), []);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const copy = language === "es"
    ? { title: "Proyectos", hint: "Abre una carpeta para explorar", back: "Todos los proyectos", close: "Cerrar", minimize: "Minimizar al Dock", maximize: "Maximizar", restore: "Restaurar tamaño", open: "Abrir proyecto", items: "carpetas", selected: "Carpeta seleccionada" }
    : language === "zh"
      ? { title: "项目", hint: "打开文件夹以探索", back: "所有项目", close: "关闭", minimize: "最小化到程序坞", maximize: "最大化", restore: "恢复大小", open: "打开项目", items: "个文件夹", selected: "已选文件夹" }
      : { title: "Projects", hint: "Open a folder to explore", back: "All projects", close: "Close", minimize: "Minimize to Dock", maximize: "Maximize", restore: "Restore window size", open: "Open project", items: "folders", selected: "Selected folder" };
  const project = projects.find(item => item.id === selected);
  const dismiss = () => {
    cancelGenie.current?.();
    minimized.current = false;
    setExpanded(false);
    onClose();
    requestAnimationFrame(() => (opener.current?.isConnected ? opener.current : document.getElementById("mac-projects-launcher"))?.focus({ preventScroll: true }));
  };
  const minimize = () => {
    if (!windowRef.current) return;
    cancelGenie.current?.();
    minimized.current = true;
    cancelGenie.current = animateGenie(windowRef.current, document.getElementById("mac-projects-launcher"));
    // Commit immediately: the inert visual layer finishes independently, and
    // the Dock can restore Finder even during the minimize animation.
    onClose();
    document.getElementById("mac-projects-launcher")?.focus({ preventScroll: true });
  };
  const folder = (item: typeof projects[number], desktop = false) => <button key={item.id} className={styles.folderButton} style={{ "--folder-color": item.color } as CSSProperties} onClick={event => { opener.current = event.currentTarget; setSelected(item.id); onOpen(); requestAnimationFrame(() => closeRef.current?.focus()); }} aria-label={`${copy.open}: ${item.title}`}>
    <span className={styles.folderArt} aria-hidden="true"><span className={styles.folderBack} /><span className={styles.folderFront} /></span>
    <strong>{item.title}</strong>{!desktop && <small>{item.category}</small>}
  </button>;

  return <div className={`${styles.surface} ${open && expanded ? styles.surfaceFullScreen : ""}`} onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape" && open) { event.preventDefault(); dismiss(); } }} onTouchStart={event => event.stopPropagation()} onTouchEnd={event => event.stopPropagation()}>
    {!open && <div className={styles.desktopFolders} inert={!desktopFoldersInteractive} aria-hidden={!desktopFoldersInteractive} aria-label={copy.title}>{projects.map(item => folder(item, true))}</div>}
    {open && <section ref={windowRef} className={`${styles.window} ${expanded ? styles.expanded : ""}`} role="region" aria-label={`Finder — ${copy.title}`}>
      <header className={styles.toolbar}>
        <div className={styles.traffic}><button ref={closeRef} className={styles.close} onClick={dismiss} aria-label={copy.close}><X size={10} /></button><button className={styles.minimize} onClick={minimize} aria-label={copy.minimize}><Minus size={10} /></button><button className={styles.maximize} onClick={() => setExpanded(value => !value)} aria-label={expanded ? copy.restore : copy.maximize} aria-pressed={expanded}>{expanded ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button></div>
        {project && <div className={styles.navigation}><button className={styles.back} onClick={() => setSelected(null)} aria-label={copy.back}><ArrowLeft size={16} /></button></div>}
        <strong>{project ? `${project.title} — Local` : `${copy.title} — Local`}</strong>
      </header>
      <div className={styles.body}>
        <div className={styles.content} key={selected ?? "all"}>
          {project ? <article className={styles.detail}>
            <div className={styles.cover} style={{ "--folder-color": project.color } as CSSProperties}>{project.image && <Image src={project.image} alt={project.title} fill sizes="(max-width: 600px) 90vw, 600px" />}<span>{project.mark}</span></div>
            <div className={styles.detailText}><small>{project.category}</small><h2>{project.title}</h2><p>{project.description[language]}</p><ul>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><a href={project.href} target="_blank" rel="noopener noreferrer">{copy.open}<ArrowUpRight size={15} /></a></div>
          </article> : <div className={styles.grid}>{projects.map(item => folder(item))}</div>}
        </div>
      </div>
      <footer className={styles.status}><span>{project ? copy.selected : `${projects.length} ${copy.items}`}</span><span>{project ? copy.hint : ""}</span></footer>
    </section>}
  </div>;
}
