"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useLanguage } from "@/components/lang-context";
import { PixelArt, PIXEL_ARROWS, PIXEL_TRAFFIC, pixelLayer } from "@/components/pixel-art";
import { animateGenie } from "@/lib/desktop/genie";
import DesktopIcons, { type DesktopIconItem } from "./desktop-icons";
import styles from "./mac-projects.module.css";

const projects = [
  { id: "inverater", title: "Inverater", category: "Proptech", color: "#9aab78", image: null, mark: "inverater.", tags: ["Infrastructure", "Product engineering"], href: "https://www.inverater.com", description: { en: "Real-estate investing made accessible. My work spans infrastructure, hosting and product engineering, keeping the platform running while shipping its next chapter.", es: "Inversión inmobiliaria accesible. Mi trabajo abarca infraestructura, hosting e ingeniería de producto, manteniendo la plataforma mientras construyo su siguiente etapa.", zh: "让房地产投资更易参与。我的工作涵盖基础设施、托管和产品工程，维护平台运行并持续开发新功能。" } },
  { id: "plebes", title: "Plebes DAO", category: "Community / Web3", color: "#ac9ee2", image: "/plebes_bg.png", mark: "PLEBES", tags: ["ICP", "Motoko", "Figma", "UI/UX"], href: "https://plebes.xyz", description: { en: "Community-driven DAO on Internet Computer. Full design, branding and user experience built from scratch.", es: "DAO impulsada por la comunidad en Internet Computer. Diseño completo, branding y experiencia de usuario desde cero.", zh: "基于 Internet Computer 的社区驱动型 DAO。从零开始完成设计、品牌与用户体验。" } },
  { id: "cafeteria", title: "Artisanal Brew", category: "Coffee / Web3", color: "#d0a17b", image: "/blog/artisanal-brew-assets/layer-0.webp", mark: "ARTISANAL BREW", tags: ["Blazor", ".NET", "Solidity", "PostgreSQL"], href: "https://cafe.alexisrs.dev", description: { en: "A pixel-art coffee experience with multichain integrations across Ethereum, BNB Chain and Solana. Built with Blazor and .NET.", es: "Una experiencia de café con pixel art e integraciones en Ethereum, BNB Chain y Solana. Construida con Blazor y .NET.", zh: "像素艺术咖啡体验，集成 Ethereum、BNB Chain 和 Solana。使用 Blazor 与 .NET 构建。" } },
  { id: "wedding", title: "Andrea & Aldo", category: "Wedding / Interactive", color: "#d5a4b2", image: "/andrea_hero.jpeg", mark: "A & A", tags: ["Next.js", "Google Maps", "Framer Motion"], href: "/weddings/andrea", description: { en: "An interactive wedding invitation with an RSVP flow, schedule and maps. A personal digital keepsake for a shared celebration.", es: "Invitación de boda interactiva con RSVP, itinerario y mapas. Un recuerdo digital personal para una celebración compartida.", zh: "互动婚礼邀请函，包含 RSVP、日程与地图。为共同庆祝留下专属数字纪念。" } },
  { id: "wedding-cindy", title: "Cindy & Jorge", category: "Wedding / Interactive", color: "#c9b7a4", image: "/cindy_hero.jpg", mark: "C & J", tags: ["Next.js", "3D Gallery", "Google Maps", "Framer Motion"], href: "/weddings/cindy", description: { en: "An immersive wedding invitation with animated storytelling, a 3D gallery, itinerary, maps and RSVP experience.", es: "Invitación de boda inmersiva con narrativa animada, galería 3D, itinerario, mapas y experiencia RSVP.", zh: "沉浸式婚礼邀请函，包含动画叙事、3D 相册、日程、地图与 RSVP 体验。" } },
  { id: "nonamedbot", title: "NoNamedBot", category: "AI / Trading agent", color: "#86b8ad", image: null, mark: ">_ NoNamedBot", tags: ["Python", "pandas", "TWAK", "Next.js"], href: "https://github.com/AlejoReyna/no-named-yet-bot", description: { en: "An autonomous BNB Chain trading agent built for BNB Hack. Python scores tokens with regime-aware guardrails; TWAK executes self-custody swaps.", es: "Agente autónomo de trading en BNB Chain para BNB Hack. Python evalúa tokens con controles de riesgo y TWAK ejecuta swaps de autocustodia.", zh: "为 BNB Hack 构建的自主 BNB Chain 交易代理。Python 在风险防护下评估代币，TWAK 执行自托管交换。" } },
];

