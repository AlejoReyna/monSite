"use client";

import { useCopy } from "@/components/use-copy";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, ChevronLeft, Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { animateGenie } from "@/lib/desktop/genie";
import { useWindowFrame } from "@/lib/desktop/use-window-frame";
import DesktopIcons, { type DesktopIconItem } from "./desktop-icons";
import WindowResizeHandles from "./window-resize-handles";
import styles from "./mac-projects.module.css";

const projects = [
  { id: "inverater", title: "Inverater", color: "#9aab78", image: "/inverater/icon.png", video: "/project-previews/inverater.mp4", containImage: true, tags: ["Stripe", "STP / SPEI", "Ruby on Rails", "Go", "SQL Server", "AWS", "Docker", "NGINX"], href: "https://www.inverater.com", description: { en: "A proptech platform affiliated with Corporación Quimbo that lets anyone take part in real-estate crowdfunding from $1,000 MXN; investors get their capital back plus returns once the project is built. The business model is backed by a trust (fideicomiso), and the company runs banking infrastructure that gives users their own CLABE accounts for deposits and withdrawals.", es: "Proyecto proptech afiliado a Corporación Quimbo que ofrece la oportunidad de ser partícipe de un crowdfunding inmobiliario: se puede invertir desde $1,000 MXN y el cliente recibe su inversión más rendimientos cuando el proyecto ya se ha construido. El modelo de negocio está respaldado por un fideicomiso y la empresa cuenta con infraestructura bancaria para proporcionar cuentas CLABE a sus usuarios y permitirles hacer depósitos o retiros." }, role: { en: "Full-Stack Software Engineer / DevOps · Oct 2024 – Sep 2026", es: "Full-Stack Software Engineer / DevOps · Oct 2024 – Sep 2026" }, highlights: { en: ["Took over the MVP delivered by an outside agency and, with two fellow developers, built the production system the company runs on today — starting on the front end, moving to the back end, and finally owning both the code and DevOps.", "Built manual sales end to end: referral checkout links payable by Stripe or bank transfer to an STP CLABE, recorded in the database automatically.", "Migrated checkout to STP/SPEI and built the platform's payment and deposit experiences.", "Created a white-label theming system so partner brands can run the platform under their own colours and assets.", "Helped move the backend from Ruby on Rails to Go microservices and helped build Inverpay, connecting Inverater's users to its database.", "Wrote the SQL Server stored procedures behind Inverpay, cutting response times by more than 50%.", "Integrated Truora's KYC API (national ID, face photo, proof of address) for regulatory compliance.", "Planned and ran the AWS infrastructure (EC2, RDS, S3, ElastiCache, CodeDeploy) with NGINX over TLS, Docker and CI/CD, plus DNS and SSL certificates auto-renewed with Let’s Encrypt.", "Moved the whole infrastructure from AWS to an Atlantic.net VPS, cutting hosting costs by 57.5%."], es: ["Tomé el MVP entregado por un equipo externo y, con dos compañeros, construí el sistema de producción con el que opera la empresa hoy: empecé en front-end, pasé a back-end y terminé a cargo del código y de DevOps.", "Construí la venta manual: links de compra para referidos, pagables con Stripe o por transferencia a una CLABE de STP, que se registran solos en la base de datos.", "Migré el checkout a STP/SPEI y desarrollé las experiencias de pago y depósito de la plataforma.", "Creé un sistema de marca blanca para que socios operen la plataforma con sus propios colores y assets.", "Participé en la migración del backend de Ruby on Rails a microservicios en Go y ayudé a construir Inverpay, conectando los usuarios de Inverater con su base de datos.", "Escribí los procedimientos almacenados de SQL Server para Inverpay, reduciendo los tiempos de respuesta en más de 50%.", "Integré la API KYC de Truora (INE, fotografía facial y comprobante de domicilio) para cumplir con la normativa.", "Diseñé y operé la infraestructura en AWS (EC2, RDS, S3, ElastiCache, CodeDeploy) con NGINX sobre TLS, Docker y CI/CD, además de DNS y certificados SSL renovados automáticamente con Let’s Encrypt.", "Migré toda la infraestructura de AWS a un VPS en Atlantic.net, reduciendo el costo de hosting 57.5%."] } },
  { id: "plebes", title: "Plebes DAO", color: "#ac9ee2", image: "/plebes_bg.png", video: "/plebes_video.mp4", containImage: false, tags: ["ICP", "ckBTC", "Swapzone", "Motoko", "Figma", "UI/UX"], href: "https://plebes.xyz", description: { en: "An NFT DAO on the Internet Computer (ICP) blockchain, driven by its community. I worked on the front end: the landing page, the deposit flow and the payments integration that opened the platform to far more users.", es: "DAO de NFT en la blockchain Internet Computer (ICP), impulsada por su comunidad. Trabajé en el front-end: la página de inicio, el flujo de depósito y la integración de pagos que abrió la plataforma a muchos más usuarios." }, role: { en: "Frontend Developer · Dec 2024 – Jun 2025", es: "Frontend Developer · Dic 2024 – Jun 2025" }, highlights: { en: ["Redesigned the plebes.xyz landing page, replacing a cluttered site with a minimal single-page design and a public view of the total crypto assets raised.", "Redesigned the /deposit UI as a guided four-step flow that walks users through depositing.", "Integrated the Swapzone API to accept crypto from 30+ blockchains and convert it to ckBTC on ICP; funds can be withdrawn and converted back to tokens on other chains.", "That integration lowered the minimum deposit from $80 to $5, which is what made the platform work for far more users.", "The project received a $5,000 developer grant from the DFINITY Foundation, which maintains the Internet Computer blockchain."], es: ["Rediseñé la página de inicio de plebes.xyz: sustituí un sitio recargado por un diseño minimalista de una sola página y publiqué una vista pública del total de criptoactivos recaudados.", "Rediseñé la UI de la ruta /deposit como un proceso guiado de cuatro pasos que acompaña al usuario mientras deposita.", "Integré la API de Swapzone para recibir criptomonedas de más de 30 blockchains y convertirlas a ckBTC dentro de ICP; los fondos se pueden retirar y reconvertir a tokens de otras chains.", "Con esa integración el depósito mínimo bajó de $80 a $5 dólares, lo que hizo funcionar la plataforma para muchos más usuarios.", "El proyecto recibió una beca para desarrolladores de $5,000 dólares de la Fundación DFINITY, responsable de la blockchain Internet Computer."] } },
  { id: "cafeteria", title: "Artisanal Brew", color: "#d0a17b", image: "/blog/artisanal-brew-assets/layer-0.webp", video: "/project-previews/artisanal-brew.mp4", containImage: false, tags: ["C#", ".NET", "Blazor", "PostgreSQL", "Solidity", "OpenZeppelin", "Azure"], href: "https://cafe.alexisrs.dev", description: { en: "A production online store with Ethereum payments. Checkout uses testnet tokens, so buying is free: connect a wallet, pay on-chain, and the order goes through once the payment is verified.", es: "Tienda en línea en producción con pagos en Ethereum. El checkout usa tokens de testnet, así que comprar es gratis: conectas tu billetera, pagas en la cadena y el pedido se procesa en cuanto se verifica el pago." }, role: { en: "Full-Stack Developer · Apr 2026 – Present", es: "Full-Stack Developer · Abr 2026 – Presente" }, highlights: { en: ["Designed and launched the production store in C# and .NET / ASP.NET Core, with interactive server-side rendering through Blazor.", "Designed and integrated RESTful APIs with ASP.NET Core controllers, modelled the relational data with Entity Framework Core on PostgreSQL, and built authentication with ASP.NET Core Identity.", "Built the whole payment flow: the Blazor front end starts settlement from the connected wallet and the .NET back end verifies the transaction on-chain before processing the order.", "Wrote the Solidity smart contracts on the Sepolia testnet on top of OpenZeppelin's audited libraries: two ERC-20 tokens (CAFE and COFFEE) and an ERC-4626 liquid-staking vault that issues a transferable position (stCAFE) and distributes rewards with per-user checkpoints.", "Deployed it first on Microsoft Azure (Container Apps, Azure Database for PostgreSQL, Blob Storage, Service Bus, Key Vault), then migrated it to a Linux VPS on Atlantic.net."], es: ["Diseñé y lancé la tienda en producción con C# y .NET / ASP.NET Core, con renderizado interactivo en servidor mediante Blazor.", "Diseñé e integré APIs RESTful con controladores de ASP.NET Core, modelé los datos relacionales con Entity Framework Core sobre PostgreSQL e implementé la autenticación con ASP.NET Core Identity.", "Implementé el flujo de pago completo: Blazor inicia la liquidación con la billetera conectada y el back-end de .NET verifica la transacción en la cadena antes de procesar el pedido.", "Desarrollé los contratos inteligentes en Solidity sobre la red de pruebas Sepolia con las bibliotecas auditadas de OpenZeppelin: dos tokens ERC-20 (CAFE y COFFEE) y un vault de liquid staking ERC-4626 que emite una posición transferible (stCAFE) y reparte recompensas con checkpoints por usuario.", "La desplegué primero en Microsoft Azure (Container Apps, Azure Database for PostgreSQL, Blob Storage, Service Bus y Key Vault) y después la migré a un VPS Linux en Atlantic.net."] } },
  { id: "wedding", title: "Andrea & Aldo", color: "#d5a4b2", image: "/andrea_hero.jpeg", video: "/wedding_preview.mp4", containImage: false, tags: ["Next.js", "React", "Google Maps", "WhatsApp"], href: "/weddings/andrea", description: { en: "An interactive wedding invitation for a celebration in Montemorelos, Nuevo León: everything a guest needs, from the countdown and schedule to directions, dress code, gifts and RSVP, in one page built for the phone.", es: "Invitación de boda interactiva para una celebración en Montemorelos, Nuevo León: todo lo que un invitado necesita, de la cuenta regresiva y el itinerario a la ubicación, el código de vestimenta, los regalos y la confirmación, en una sola página pensada para el celular." }, weddingDate: { en: "October 18, 2025", es: "18 de octubre de 2025" }, role: { en: "Designer & Front-end Developer", es: "Diseñador y desarrollador front-end" }, highlights: { en: ["Designed and built the whole invitation in Next.js and React, phone-first.", "A countdown to the big day, a photo carousel and a section for the couple's parents.", "Ceremony and reception schedule, with buttons that open Google Maps directions to each venue.", "Dress code and gift registry, with bank-transfer details and a link to the Amazon registry.", "RSVP over WhatsApp and a button to add the event to the guest's calendar.", "Automatic night mode that follows the system, and the phone's status bar changes colour with each section."], es: ["Diseñé y desarrollé la invitación completa en Next.js y React, pensada primero para el celular.", "Una cuenta regresiva al gran día, una galería en carrusel y la sección de los padres de los novios.", "Itinerario de la ceremonia y la recepción, con botones que abren la ruta en Google Maps para cada lugar.", "Código de vestimenta y mesa de regalos, con datos para transferencia y un enlace a la mesa de Amazon.", "Confirmación de asistencia por WhatsApp y un botón para agregar el evento al calendario.", "Modo nocturno automático según el sistema, y la barra de estado del celular cambia de color con cada sección."] } },
  { id: "wedding-cindy", title: "Cindy & Jorge", color: "#c9b7a4", image: "/cindy_hero.jpg", video: "/project-previews/cindy-jorge.mp4", containImage: false, tags: ["Next.js", "React", "CSS 3D", "Web3Forms", "Google Maps"], href: "/weddings/cindy", description: { en: "An immersive wedding invitation that opens like a sealed envelope, with the couple's song playing, a 3D photo gallery and everything guests need: schedule, directions, dress code, hotels, gifts and RSVP.", es: "Invitación de boda inmersiva que se abre como un sobre sellado, con la canción de los novios de fondo, una galería 3D y todo lo que los invitados necesitan: itinerario, ubicación, código de vestimenta, hoteles, regalos y confirmación." }, weddingDate: { en: "August 22, 2026", es: "22 de agosto de 2026" }, role: { en: "Designer & Front-end Developer", es: "Diseñador y desarrollador front-end" }, highlights: { en: ["Designed and built the whole invitation in Next.js and React, phone-first.", "An entrance screen with an envelope and a monogrammed wax seal: opening it starts the couple's song, with a player to pause it.", "A 3D perspective gallery built in CSS, browsed with arrows or by swiping.", "Schedule, Google Maps locations for the ceremony and reception, dress code and recommended hotels near the venue.", "Gift details inside an envelope, and an RSVP form that sends responses through Web3Forms.", "The phone's status bar changes colour with each section, and the envelope doesn't reappear on reload."], es: ["Diseñé y desarrollé la invitación completa en Next.js y React, pensada primero para el celular.", "Una pantalla de entrada con un sobre y un sello de lacre con el monograma: al abrirlo empieza la canción de los novios, con un reproductor para pausarla.", "Una galería 3D en perspectiva hecha con CSS, que se recorre con flechas o deslizando el dedo.", "Itinerario, ubicación de la ceremonia y la recepción en Google Maps, código de vestimenta y hoteles recomendados cerca del evento.", "Datos para regalos en un sobre, y un formulario de confirmación de asistencia que envía las respuestas con Web3Forms.", "La barra de estado del celular cambia de color con cada sección, y el sobre no vuelve a aparecer al recargar la página."] } },
  { id: "nonamedbot", title: "NoNamedBot", category: "AI / Trading agent", color: "#86b8ad", image: "/bnb_logo.webp", video: "/project-previews/nonamedbot.mp4", containImage: true, tags: ["Python", "pandas", "TWAK", "Next.js"], href: "https://github.com/AlejoReyna/no-named-yet-bot", description: { en: "An autonomous BNB Chain trading agent built for BNB Hack. Python scores tokens with regime-aware guardrails; TWAK executes self-custody swaps.", es: "Agente autónomo de trading en BNB Chain para BNB Hack. Python evalúa tokens con controles de riesgo y TWAK ejecuta swaps de autocustodia." } },
];

