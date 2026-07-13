"use client"
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/* ─── Letter-span renderer (hero-style stagger) ─── */
function LetterReveal({ text, active, baseDelay = 0, charStagger = 55, className = '' }: {
  text: string; active: boolean; baseDelay?: number; charStagger?: number; className?: string;
}) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className={`ds-letter ${active ? 'ds-letter-go' : ''}`}
          style={{ animationDelay: active ? `${baseDelay + i * charStagger}ms` : '0ms' }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export default function DressCodeSection() {
  const ACCENT_COLOR = '#6b4f3a';
  const DARK_ACCENT_COLOR = '#4a3426';
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [noNinosReady, setNoNinosReady] = useState(false);
  const [noNinosTextStart, setNoNinosTextStart] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.15, rootMargin: '-20px' }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Stagger: "No niños" badge appears after dress-code block settles */
  useEffect(() => {
    if (!isVisible) return;
    const t1 = setTimeout(() => setNoNinosReady(true), 1000);
    const t2 = setTimeout(() => setNoNinosTextStart(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isVisible]);


  return (
    <section
      ref={sectionRef}
      className="w-full relative overflow-hidden min-h-[100dvh]"
    >
      {/* ═══ SINGLE COLUMN: Paper (full width) ═══ */}
      <div className="ds-two-col">

        {/* ══════════════════════════════════════════
            LEFT COLUMN — the column itself IS the paper
        ══════════════════════════════════════════ */}
        <div className="ds-col-paper">

          {/* Paper base — warm parchment */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, #fdfaf5 0%, #f9f5ee 55%, #f5f0e6 100%)'
            }}
          />

          {/* Paper grain texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.032'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              opacity: 0.7,
              mixBlendMode: 'multiply',
            }}
          />

          {/* Warm ambient blush at top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 40% 15%, rgba(196,152,91,0.07) 0%, transparent 60%),
                           radial-gradient(ellipse at 60% 85%, rgba(139,115,85,0.05) 0%, transparent 55%)`
            }}
          />

          {/* Left binding shadow */}
          <div
            className="absolute top-0 left-0 bottom-0 w-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 100%)',
            }}
          />

          {/* ── Content — centred on the paper ── */}
          <div className="relative z-10 flex flex-col items-center justify-center px-3 py-5 sm:px-4 sm:py-7 md:px-10 md:py-20">
            <div className="ds-card w-full max-w-3xl text-center px-4 py-6 sm:px-6 sm:py-8 md:px-16 md:py-16">

            {/* ══ 1) NOTA ESPECIAL HEADING ══ */}
            <p className="garamond-300 text-[2.35rem] sm:text-[2.75rem] md:text-6xl text-[#6b4f3a] mb-2 sm:mb-3">
              <LetterReveal
                text="Nota especial"
                active={isVisible}
                baseDelay={0}
                charStagger={22}
              />
            </p>

            <h2 className="garamond-300 text-[0.63rem] sm:text-xs md:text-base tracking-[0.18em] sm:tracking-[0.26em] md:tracking-[0.32em] uppercase text-[#5a4635] mb-8 sm:mb-10 md:mb-16">
              <LetterReveal
                text="para nuestros invitados"
                active={isVisible}
                baseDelay={100}
                charStagger={14}
              />
            </h2>

            {/* ══ 2) DRESS CODE / ETIQUETA FORMAL BLOCK ══ */}
            <div className="mb-8 sm:mb-10 md:mb-16">
              <p className="garamond-300 tracking-[0.2em] sm:tracking-[0.28em] md:tracking-[0.32em] text-[0.68rem] sm:text-xs md:text-base uppercase mb-3 sm:mb-4 md:mb-0" style={{ color: ACCENT_COLOR, opacity: 0.9 }}>
                <LetterReveal
                  text="Etiqueta"
                  active={isVisible}
                  baseDelay={350}
                  charStagger={22}
                />
              </p>
              <p className="garamond-regular text-[2rem] sm:text-[2.35rem] md:text-5xl leading-snug mb-4 sm:mb-5 md:mb-6" style={{ color: ACCENT_COLOR }}>
                <LetterReveal
                  text="Formal"
                  active={isVisible}
                  baseDelay={500}
                  charStagger={28}
                />
              </p>

              {/* Dress code icon */}
              <div className={`flex justify-center mb-4 sm:mb-5 md:mb-7 transition-all duration-[400ms] ease-out ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
              }`} style={{ transitionDelay: '580ms' }}>
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/1124/1124043.png"
                  alt="Código de vestimenta formal"
                  className="dress-icon"
                  width={84}
                  height={84}
                  style={{
                    filter:
                      'invert(23%) sepia(16%) saturate(1017%) hue-rotate(345deg) brightness(92%) contrast(93%)',
                    opacity: 0.95,
                  }}
                />
              </div>

              <p className="garamond-300 text-[1.22rem] sm:text-[1.32rem] md:text-xl text-[#5a4635] leading-relaxed max-w-md mx-auto">
                <LetterReveal
                  text="El blanco está reservado para la novia."
                  active={isVisible}
                  baseDelay={620}
                  charStagger={8}
                />
                <br />
                <LetterReveal
                  text="Les agradecemos elegir otros colores."
                  active={isVisible}
                  baseDelay={750}
                  charStagger={8}
                />
              </p>
            </div>

            {/* ══ 3) NO NIÑOS — elegant apparition from nothing ══ */}
            <div className="relative">
              {/* "NO NIÑOS" badge — materializes from nothing */}
              <div className={`ds-no-ninos-badge ${noNinosReady ? 'ds-no-ninos-visible' : ''}`}>
                <span className="ds-ninos-line" />
                <span
                  className="garamond-regular tracking-[0.2em] sm:tracking-[0.24em] md:tracking-[0.28em] text-[16px] sm:text-[18px] md:text-[26px] uppercase font-semibold drop-shadow-[0_1px_0_rgba(84,60,36,0.22)]"
                  style={{ color: DARK_ACCENT_COLOR }}
                >
                  <LetterReveal
                    text="NO NIÑOS"
                    active={noNinosReady}
                    baseDelay={100}
                    charStagger={35}
                  />
                </span>
                <span className="ds-ninos-line" />
              </div>

              {/* Paragraph — simple fade-in after badge */}
              <div className={`mt-5 sm:mt-6 md:mt-8 max-w-lg mx-auto transition-all duration-[800ms] ease-out ${
                noNinosTextStart ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <p
                  className="garamond-regular text-[1.12rem] sm:text-[1.2rem] md:text-[1.12rem] leading-relaxed"
                  style={{ color: DARK_ACCENT_COLOR, opacity: 0.98 }}
                >
                  Con mucho cariño hemos planeado una velada íntima entre adultos.
                  {' '}Les pedimos amablemente que este día tan especial sea solo para los grandes.
                </p>
              </div>
            </div>
            </div>

          </div>{/* end content */}
        </div>{/* end left paper column */}

      </div>{/* end ds-two-col */}

      <style jsx>{`
        /* ══ SINGLE COLUMN LAYOUT ══ */
        .ds-two-col {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100dvh;
        }

        .ds-col-paper {
          position: relative;
          width: 100%;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ds-card {
          position: relative;
          background: linear-gradient(180deg, rgba(255, 255, 252, 0.98) 0%, rgba(252, 248, 242, 0.98) 100%);
          border: 1px solid rgba(107, 79, 58, 0.18);
          border-radius: 0;
          box-shadow:
            0 20px 45px rgba(74, 52, 38, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(2px);
        }

        /* ══ DRESS CODE ICON ══ */
        .dress-icon {
          width: 64px;
          height: 64px;
          object-fit: contain;
          display: block;
        }
        @media (min-width: 640px) {
          .dress-icon {
            width: 70px;
            height: 70px;
          }
        }
        @media (min-width: 768px) {
          .dress-icon {
            width: 84px;
            height: 84px;
          }
        }

        /* ══ LETTER-BY-LETTER REVEAL (hero style) ══ */
        .ds-letter {
          display: inline-block;
          opacity: 0;
        }
        .ds-letter-go {
          animation: dsLetterWrite 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes dsLetterWrite {
          0%   { opacity: 0; transform: translateY(8px) scaleX(0.4); filter: blur(2px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scaleX(1); filter: blur(0); }
        }

        /* ══ NO NIÑOS — elegant apparition ══ */
        .ds-no-ninos-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          opacity: 0;
          transform: scale(0.7) translateY(12px);
          filter: blur(6px);
          transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1),
                      transform 0.6s cubic-bezier(0.19, 1, 0.22, 1),
                      filter 0.45s ease-out;
        }
        .ds-no-ninos-visible {
          opacity: 1;
          transform: scale(1) translateY(0);
          filter: blur(0);
        }

        .ds-ninos-line {
          display: block;
          width: 2.15rem;
          height: 2px;
          background: rgba(107, 79, 58, 0.38);
          transform-origin: center;
          transform: scaleX(0);
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1) 0.15s;
        }
        @media (min-width: 640px) {
          .ds-no-ninos-badge {
            gap: 0.8rem;
          }
          .ds-ninos-line {
            width: 3.2rem;
          }
        }
        @media (min-width: 768px) {
          .ds-no-ninos-badge {
            gap: 1rem;
          }
          .ds-ninos-line {
            width: 4.5rem;
          }
        }
        .ds-no-ninos-visible .ds-ninos-line {
          transform: scaleX(1);
        }

      `}</style>
    </section>
  );
}