// Monetta ships as an app, so the desktop shows its App Store icon and Finder an App Store-style page.
// Projects keep their folder detail pages but can use brand icons on desktop/Finder.
const INVERATER_ICON = "/inverater/icon-clean.png";
const PLEBES_ICON = "/plebes-icon-clean.png";
// Transparent 5-frame hero sprite (320x64); object-fit cover crops to the middle robot frame.
const ARTISANAL_ICON = "/blog/artisanal-brew-robot.png";
const ANDREA_ICON = "/weddings/andrea/assets/logos/IMG_0340.PNG";
const CINDY_ICON = "/weddings/cindy/cindy-jorge-monogram.png";
const NONAMEDBOT_ICON = "/bnb_logo.webp";
const AWS_BADGE = {
  href: "https://www.credly.com/badges/a58ebe0a-da77-4ffe-8499-3d46b84b2059",
  icon: "/credly-badge.png",
  label: "AWS Certified AI Practitioner",
  title: "AWS AI",
};
const MONETTA = {
  id: "monetta",
  title: "Monetta",
  category: "E-commerce / Mobile app",
  color: "#b98b4c",
  icon: "/monetta/icon.png",
  href: "https://monetta.mx",
  tags: ["Flutter", "Riverpod", "Shopify", "Firebase"],
  subtitle: { en: "Original bags, wallets & watches", es: "Bolsas, carteras y relojes originales", zh: "正品包袋、钱包与手表" },
  description: { en: "A native iOS and Android shopping app for monetta.mx, a Mexican boutique of original imported bags, wallets and watches. The catalog streams live from Shopify, and an on-device engine learns what each shopper likes and explains its picks.", es: "App nativa de compras para iOS y Android de monetta.mx, boutique mexicana de bolsas, carteras y relojes originales importados. El catálogo llega en vivo desde Shopify y un motor en el dispositivo aprende qué le gusta a cada cliente y explica sus recomendaciones.", zh: "为 monetta.mx 打造的 iOS 与 Android 原生购物应用，这是一家销售进口正品包袋、钱包和手表的墨西哥精品店。商品目录实时来自 Shopify，端侧推荐引擎会学习每位顾客的喜好并解释推荐理由。" },
  info: [
    { label: { en: "Platforms", es: "Plataformas", zh: "平台" }, value: "iOS · Android" },
    { label: { en: "Built with", es: "Hecha con", zh: "技术" }, value: "Flutter" },
    { label: { en: "Backend", es: "Backend", zh: "后端" }, value: "Shopify · Firebase" },
    { label: { en: "Region", es: "Región", zh: "地区" }, value: { en: "Mexico", es: "México", zh: "墨西哥" } },
  ],
  screenshots: [
    { src: "/monetta/home.jpg", label: { en: "Monetta home screen", es: "Pantalla de inicio de Monetta", zh: "Monetta 首页" } },
    { src: "/monetta/product.jpg", label: { en: "Monetta product page", es: "Página de producto de Monetta", zh: "Monetta 商品页面" } },
    { src: "/monetta/bag.jpg", label: { en: "Monetta shopping bag", es: "Bolsa de compras de Monetta", zh: "Monetta 购物袋" } },
  ],
};