// Monetta ships as an app, so the desktop shows its App Store icon and Finder an App Store-style page.
// Projects keep their folder detail pages but can use brand icons on desktop/Finder.
const INVERATER_ICON = "/inverater/icon-clean.png";
const PLEBES_ICON = "/plebes-icon-clean.png";
// High-res crop of the concept art (not the 64px animation sprite), so the desktop
// icon stays crisp instead of blowing up a tiny pixel-art frame.
const ARTISANAL_ICON = "/blog/artisanal-brew-robot-icon.png";
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
  color: "#b98b4c",
  icon: "/monetta/icon.png",
  video: "/project-previews/monetta.mp4",
  poster: "/monetta/home.jpg",
  href: "https://monetta.mx",
  tags: ["Flutter", "Dart", "Riverpod", "Shopify", "Firebase"],
  subtitle: { en: "Original bags, wallets & watches", es: "Bolsas, carteras y relojes originales" },
  status: { en: "In development", es: "En desarrollo" },
  description: { en: "A native iOS and Android shopping app for monetta.mx, a Mexican boutique of original imported bags, wallets and watches — currently in development and not yet in the App Store or Google Play. The catalog streams live from Shopify, and an on-device engine learns what each shopper likes and explains its picks.", es: "App nativa de compras para iOS y Android de monetta.mx, boutique mexicana de bolsas, carteras y relojes originales importados. Está en desarrollo y todavía no se publica en App Store ni Google Play. El catálogo llega en vivo desde Shopify y un motor en el dispositivo aprende qué le gusta a cada cliente y explica sus recomendaciones." },
  role: { en: "Flutter Developer · In development", es: "Flutter Developer · En desarrollo" },
  highlights: { en: ["I'm building Monetta's cross-platform mobile client for iOS and Android with Flutter and Dart, showing the same products as the web store.", "I'm designing a mobile interface that follows the design patterns of brands in the same line of business.", "Checkout uses Shopify's Shop platform as the payment gateway, supporting Stripe, Apple Pay / Google Pay, PayPal, cards, Kueski Pay and Mercado Pago."], es: ["Estoy desarrollando para Monetta un cliente móvil multiplataforma para iOS y Android con Flutter y Dart, que muestra los mismos productos disponibles en la tienda web.", "Construyo una interfaz móvil que sigue los patrones de diseño de marcas del mismo giro que la empresa.", "El pago usa la plataforma Shop de Shopify como pasarela, con Stripe, Apple Pay / Google Pay, PayPal, tarjeta, Kueski Pay y Mercado Pago."] },
  info: [
    { label: { en: "Platforms", es: "Plataformas" }, value: "iOS · Android" },
    { label: { en: "Built with", es: "Hecha con" }, value: "Flutter" },
    { label: { en: "Backend", es: "Backend" }, value: "Shopify · Firebase" },
    { label: { en: "Region", es: "Región" }, value: { en: "Mexico", es: "México" } },
  ],
};

