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

  const [hidden,   setHidden]   = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    // Wait for the bracket expansive animation to finish (0.6s)
    const timeout = setTimeout(() => {
      const fullText = "Alexis Reyna";
      let current = "";
      let i = 0;
      const interval = setInterval(() => {
        current += fullText[i];
        setTypedText(current);
        i++;
        if (i === fullText.length) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);
  const navInk = "#ffffff";
  const navTag = "rgba(255,255,255,0.42)";

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 80 ? y > lastY : false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (id: Parameters<typeof navigateToSection>[0]) => {
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
        <nav aria-label="Primary">
          {/* ── Desktop ── */}
          <div
            className="nav-desktop"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 clamp(24px, 5vw, 64px)",
              height: 56,
            }}
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
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span className="arrow-left-anim" style={{ color: navTag }}>&lt;</span>
              <span className="brand-text-anim">
                <span style={{ opacity: 0, pointerEvents: "none" }}>Alexis Reyna</span>
                <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }} suppressHydrationWarning>{typedText}</span>
              </span>
              <span className="arrow-right-anim" style={{ color: navTag }}>&gt;</span>
            </Link>

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => handleNav("contact")}
                className="nav-contact-pill"
                style={contactPillStyle}
              >
                {t("getInTouch", language)}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="nav-burger-btn"
                aria-label="Toggle Menu"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "24px",
                  height: "16px",
                  padding: 0,
                  marginLeft: "8px",
                  zIndex: 100,
                  color: "inherit",
                }}
              >
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", transform: isMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", opacity: isMenuOpen ? 0 : 1 }} />
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", transform: isMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
              </button>
            </div>
          </div>

          {/* ── Mobile bar ── */}
          <div
            className="nav-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              height: 52,
            }}
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
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span className="arrow-left-anim" style={{ color: navTag }}>&lt;</span>
              <span className="brand-text-anim">
                <span style={{ opacity: 0, pointerEvents: "none" }}>Alexis Reyna</span>
                <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }} suppressHydrationWarning>{typedText}</span>
              </span>
              <span className="arrow-right-anim" style={{ color: navTag }}>&gt;</span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => handleNav("contact")}
                className="nav-contact-pill"
                style={contactPillStyle}
              >
                {t("getInTouch", language)}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="nav-burger-btn"
                aria-label="Toggle Menu"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "24px",
                  height: "16px",
                  padding: 0,
                  marginLeft: "4px",
                  zIndex: 100,
                  color: "inherit",
                }}
              >
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", transform: isMenuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", opacity: isMenuOpen ? 0 : 1 }} />
                <span style={{ display: "block", width: "100%", height: "2px", background: "currentColor", transition: "all 0.3s", transform: isMenuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
              </button>
            </div>
          </div>
        </nav>
      </header>
        
      {/* Lateral Menu Backdrop */}
      <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: 40,
            opacity: isMenuOpen ? 1 : 0,
            pointerEvents: isMenuOpen ? "auto" : "none",
            transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

      {/* Lateral Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "clamp(260px, 75vw, 380px)",
          height: "100vh",
          background: "rgba(12, 12, 12, 0.98)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "60px 32px",
          zIndex: 51,
          transform: isMenuOpen ? "translateX(0)" : "translateX(100%)",
          pointerEvents: isMenuOpen ? "auto" : "none",
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.7,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              alignItems: "flex-start",
              fontSize: "1.75rem",
              fontFamily: "var(--font-bebas, sans-serif)",
              width: "100%",
            }}
          >
            <button
              onClick={() => {
                handleNav("home");
                setIsMenuOpen(false);
              }}
              className="nav-overlay-link"
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "inherit",
                fontFamily: "inherit",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.2s",
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
            >
              {t("navHome", language) || "Home"}
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
              <span style={{ 
                color: "#ffffff", 
                fontSize: "inherit",
                fontFamily: "inherit",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Projects
              </span>
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1.25rem", 
                paddingLeft: "1.25rem", 
                borderLeft: "1px solid rgba(255,255,255,0.15)" 
              }}>
                {([
                  { id: "inverater", label: "Inverater" },
                  { id: "plebes", label: "Plebes" },
                  { id: "cafeteria", label: "This Cafetería" },
                  { id: "wedding", label: "Wedding Service" },
                  { id: "nonamedbot", label: "NoNamedBot" },
                ] as { id: Parameters<typeof navigateToSection>[0]; label: string }[]).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNav(item.id);
                      setIsMenuOpen(false);
                    }}
                    className="nav-overlay-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      fontSize: "1.4rem",
                      fontFamily: "inherit",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      transition: "color 0.2s",
                      padding: 0,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handleNav("contact");
                setIsMenuOpen(false);
              }}
              className="nav-overlay-link"
              style={{
                background: "none",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "inherit",
                fontFamily: "inherit",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                transition: "color 0.2s",
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
            >
              {t("contact", language) || "Contact"}
            </button>
            
            <div style={{ marginTop: "2rem", width: "100%", height: "1px", background: "rgba(255,255,255,0.1)" }} />

            <div style={{ marginTop: "1rem" }}>
              <LanguageSwitcher />
            </div>
          </nav>
      </div>

      <style>{`
        @keyframes bracket-open-left {
          0% { transform: translateX(38px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes bracket-open-right {
          0% { transform: translateX(-38px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes text-vibrate {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-1.5px, 1px); }
          40% { transform: translate(1.5px, -1px); }
          60% { transform: translate(-1px, 1.5px); }
          80% { transform: translate(1px, -1px); }
        }

        @keyframes slash-appear {
          0% { opacity: 0; transform: translateX(6px) scale(0.8); width: 0; margin-right: 0; }
          100% { opacity: 1; transform: translateX(0) scale(1); width: 8px; margin-right: 2px; }
        }

        .arrow-left-anim {
          display: inline-block;
          animation: bracket-open-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .arrow-right-anim {
          display: inline-block;
          animation: bracket-open-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .arrow-right-anim::before {
          content: "/";
          opacity: 0;
          display: inline-block;
          width: 0;
          margin-right: 0;
          overflow: hidden;
          animation: slash-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) 1.6s forwards;
        }

        .brand-text-anim {
          display: inline-block;
          position: relative;
          animation: text-vibrate 0.4s linear 1.2s 1 forwards;
        }

        @font-face {
          font-family: "MinecraftLocal";
          src: url("/Minecraft.ttf") format("truetype");
          font-display: swap;
        }

        @font-face {
          font-family: "InveraterNav";
          src: url("/inverater/fonts/Unione-Regular.otf") format("opentype");
          font-display: swap;
          font-style: normal;
          font-weight: 400;
        }

        @font-face {
          font-family: "InveraterKlarheitNav";
          src: url("/inverater/fonts/KlarheitKurrent-Regular.otf") format("opentype");
          font-display: swap;
          font-style: normal;
          font-weight: 400;
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

        body.is-inverater-panel-active .nav-v2-shell,
        body.is-inverater-panel-active .nav-v2-shell * {
          font-family: "InveraterNav", "Helvetica Neue", Arial, sans-serif !important;
          letter-spacing: 0 !important;
        }

        body.is-inverater-panel-active .nav-v2-shell {
          background: var(--sequence-theme-color, #ff8448) !important;
          border-bottom: 1px solid rgba(112, 53, 18, 0.28) !important;
          box-shadow: 0 4px 10px rgba(89, 35, 5, 0.28);
          color: #ffffff;
          text-shadow: none;
          top: 0 !important;
        }

        body.is-inverater-panel-active .nav-desktop {
          height: 72px !important;
        }

        body.is-inverater-panel-active .nav-mobile {
          height: 62px !important;
        }

        body.is-inverater-panel-active .nav-v2-shell .nav-desktop > a,
        body.is-inverater-panel-active .nav-v2-shell .nav-mobile > a {
          font-family: "InveraterKlarheitNav", "Helvetica Neue", Arial, sans-serif !important;
          font-weight: 400 !important;
        }

        body.is-inverater-panel-active .nav-v2-shell a,
        body.is-inverater-panel-active .nav-v2-shell button,
        body.is-inverater-panel-active .nav-v2-shell a span {
          color: #ffffff !important;
        }

        body.is-inverater-panel-active .nav-v2-shell .nav-contact-pill {
          background: rgba(255, 255, 255, 0.94) !important;
          border-color: rgba(255, 255, 255, 0.94) !important;
          color: #b9470f !important;
          box-shadow: 0 4px 8px rgba(80, 31, 4, 0.2);
          font-weight: 500 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          -webkit-text-fill-color: #b9470f !important;
        }

        body.is-inverater-panel-active .nav-v2-shell .nav-contact-pill:hover {
          background: #ffffff !important;
          border-color: #ffffff !important;
          color: #9f3809 !important;
          -webkit-text-fill-color: #9f3809 !important;
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