const FOLDER = [pixelLayer([
  ".oooooo...........",
  "ollllllo..........",
  "obbbbbbbooooooooo.",
  "obbbbbbbbbbbbbbbbo",
  "obbbbbbbbbbbbbbbbo",
  "oooooooooooooooooo",
  "ohhhhhhhhhhhhhhhho",
  "offffffffffffffffo",
  "offffffffffffffffo",
  "offffffffffffffffo",
  "ommmmmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmmmo",
  "osssssssssssssssso",
  ".oooooooooooooooo.",
], { o: "#0d2b45", l: "#8ad2f5", b: "#4aa3d8", h: "#c8efff", f: "#7ad0f6", m: "#65c2ef", s: "#3f9dd3" })];
// Hand-pixelled from the App Store icon: gold serif M and droplet on white.
const MONETTA_ICON = [pixelLayer([
  "....oooooooooooooooooooo....",
  "..oowwwwwwwwwwwwwwwwwwwwoo..",
  ".owwwwwwwwwwwwwwwwwwwwwwwwo.",
  ".owwwwwwwwwwwwwwwwwwwwwwwwo.",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwmdddwwwwwwwwdddmwwwwwo",
  "owwwwwwwddwwwwwwwwddmwwwwwwo",
  "owwwwwwwddwwwwwwwmddwwwwwwwo",
  "owwwwwwwwddwwwwwwmddwwwwwwwo",
  "owwwwwwwwdmwwwwwwmddwwwwwwwo",
  "owwwwwwwwwdmwwwwmwddwwwwwwwo",
  "owwwwwwwwwdmwwwwmwddwwwwwwwo",
  "owwwwwwwwwwdmwwmwwddwwwwwwwo",
  "owwwwwdwwwwdmwwmwwddwwwwwwwo",
  "owwwwmdwwwwddwwmwwddwwwwwwwo",
  "owwwwdldwwwwddmwwwddwwwwwwwo",
  "owwwwdddwwwwddmwwwddmwwwwwwo",
  "owwwwwdmwwwwwdwwwmdddmwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  "owwwwwwwwwwwwwwwwwwwwwwwwwwo",
  ".owwwwwwwwwwwwwwwwwwwwwwwwo.",
  ".owwwwwwwwwwwwwwwwwwwwwwwwo.",
  "..oowwwwwwwwwwwwwwwwwwwwoo..",
  "....oooooooooooooooooooo....",
], { o: "#2a1f12", w: "#ffffff", l: "#d8b47c", m: "#b88a4c", d: "#9a692e" })];

