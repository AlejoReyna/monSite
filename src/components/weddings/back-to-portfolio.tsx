import Link from "next/link";

/**
 * Floating control shown on the ported wedding invitations so visitors can
 * return to the portfolio. Sits above everything — including Cindy's
 * envelope splash — so the way back is never blocked.
 */
export default function BackToPortfolio() {
  return (
    <Link
      href="/"
      aria-label="Back to the portfolio"
      style={{
        alignItems: "center",
        backdropFilter: "blur(6px)",
        background: "rgba(24, 19, 19, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.55)",
        borderRadius: 999,
        bottom: "1.15rem",
        color: "#ffffff",
        display: "inline-flex",
        fontFamily: "var(--font-cormorant), Georgia, 'Times New Roman', serif",
        fontSize: "0.72rem",
        gap: "0.45em",
        left: "1.15rem",
        letterSpacing: "0.18em",
        padding: "0.55rem 1.05rem",
        position: "fixed",
        textDecoration: "none",
        textShadow: "0 1px 8px rgba(0, 0, 0, 0.4)",
        textTransform: "uppercase",
        zIndex: 2147483000,
      }}
    >
      <span aria-hidden="true">‹</span> Portfolio
    </Link>
  );
}
