"use client"
import { useState, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import { withBasePath } from '../../lib/basePath';

interface SplashScreenProps {
  onEnter: () => void;
}

const SPLASH_NOTCH_COLOR = '#e8dfd2';

const SplashScreen = ({ onEnter }: SplashScreenProps) => {
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  // While the splash is visible, override the status bar / notch color so it
  // matches the envelope paper rather than the hero section behind it.
  useLayoutEffect(() => {
    let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    const prev = metaTheme.content;
    metaTheme.content = SPLASH_NOTCH_COLOR;

    // Also keep document background in sync (Safari samples it for the notch area)
    const prevBg = document.documentElement.style.backgroundColor;
    const prevSafariTint = document.documentElement.style.getPropertyValue('--safari-tint-color');
    document.documentElement.style.backgroundColor = SPLASH_NOTCH_COLOR;
    document.documentElement.style.setProperty('--safari-tint-color', SPLASH_NOTCH_COLOR);

    return () => {
      if (metaTheme) metaTheme.content = prev;
      document.documentElement.style.backgroundColor = prevBg;
      document.documentElement.style.setProperty('--safari-tint-color', prevSafariTint);
    };
  }, []);

  // Extra safety: prevent touchmove on the splash overlay so iOS Safari
  // can't rubber-band-scroll the content underneath.
  useEffect(() => {
    if (hidden) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [hidden]);

  const handleEnter = () => {
    window.dispatchEvent(new CustomEvent('startMusic'));
    // Signal parent so it can reveal the app once the splash exit completes.
    onEnter();
    setExiting(true);
    // After fade-out completes (0.3s delay + 0.9s transition), unmount
    setTimeout(() => setHidden(true), 1400);
  };

  if (hidden) return null;

  return (
    <div className={`splash-root ${exiting ? 'splash-root--exit' : ''}`}>

      {/* ── ENVELOPE PAPER BASE ── */}
      <div className="env-base" />

      {/* Paper grain texture */}
      <div className="env-grain" />

      {/* ── BOTTOM FLAP — triangle pointing UP ── */}
      <div className="env-flap env-flap--bottom" />

      {/* ── TOP FLAP (lid) — triangle pointing DOWN ── */}
      <div className={`env-flap env-flap--top ${exiting ? 'env-flap--top-open' : ''}`} />

      {/* ── Crease line where the two flaps meet ── */}
      <div className="env-crease" />

      {/* ── SEAL + HINT ── */}
      <div className={`seal-wrapper ${exiting ? 'seal-wrapper--exit' : ''}`}>
        <button
          onClick={handleEnter}
          className={`seal ${ready ? 'seal--visible' : ''}`}
          aria-label="Abrir invitación"
        >
          <span className="seal-glow" />
          <span className="seal-body">
            <span className="seal-ring" />
            <Image
              src={withBasePath("/weddings/cindy/Diseño sin título.png")}
              alt="C&J"
              width={72}
              height={72}
              className="seal-monogram"
              priority
            />
          </span>
        </button>

        <p className={`hint ${ready ? 'hint--visible' : ''}`}>
          Toca para abrir
        </p>
      </div>


      <style jsx>{`
        /* ═══════════════════════════════════════════════════════════
           FULL-SCREEN ENVELOPE — TWO FLAPS
           ─────────────────────────────────────────────────────────
           Layers:
             1  env-base          cream paper
             2  env-grain         paper texture
             3  env-flap--bottom  bottom triangle (points up)
             4  env-flap--top     top triangle / lid (points down)
             5  env-crease        horizontal fold line
             10 seal-wrapper      wax seal + hint
        ═══════════════════════════════════════════════════════════ */

        .splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          transition: opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1) 0.3s;
        }

        .splash-root--exit {
          opacity: 0;
          pointer-events: none;
        }

        /* ── 1. Base paper ── */
        .env-base {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            165deg,
            #f5efe5 0%,
            #efe8db 25%,
            #ece4d5 50%,
            #e9e0d0 75%,
            #e5dbc9 100%
          );
        }

        /* ── 2. Paper grain ── */
        .env-grain {
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.28;
          mix-blend-mode: multiply;
          background-image:
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* ═══════════════════════════════════════════════════════════
           3 / 4. TWO TRIANGULAR FLAPS
        ═══════════════════════════════════════════════════════════ */

        .env-flap {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* Bottom flap — triangle pointing UP toward top edge */
        .env-flap--bottom {
          z-index: 3;
          background: linear-gradient(
            0deg,
            #f3ece1 0%,
            #efe8db 35%,
            #ebe3d4 100%
          );
          clip-path: polygon(0 100%, 100% 100%, 50% 30%);
          filter: drop-shadow(0 -2px 6px rgba(100, 70, 40, 0.06));
        }

        /* Top flap (lid) — triangle pointing DOWN toward bottom edge */
        .env-flap--top {
          z-index: 4;
          background: linear-gradient(
            180deg,
            #e6ddd0 0%,
            #ebe3d6 35%,
            #f0e9dc 100%
          );
          clip-path: polygon(0 0, 100% 0, 50% 62%);
          filter: drop-shadow(0 3px 8px rgba(100, 70, 40, 0.08));
          transform-origin: top center;
          transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.25s ease 0.45s;
        }

        .env-flap--top-open {
          transform: rotateX(180deg);
          opacity: 0;
        }

        /* ── 5. Crease line — hidden everywhere ── */
        .env-crease {
          display: none;
        }

        /* ═══════════════════════════════════════════════════════════
           PORTRAIT MOBILE — realistic envelope front view
           On tall portrait screens the percentage-based triangles
           stretch unnaturally. On mobile we show the envelope as
           you'd actually see it: a flat body with just a triangular
           top flap (lid) whose depth is proportional to the width.
           The bottom flap is hidden — it's tucked inside on a real
           envelope. A subtle horizontal shadow suggests the fold.
        ═══════════════════════════════════════════════════════════ */

        @media (orientation: portrait) and (max-width: 639px) {
          .env-flap--top,
          .env-flap--bottom {
            left: clamp(10px, 3.2vw, 18px);
            right: clamp(10px, 3.2vw, 18px);
          }

          /* Top flap — realistic lid, depth proportional to width */
          .env-flap--top {
            clip-path: polygon(0 0, 100% 0, 50% 54vw);
          }

          /* Keep the lower flap visible on mobile with extra contrast so the
             envelope still reads clearly on smaller, brighter screens. */
          .env-flap--bottom {
            clip-path: polygon(0 100%, 100% 100%, 50% 54vw);
            background: linear-gradient(
              0deg,
              rgba(236, 225, 206, 0.98) 0%,
              rgba(242, 233, 219, 0.96) 44%,
              rgba(233, 221, 203, 0.98) 100%
            );
            filter:
              drop-shadow(0 -4px 10px rgba(118, 92, 63, 0.12))
              drop-shadow(0 -1px 2px rgba(118, 92, 63, 0.08));
          }

          .env-crease {
            display: none;
          }
        }

        /* ═══════════════════════════════════════════════════════════
           10. SEAL — Wax seal with monogram
        ═══════════════════════════════════════════════════════════ */

        .seal-wrapper {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          transition: opacity 0.3s ease, transform 0.45s ease;
        }

        .seal-wrapper--exit {
          opacity: 0;
          transform: scale(0.92);
        }

        .seal {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 140px;
          height: 140px;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
          opacity: 0;
          transform: scale(0.6);
        }

        .seal--visible {
          animation: sealIn 0.8s cubic-bezier(0.34, 1.4, 0.64, 1) 0.3s forwards;
        }

        .seal-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1.5px solid rgba(132, 88, 69, 0.12);
          animation: glowPulse 3s ease-in-out 1.5s infinite;
        }

        .seal-body {
          position: relative;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            145deg,
            #c49a7e 0%,
            #b5846a 30%,
            #a3725a 60%,
            #c49a7e 100%
          );
          box-shadow:
            0 6px 24px rgba(132, 88, 69, 0.30),
            0 2px 6px rgba(84, 60, 36, 0.18),
            inset 0 2px 4px rgba(255, 255, 255, 0.20),
            inset 0 -2px 6px rgba(84, 60, 36, 0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .seal:hover .seal-body {
          transform: scale(1.04);
          box-shadow:
            0 8px 32px rgba(132, 88, 69, 0.38),
            0 3px 10px rgba(84, 60, 36, 0.22),
            inset 0 2px 4px rgba(255, 255, 255, 0.22),
            inset 0 -2px 6px rgba(84, 60, 36, 0.15);
        }

        .seal:active .seal-body {
          transform: scale(0.97);
          box-shadow:
            0 3px 12px rgba(132, 88, 69, 0.25),
            0 1px 4px rgba(84, 60, 36, 0.15),
            inset 0 2px 4px rgba(255, 255, 255, 0.15),
            inset 0 -2px 6px rgba(84, 60, 36, 0.15);
        }

        .seal-ring {
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          pointer-events: none;
        }

        .seal :global(.seal-monogram) {
          position: relative;
          z-index: 1;
          width: 72px;
          height: 72px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.92;
        }

        /* ── Hint text ── */
        .hint {
          font-family: 'EB Garamond', 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 15.6px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(92, 60, 45, 0.72);
          opacity: 0;
          transform: translateY(6px);
          text-decoration: underline;
          text-decoration-color: rgba(92, 60, 45, 0.38);
          text-decoration-thickness: 1px;
          text-underline-offset: 0.28em;
        }

        .hint--visible {
          animation: hintIn 0.6s ease-out 1.4s forwards,
                     hintPulse 3.5s ease-in-out 2.5s infinite;
        }

        /* ═══════════════════════════════════════════════════════════
           KEYFRAMES
        ═══════════════════════════════════════════════════════════ */

        @keyframes sealIn {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes glowPulse {
          0%, 100% {
            transform: scale(1);
            border-color: rgba(132, 88, 69, 0.08);
            box-shadow: 0 0 0 0 rgba(132, 88, 69, 0);
          }
          50% {
            transform: scale(1.08);
            border-color: rgba(132, 88, 69, 0.18);
            box-shadow: 0 0 20px 4px rgba(132, 88, 69, 0.06);
          }
        }

        @keyframes hintIn {
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes hintPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ═══════════════════════════════════════════════════════════
           RESPONSIVE
        ═══════════════════════════════════════════════════════════ */

        @media (min-width: 640px) {
          .seal { width: 160px; height: 160px; }
          .seal-body { width: 148px; height: 148px; }
          .seal-glow { inset: -12px; }
          .seal-ring { inset: 12px; }
          .seal :global(.seal-monogram) { width: 82px; height: 82px; }
          .hint { font-size: 16.8px; }
        }

        @media (min-width: 768px) {
          .seal { width: 180px; height: 180px; }
          .seal-body { width: 166px; height: 166px; }
          .seal-glow { inset: -14px; }
          .seal-ring { inset: 14px; }
          .seal :global(.seal-monogram) { width: 92px; height: 92px; }
        }

        @media (min-width: 1024px) {
          .seal { width: 190px; height: 190px; }
          .seal-body { width: 176px; height: 176px; }
          .seal :global(.seal-monogram) { width: 100px; height: 100px; }
        }

        @media (max-width: 639px) {
          .seal { width: 154px; height: 154px; }
          .seal-body { width: 143px; height: 143px; }
          .seal-glow { inset: -11px; }
          .seal-ring { inset: 11px; }
          .seal :global(.seal-monogram) { width: 79px; height: 79px; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