const ART_PIXEL = 4;
const GRADIENT_BANDS = 6;
// Share of each band spent dithering into the next one; the rest stays flat.
const BAND_DITHER = 0.4;
// Photos are posterized without dithering: per-channel dither turns flat dark areas into colour speckle.
const PHOTO_LEVELS = 16;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const threshold = (x: number, y: number) => (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;

// Renders one art pixel per 4px (dithered gradient bands, posterized photo); the
// element scales the PNG back up with nearest-neighbour sampling so blocks stay crisp.
function renderPixelArt(columns: number, rows: number, color: string | null, photo: HTMLImageElement | null) {
  if (!color && !photo) return null;
  const canvas = document.createElement("canvas");
  canvas.width = columns;
  canvas.height = rows;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  if (color) {
    const from = [23, 37, 37];
    const to = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
    // Same direction as the previous 130deg CSS gradient.
    const dx = Math.sin(130 * Math.PI / 180);
    const dy = -Math.cos(130 * Math.PI / 180);
    const length = columns * Math.abs(dx) + rows * Math.abs(dy);
    const gradient = context.createImageData(columns, rows);
    for (let index = 0; index < gradient.data.length; index += 4) {
      const x = index / 4 % columns;
      const y = Math.floor(index / 4 / columns);
      const along = Math.min(1, Math.max(0, ((x + 0.5 - columns / 2) * dx + (y + 0.5 - rows / 2) * dy) / length + 0.5)) * (GRADIENT_BANDS - 1);
      const edge = Math.min(1, Math.max(0, (along % 1 - 0.5) / BAND_DITHER + 0.5));
      const band = Math.min(GRADIENT_BANDS - 1, Math.floor(along) + (edge > threshold(x, y) ? 1 : 0)) / (GRADIENT_BANDS - 1);
      for (let channel = 0; channel < 3; channel += 1) gradient.data[index + channel] = from[channel] + (to[channel] - from[channel]) * band;
      gradient.data[index + 3] = 255;
    }
    context.putImageData(gradient, 0, 0);
  }
  if (photo) {
    // object-fit: cover, centred.
    const scale = Math.max(columns / photo.naturalWidth, rows / photo.naturalHeight);
    const width = photo.naturalWidth * scale;
    const height = photo.naturalHeight * scale;
    context.imageSmoothingQuality = "high";
    context.drawImage(photo, (columns - width) / 2, (rows - height) / 2, width, height);
    const pixels = context.getImageData(0, 0, columns, rows);
    const step = 255 / (PHOTO_LEVELS - 1);
    for (let index = 0; index < pixels.data.length; index += 1) {
      if (index % 4 !== 3) pixels.data[index] = Math.round(pixels.data[index] / step) * step;
    }
    context.putImageData(pixels, 0, 0);
  }
  return canvas.toDataURL();
}

// Keeps the element's --pixel-art background in sync with its size and image.
function usePixelArt(ref: RefObject<HTMLElement | null>, image: string | null, color: string | null = null) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const picture = image ? new window.Image() : null;
    let painted = "";
    const paint = () => {
      const columns = Math.ceil(element.clientWidth / ART_PIXEL);
      const rows = Math.ceil(element.clientHeight / ART_PIXEL);
      const photo = picture?.complete && picture.naturalWidth ? picture : null;
      const signature = `${columns}x${rows}${photo ? "+photo" : ""}`;
      if (!columns || !rows || signature === painted) return;
      painted = signature;
      let art: string | null;
      // A tainted canvas cannot be exported; fall back to the dithered gradient.
      try { art = renderPixelArt(columns, rows, color, photo); } catch { art = renderPixelArt(columns, rows, color, null); }
      if (!art) return;
      // Inline properties also travel with the Genie animation's cloned window.
      element.style.setProperty("--pixel-art", `url("${art}")`);
      element.style.setProperty("--pixel-art-size", `${columns * ART_PIXEL}px ${rows * ART_PIXEL}px`);
    };
    // Resize callbacks run after layout but before paint, so maximizing never shows stale art.
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    if (picture && image) {
      picture.onload = paint;
      picture.src = getImageProps({ src: image, alt: "", width: 320, height: 180 }).props.src;
    }
    paint();
    return () => {
      observer.disconnect();
      if (picture) picture.onload = null;
    };
  }, [ref, image, color]);
}

function PixelCover({ project }: { project: typeof projects[number] }) {
  const coverRef = useRef<HTMLDivElement>(null);
  usePixelArt(coverRef, project.image, project.color);
  return <div ref={coverRef} className={styles.cover}><span>{project.mark}</span></div>;
}

