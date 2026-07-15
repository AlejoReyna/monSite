"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useNavigation } from "@/contexts/navigation-context";
import { useLanguage } from "@/components/lang-context";
import LanguageSwitcher from "@/components/language-switcher";
import { t } from "@/lib/translations";

export default function NavbarV2() {
  const { navigateToSection } = useNavigation();
  const { language } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [hidden,   setHidden]   = useState(false);
  const navInk = "#ffffff";
  const navTag = "rgba(255,255,255,0.42)";

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 80 ? y > lastY : false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (id: "home" | "about" | "services" | "projects" | "contact") => {
    navigateToSection(id);
  };

  const contactPillStyle: React.CSSProperties = {
    fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
    fontSize: "0.8rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "#ffffff",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 999,
    cursor: "pointer",
    padding: "10px 18px",
    transition: "border-color 0.2s, background 0.2s",
  };

  return (
    <>
      <header
        className="nav-v2-shell"
        style={{
          position: "fixed",
          top: "0.5rem", left: 0, right: 0,
          zIndex: 50,
          transform: hidden ? "translateY(-110%)" : "translateY(0)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          background: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          borderBottom: "1px solid transparent",
        }}
      >
        {/* ── Desktop ── */}
        <nav style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(24px, 5vw, 64px)",
          height: 56,
        }}
          className="nav-desktop"
        >
          {/* Brand */}
          <Link
            href="/"
            onClick={() => handleNav("home")}
            style={{
              fontFamily: "var(--font-bebas, sans-serif)",
              fontSize: "1.25rem",
              letterSpacing: "0.08em",
              color: navInk,
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            <span style={{ color: navTag }}>&lt;</span>
            {" "}Alexis Reyna{" "}
            <span style={{ color: navTag }}>&gt;</span>
          </Link>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LanguageSwitcher />
            <button
              onClick={() => handleNav("contact")}
              className="nav-contact-pill"
              style={contactPillStyle}
            >
              {t("getInTouch", language)}
            </button>
          </div>
        </nav>

        {/* ── Mobile bar ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 52,
        }}
          className="nav-mobile"
        >
          <Link
            href="/"
            onClick={() => handleNav("home")}
            style={{
              fontFamily: "var(--font-bebas, sans-serif)",
              fontSize: "0.98rem",
              letterSpacing: "0.08em",
              color: navInk,
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            <span style={{ color: navTag }}>&lt;</span>
            {" "}Alexis Reyna{" "}
            <span style={{ color: navTag }}>&gt;</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LanguageSwitcher size="sm" />
            <button
              onClick={() => handleNav("contact")}
              className="nav-contact-pill"
              style={contactPillStyle}
            >
              {t("getInTouch", language)}
            </button>
          </div>
        </div>
      </header>

      <style>{`
        @font-face {
          font-family: "MinecraftLocal";
          src: url("/Minecraft.ttf") format("truetype");
          font-display: swap;
        }

        .nav-v2-shell,
        .nav-v2-shell * {
          font-family: var(--gic-font-comic) !important;
        }

        .nav-v2-shell {
          color: #ffffff;
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.32);
        }

        .nav-v2-shell a,
        .nav-v2-shell button {
          color: #ffffff !important;
          transition:
            color 420ms cubic-bezier(0.16, 1, 0.3, 1),
            background 420ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 420ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 420ms cubic-bezier(0.16, 1, 0.3, 1),
            filter 420ms cubic-bezier(0.16, 1, 0.3, 1),
            transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-v2-shell a span {
          color: rgba(255, 255, 255, 0.76) !important;
          transition: color 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nav-contact-pill {
          background: rgba(255, 255, 255, 0.09) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
        }

        /* Smaller pill on mobile only */
        .nav-mobile .nav-contact-pill {
          font-size: 0.66rem !important;
          letter-spacing: 0.18em !important;
          padding: 7px 13px !important;
        }

        body.is-cafeteria-panel-active .nav-v2-shell,
        body.is-cafeteria-panel-active .nav-v2-shell * {
          font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace !important;
          letter-spacing: 0 !important;
        }

        body.is-cafeteria-panel-active .nav-v2-shell {
          color: #ffffff;
          text-shadow: 0 8px 18px rgba(0, 0, 0, 0.48);
        }

        body.is-cafeteria-panel-active .nav-v2-shell a,
        body.is-cafeteria-panel-active .nav-v2-shell button {
          color: #ffffff !important;
        }

        body.is-cafeteria-panel-active .nav-v2-shell a span {
          color: rgba(255, 255, 255, 0.82) !important;
        }

        body.is-cafeteria-panel-active .nav-contact-pill {
          background: rgba(0, 0, 0, 0.28) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
        }

        body.is-minecraft-panel-active .nav-v2-shell,
        body.is-minecraft-panel-active .nav-v2-shell * {
          font-family: "MinecraftLocal", "Courier New", ui-monospace, monospace !important;
          letter-spacing: 0 !important;
        }

        body.is-minecraft-panel-active .nav-v2-shell {
          color: #ffffff;
          text-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
        }

        body.is-minecraft-panel-active .nav-v2-shell a,
        body.is-minecraft-panel-active .nav-v2-shell button {
          color: #ffffff !important;
          text-shadow: 0 8px 18px rgba(0, 0, 0, 0.48);
        }

        body.is-minecraft-panel-active .nav-v2-shell a span {
          color: #ffffff !important;
        }

        body.is-minecraft-panel-active .nav-contact-pill {
          background: rgba(16, 24, 12, 0.38) !important;
          border-color: rgba(255, 255, 255, 0.34) !important;
          box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.16);
        }

        body.is-wedding-panel-active .nav-v2-shell,
        body.is-wedding-panel-active .nav-v2-shell * {
          font-family: var(--font-cormorant), Georgia, 'Times New Roman', serif !important;
          letter-spacing: 0.08em !important;
        }

        body.is-wedding-panel-active .nav-v2-shell {
          color: #ffffff;
          text-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
        }

        body.is-wedding-panel-active .nav-v2-shell a,
        body.is-wedding-panel-active .nav-v2-shell button {
          color: #ffffff !important;
          text-shadow: 0 8px 18px rgba(0, 0, 0, 0.48);
        }

        body.is-wedding-panel-active .nav-v2-shell a span {
          color: rgba(255, 255, 255, 0.82) !important;
        }

        body.is-wedding-panel-active .nav-contact-pill {
          background: rgba(0, 0, 0, 0.28) !important;
          border-color: rgba(255, 255, 255, 0.38) !important;
        }

        /* Cuando una invitación de boda está expandida, ocultamos la navbar del portfolio */
        body.is-wedding-preview-active .nav-v2-shell {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: translateY(-110%) !important;
        }

        /* Panel claro de invitación: texto oscuro serif sobre marfil */
        body.is-invitation-panel-active .nav-v2-shell,
        body.is-invitation-panel-active .nav-v2-shell * {
          font-family: var(--font-cormorant), Georgia, 'Times New Roman', serif !important;
          letter-spacing: 0 !important;
        }

        body.is-invitation-panel-active .nav-v2-shell {
          color: #4a4039;
          text-shadow: none;
        }

        body.is-invitation-panel-active .nav-v2-shell a,
        body.is-invitation-panel-active .nav-v2-shell button {
          color: #4a4039 !important;
          text-shadow: none;
        }

        body.is-invitation-panel-active .nav-v2-shell a span {
          color: rgba(139, 115, 85, 0.82) !important;
        }

        body.is-invitation-panel-active .nav-contact-pill {
          background: rgba(196, 152, 91, 0.1) !important;
          border-color: rgba(139, 115, 85, 0.34) !important;
        }

        body.is-invitation-panel-active .nav-contact-pill:hover {
          background: rgba(196, 152, 91, 0.18) !important;
          border-color: rgba(139, 115, 85, 0.5) !important;
        }

        /* Panel de contacto pixel: fuente Press Start 2P y botón cuadrado NES */
        body.is-pixel-panel-active .nav-v2-shell,
        body.is-pixel-panel-active .nav-v2-shell * {
          font-family: var(--font-press-start), "Courier New", ui-monospace, monospace !important;
          letter-spacing: 0.02em !important;
        }

        body.is-pixel-panel-active .nav-v2-shell {
          color: #ffffff;
          text-shadow: 2px 2px 0 rgba(20, 20, 20, 0.6);
        }

        body.is-pixel-panel-active .nav-v2-shell a,
        body.is-pixel-panel-active .nav-v2-shell button {
          color: #ffffff !important;
          text-shadow: 2px 2px 0 rgba(20, 20, 20, 0.6);
        }

        body.is-pixel-panel-active .nav-desktop a {
          font-size: 0.85rem !important;
        }

        body.is-pixel-panel-active .nav-mobile a {
          font-size: 0.62rem !important;
        }

        body.is-pixel-panel-active .nav-v2-shell a span {
          color: #ffcf5c !important;
        }

        body.is-pixel-panel-active .nav-contact-pill {
          background: rgba(12, 12, 16, 0.96) !important;
          border: 2px solid #000000 !important;
          border-radius: 0 !important;
          box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
          color: #ffcf5c !important;
          font-size: 0.6rem !important;
          letter-spacing: 0.08em !important;
          text-shadow: none;
        }

        body.is-pixel-panel-active .nav-mobile .nav-contact-pill {
          font-size: 0.5rem !important;
        }

        body.is-pixel-panel-active .nav-contact-pill:hover {
          background: rgba(12, 12, 16, 0.96) !important;
          border-color: #ffcf5c !important;
          color: #ffffff !important;
        }

        body.is-nav-font-transitioning .nav-v2-shell a,
        body.is-nav-font-transitioning .nav-v2-shell button {
          animation: nav-font-crossfade 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .nav-contact-pill {
          animation: nav-contact-float 2.8s ease-in-out infinite;
        }

        .nav-contact-pill:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.38) !important;
        }

        body.is-cafeteria-panel-active .nav-contact-pill:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.52) !important;
        }

        body.is-minecraft-panel-active .nav-contact-pill:hover {
          background: rgba(120, 179, 74, 0.24) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }

        body.is-wedding-panel-active .nav-contact-pill:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.52) !important;
        }

        @keyframes nav-contact-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes nav-font-crossfade {
          0% {
            opacity: 0.72;
            filter: blur(1.5px);
            transform: translateY(-2px);
          }
          55% {
            opacity: 0.88;
            filter: blur(0.5px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }

        @media (min-width: 640px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile  { display: none  !important; }
        }
      `}</style>
    </>
  );
}