// The preview video plays on a plain dark panel; a project without one shows its image instead.
function Cover({ project, label }: { project: typeof projects[number]; label: string }) {
  return <div className={styles.cover}>
    {project.video ? <video className={styles.coverVideo} autoPlay muted loop playsInline preload="metadata" poster={project.image ?? undefined} aria-label={`${project.title} — ${label}`}>
      <source src={project.video} type="video/mp4" />
    </video> : <Image className={project.containImage ? styles.coverContain : undefined} src={project.image} alt={`${project.title} — ${label}`} fill sizes="(max-width: 610px) 90vw, 360px" />}
  </div>;
}

export default function MacProjects({
  open,
  onOpen,
  onClose,
  selectedProjectId = null,
  projectRequest = 0,
  desktopFoldersInteractive = true,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  selectedProjectId?: string | null;
  projectRequest?: number;
  desktopFoldersInteractive?: boolean;
}) {
  const copyText = useCopy();
  const { language } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  // Sync Spotlight / Orbit project selection when Finder opens or the id changes.
  useEffect(() => {
    if (!selectedProjectId) return;
    const timer = window.setTimeout(() => setSelected(selectedProjectId), 0);
    return () => window.clearTimeout(timer);
  }, [selectedProjectId, projectRequest, open]);
  const windowRef = useRef<HTMLElement>(null);
  // Small enough to tuck beside the terminal, large enough for the 3-column grid and a stacked detail page.
  const { style: frameStyle, resizable, handleProps, titleBarProps } = useWindowFrame(windowRef, { minWidth: 440, minHeight: 300 });
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
    ? { title: copyText("Proyectos"), back: "Todos los proyectos", close: "Cerrar", minimize: "Minimizar al Dock", maximize: "Maximizar", restore: "Restaurar tamaño", open: "Abrir proyecto", applications: "Aplicaciones", preview: "Vista previa", visit: "Visitar tienda web", work: "Lo que hice", role: "Rol:", weddingDate: "Fecha de la boda:" }
    : { title: copyText("Projects"), back: "All projects", close: "Close", minimize: "Minimize to Dock", maximize: "Maximize", restore: "Restore window size", open: "Open project", applications: "Applications", preview: "Preview", visit: "Visit web store", work: "What I did", role: "Role:", weddingDate: "Wedding date:" };
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
    <span className={`${styles.appArt} ${styles.transparentArt} ${id === "plebes" ? styles.pixelArtAsset : id === "nonamedbot" ? styles.bscArt : id === "wedding-cindy" ? styles.cindyArt : ""}`} aria-hidden="true">
      <Image src={icon} alt="" width={96} height={96} />
    </span>;
  const projectArt = (id: string) => {
    const icon = brandIcon(id);
    return icon
      ? brandArt(id, icon)
      : <span className={styles.folderArt} aria-hidden="true"><span className={styles.folderBack} /><span className={styles.folderFront} /></span>;
  };
  const monettaArt = <span className={styles.appArt} aria-hidden="true"><Image src={MONETTA.icon} alt="" width={96} height={96} /></span>;
  // Order here is the default desktop arrangement; kinds drive Clean Up By / Sort By Kind.
  const desktopIcons: DesktopIconItem[] = [
    ...projects.map(item => ({ id: item.id, title: item.title, kind: "folder" as const, ariaLabel: `${copy.open}: ${item.title}`, art: projectArt(item.id), onOpen: (button: HTMLButtonElement) => openItem(item.id, button) })),
    { id: MONETTA.id, title: MONETTA.title, kind: "application", ariaLabel: `${copy.open}: ${MONETTA.title}`, art: monettaArt, onOpen: button => openItem(MONETTA.id, button) },
    { id: "aws-ai", title: AWS_BADGE.title, kind: "web", ariaLabel: AWS_BADGE.label, href: AWS_BADGE.href, art: <span className={`${styles.appArt} ${styles.badgeArt}`} aria-hidden="true"><Image src={AWS_BADGE.icon} alt="" width={96} height={96} /></span> },
  ];
  return <>
    <div className={styles.desktopSurface} onKeyDown={isolate} onTouchStart={isolate} onTouchEnd={isolate}>
      <DesktopIcons items={desktopIcons} interactive={desktopFoldersInteractive} label={copy.title} className={styles.desktopFolders} iconClassName={styles.folderButton} ghostClassName={styles.dragGhost} />
    </div>
    {open && <div className={`${styles.surface} ${expanded ? styles.surfaceFullScreen : ""}`} onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); dismiss(); } }} onTouchStart={isolate} onTouchEnd={isolate}>
      <section ref={windowRef} className={`${styles.window} ${expanded ? styles.expanded : ""}`} style={expanded ? undefined : frameStyle} role="region" aria-label={`Finder — ${copy.title}`}>
        {/* The title bar moves the window; double-clicking it zooms, as in macOS's default setting. */}
        <header className={styles.toolbar} {...(expanded ? {} : titleBarProps)} onDoubleClick={event => { if (!(event.target as Element).closest("button, a")) setExpanded(value => !value); }}>
          <div className={styles.traffic}><button ref={closeRef} className={styles.close} onClick={dismiss} aria-label={copy.close}><X size={10} /></button><button className={styles.minimize} onClick={minimize} aria-label={copy.minimize}><Minus size={10} /></button><button className={styles.zoom} onClick={() => setExpanded(value => !value)} aria-label={expanded ? copy.restore : copy.maximize} aria-pressed={expanded}>{expanded ? <Minimize2 size={9} /> : <Maximize2 size={9} />}</button></div>
          {(project || app) && <div className={styles.navigation}><button onClick={() => setSelected(null)} aria-label={copy.back}><ChevronLeft size={20} /></button></div>}
          <strong>{project?.title ?? app?.title ?? copy.title}<span className={styles.titleContext}> — {app ? copy.applications : "Local"}</span></strong>
        </header>
        <div className={styles.body}>
          <div className={styles.content} key={selected ?? "all"}>
            {project ? <article className={`${styles.detail} ${project.highlights ? styles.detailLong : ""}`} style={{ "--folder-color": project.color } as CSSProperties}>
              <Cover project={project} label={copy.preview} />
              <div className={styles.detailText}>{project.category && <small>{copyText(project.category)}</small>}<h2>{copyText(project.title)}</h2>{project.role && <p className={styles.role}><strong>{copy.role}</strong> {project.role[language]}</p>}{project.weddingDate && <p className={styles.role}><strong>{copy.weddingDate}</strong> {project.weddingDate[language]}</p>}<p>{project.description[language]}</p>{project.highlights && <section className={styles.highlights} aria-label={copy.work}><h3>{copy.work}</h3><ol>{project.highlights[language].map(item => <li key={item}>{item}</li>)}</ol></section>}<ul>{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul><a href={project.href} target="_blank" rel="noopener noreferrer">{copy.open}<ArrowUpRight size={14} /></a></div>
            </article> : app ? <article className={`${styles.detail} ${styles.detailLong}`} style={{ "--folder-color": app.color } as CSSProperties}>
              <section className={styles.appMedia} aria-label={`${app.title} — ${copy.preview}`}><h3>{copy.preview}</h3><video className={`${styles.coverVideo} ${styles.appVideo}`} autoPlay muted loop playsInline preload="metadata" poster={app.poster} aria-label={`${app.title} — ${copy.preview}`}><source src={app.video} type="video/mp4" /></video></section>
              <div className={styles.appDetails}>
                <header className={styles.appHeader}>
                  <Image className={styles.appIcon} src={MONETTA.icon} alt="" width={96} height={96} />
                  <div className={styles.detailText}><small className={styles.devStatus}>{app.status[language]}</small><h2>{copyText(app.title)}</h2><p>{app.subtitle[language]}</p><a href={app.href} target="_blank" rel="noopener noreferrer">{copy.visit}<ArrowUpRight size={14} /></a></div>
                </header>
                <dl className={styles.appInfo}>{app.info.map(item => <div key={item.label.en}><dt>{item.label[language]}</dt><dd>{typeof item.value === "string" ? item.value : item.value[language]}</dd></div>)}</dl>
                <div className={`${styles.detailText} ${styles.appDescription}`}><p className={styles.role}><strong>{copy.role}</strong> {app.role[language]}</p><p>{app.description[language]}</p><section className={styles.highlights} aria-label={copy.work}><h3>{copy.work}</h3><ol>{app.highlights[language].map(item => <li key={item}>{item}</li>)}</ol></section><ul>{app.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></div>
              </div>
            </article> : <div className={styles.grid}>
              {projects.map(item => launcher(item.id, item.title, projectArt(item.id)))}
              {launcher(MONETTA.id, MONETTA.title, monettaArt)}
            </div>}
          </div>
        </div>
        {resizable && !expanded && <WindowResizeHandles handleProps={handleProps} />}
      </section>
    </div>}
  </>;
}