function PixelShot({ src, label }: { src: string; label: string }) {
  const shotRef = useRef<HTMLDivElement>(null);
  usePixelArt(shotRef, src);
  return <div ref={shotRef} className={styles.shot} role="img" aria-label={label} />;
}

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
    ? { title: "Proyectos", hint: "Abre una carpeta para explorar", back: "Todos los proyectos", close: "Cerrar", minimize: "Minimizar al Dock", maximize: "Maximizar", restore: "Restaurar tamaño", open: "Abrir proyecto", items: "elementos", selected: "Carpeta seleccionada", applications: "Aplicaciones", application: "Aplicación", preview: "Vista previa", visit: "Visitar tienda" }
    : language === "zh"
      ? { title: "项目", hint: "打开文件夹以探索", back: "所有项目", close: "关闭", minimize: "最小化到程序坞", maximize: "最大化", restore: "恢复大小", open: "打开项目", items: "个项目", selected: "已选文件夹", applications: "应用程序", application: "应用程序", preview: "预览", visit: "访问商店" }
      : { title: "Projects", hint: "Open a folder to explore", back: "All projects", close: "Close", minimize: "Minimize to Dock", maximize: "Maximize", restore: "Restore window size", open: "Open project", items: "items", selected: "Selected folder", applications: "Applications", application: "Application", preview: "Preview", visit: "Visit store" };
  const project = projects.find(item => item.id === selected);
  const app = selected === MONETTA.id ? MONETTA : null;
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
  const isolate = (event: { stopPropagation: () => void }) => event.stopPropagation();
  const openItem = (id: string, button: HTMLButtonElement) => {
    opener.current = button;
    setSelected(id);
    onOpen();
    requestAnimationFrame(() => closeRef.current?.focus());
  };
  const launcher = (id: string, title: string, art: ReactNode) => <button key={id} className={styles.folderButton} onClick={event => openItem(id, event.currentTarget)} aria-label={`${copy.open}: ${title}`}>
    {art}<strong>{title}</strong>
  </button>;

  // Desktop icons keep their own layer so opening Finder never unmounts them.
  // Project-specific artwork replaces the generic folder on both desktop and Finder.
  const brandIcon = (id: string) =>
    id === "inverater" ? INVERATER_ICON
      : id === "plebes" ? PLEBES_ICON
        : id === "cafeteria" ? ARTISANAL_ICON
          : id === "wedding" ? ANDREA_ICON
            : id === "wedding-cindy" ? CINDY_ICON
              : id === "nonamedbot" ? NONAMEDBOT_ICON
                : null;
  const brandArt = (id: string, icon: string) =>
    <span className={`${styles.appArt} ${styles.transparentArt} ${id === "plebes" ? styles.pixelArtAsset : id === "cafeteria" ? styles.artisanalArt : id === "nonamedbot" ? styles.bscArt : id === "wedding-cindy" ? styles.cindyArt : ""}`} aria-hidden="true">
      <Image src={icon} alt="" width={96} height={96} />
    </span>;
  const desktopArt = (id: string) => {
    const icon = brandIcon(id);
    return icon
      ? brandArt(id, icon)
      : <span className={styles.folderArt} aria-hidden="true"><span className={styles.folderBack} /><span className={styles.folderFront} /></span>;
  };
  const finderArt = (id: string) => {
    const icon = brandIcon(id);
    return icon
      ? brandArt(id, icon)
      : <PixelArt layers={FOLDER} scale={4} className={styles.pixelIcon} />;
  };
  // Order here is the default desktop arrangement; kinds drive Clean Up By / Sort By Kind.
  const desktopIcons: DesktopIconItem[] = [
    ...projects.map(item => ({ id: item.id, title: item.title, kind: "folder" as const, ariaLabel: `${copy.open}: ${item.title}`, art: desktopArt(item.id), onOpen: (button: HTMLButtonElement) => openItem(item.id, button) })),
    { id: MONETTA.id, title: MONETTA.title, kind: "application", ariaLabel: `${copy.open}: ${MONETTA.title}`, art: <span className={styles.appArt} aria-hidden="true"><Image src={MONETTA.icon} alt="" width={96} height={96} /></span>, onOpen: button => openItem(MONETTA.id, button) },
    { id: "aws-ai", title: AWS_BADGE.title, kind: "web", ariaLabel: AWS_BADGE.label, href: AWS_BADGE.href, art: <span className={`${styles.appArt} ${styles.badgeArt}`} aria-hidden="true"><Image src={AWS_BADGE.icon} alt="" width={96} height={96} /></span> },
  ];
  return <>
    <div className={styles.desktopSurface} onKeyDown={isolate} onTouchStart={isolate} onTouchEnd={isolate}>
      <DesktopIcons items={desktopIcons} interactive={desktopFoldersInteractive} label={copy.title} className={styles.desktopFolders} iconClassName={styles.folderButton} ghostClassName={styles.dragGhost} />
    </div>
    {open && <div className={`${styles.surface} ${expanded ? styles.surfaceFullScreen : ""}`} onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); dismiss(); } }} onTouchStart={isolate} onTouchEnd={isolate}>
      <section ref={windowRef} className={`${styles.window} ${expanded ? styles.expanded : ""}`} role="region" aria-label={`Finder — ${copy.title}`}>
        <header className={styles.toolbar}>
          <div className={styles.traffic}><button ref={closeRef} onClick={dismiss} aria-label={copy.close}><PixelArt layers={PIXEL_TRAFFIC.close} scale={2} /></button><button onClick={minimize} aria-label={copy.minimize}><PixelArt layers={PIXEL_TRAFFIC.minimize} scale={2} /></button><button onClick={() => setExpanded(value => !value)} aria-label={expanded ? copy.restore : copy.maximize} aria-pressed={expanded}><PixelArt layers={expanded ? PIXEL_TRAFFIC.restore : PIXEL_TRAFFIC.maximize} scale={2} /></button></div>
          {(project || app) && <div className={styles.navigation}><button onClick={() => setSelected(null)} aria-label={copy.back}><PixelArt layers={PIXEL_ARROWS.back} scale={2} /></button></div>}
          <strong>{project ? `${project.title} — Local` : app ? `${app.title} — ${copy.applications}` : `${copy.title} — Local`}</strong>
        </header>
        <div className={styles.body}>
          <div className={styles.content} key={selected ?? "all"}>
            {project ? <article className={styles.detail} style={{ "--folder-color": project.color } as CSSProperties}>
              <PixelCover project={project} />
              <div className={styles.detailText}><small>{project.category}</small><h2>{project.title}</h2><p>{project.description[language]}</p><ul>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><a href={project.href} target="_blank" rel="noopener noreferrer">{copy.open}<PixelArt layers={PIXEL_ARROWS.open} scale={2} /></a></div>
            </article> : app ? <article className={styles.detail} style={{ "--folder-color": app.color } as CSSProperties}>
              <header className={styles.appHeader}>
                <PixelArt layers={MONETTA_ICON} scale={4} className={styles.appIcon} />
                <div className={styles.detailText}><small>{app.category}</small><h2>{app.title}</h2><p>{app.subtitle[language]}</p><a href={app.href} target="_blank" rel="noopener noreferrer">{copy.visit}<PixelArt layers={PIXEL_ARROWS.open} scale={2} /></a></div>
              </header>
              <dl className={styles.appInfo}>{app.info.map(item => <div key={item.label.en}><dt>{item.label[language]}</dt><dd>{typeof item.value === "string" ? item.value : item.value[language]}</dd></div>)}</dl>
              <section className={styles.appPreview}><h3>{copy.preview}</h3><div className={styles.shots}>{app.screenshots.map(shot => <PixelShot key={shot.src} src={shot.src} label={shot.label[language]} />)}</div></section>
              <div className={styles.detailText}><p>{app.description[language]}</p><ul>{app.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></div>
            </article> : <div className={styles.grid}>
              {projects.map(item => launcher(item.id, item.title, finderArt(item.id)))}
              {launcher(MONETTA.id, MONETTA.title, <PixelArt layers={MONETTA_ICON} scale={2} className={styles.pixelIcon} />)}
            </div>}
          </div>
        </div>
        <footer className={styles.status}><span>{project ? copy.selected : app ? copy.application : `${projects.length + 1} ${copy.items}`}</span><span>{project || app ? copy.hint : ""}</span></footer>
      </section>
    </div>}
  </>;
}
