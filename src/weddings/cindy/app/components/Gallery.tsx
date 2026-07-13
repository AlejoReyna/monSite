"use client"
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Polaroid data ──
const polaroids = [
  { label: 'FOTO 1', rotation: -3, caption: '' },
  { label: 'FOTO 2', rotation: 4, caption: '' },
  { label: 'FOTO 3', rotation: -2, caption: '' },
  { label: 'FOTO 4', rotation: 5, caption: '' },
  { label: 'FOTO 5', rotation: -4, caption: '' },
  { label: 'FOTO 6', rotation: 2, caption: '' },
  { label: 'FOTO 7', rotation: -5, caption: '' },
];

// ═══════════════════════════════════════════════════════════════════════
// LETTER-WRITING ANIMATION (same technique as HeroSection)
// ───────────────────────────────────────────────────────────────────────
// Each letter/word is a <span> that starts invisible and animates in
// via the `letterWrite` keyframe: translateY + scaleX + blur → normal.
// Each unit gets a staggered animationDelay so they appear one by one.
//
// PRIORITY ORDER (sequential, like Hero):
//   ① Decorative flowers fade in                    (on scroll)
//   ② Date  "22 · 08 · 2026" — letter by letter     (+700ms)
//   ③ Title "¡Nos Casamos!" — letter by letter       (after ② ends)
//   ④ Decorative line draws                          (after ③ ends)
//   ⑤ Subtitle paragraph — word by word              (after ④)
//   ⑥ Swipe hint fades in                            (after ⑤ ends)
//   ⑦ Polaroid cards slide in                        (with ⑥)
// ═══════════════════════════════════════════════════════════════════════

// Timing constants — tuned so the full cascade completes in ~2s
const LETTER_SPEED = 35;   // ms between each letter
const WORD_SPEED   = 30;   // ms between each word


export default function Gallery() {
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const borderPathRef = useRef<SVGRectElement>(null);
  const [borderPerimeter, setBorderPerimeter] = useState(0);

  // ── Measure the SVG rect perimeter once mounted ──
  useEffect(() => {
    const measure = () => {
      const rect = borderPathRef.current;
      if (rect) {
        const len = rect.getTotalLength();
        setBorderPerimeter(len);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ── Sequential animation chain flags ──
  const [, setFlowersVisible] = useState(false);
  const [dateStarted, setDateStarted] = useState(false);
  const [titleStarted, setTitleStarted] = useState(false);
  const [lineDrawn, setLineDrawn] = useState(false);
  const [subtitleStarted, setSubtitleStarted] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  // ── Card stack state ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const dragStartX = useRef(0);
  const stackRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // ── Text data ──
  const dateText = '22 · 08 · 2026';
  const titleLine1 = '¡Nos';
  const titleLine2 = 'Casamos!';
  const subtitleWords = 'Con inmensa alegría en nuestros corazones, queremos invitarte a celebrar el día en que uniremos nuestras vidas para siempre.'.split(' ');

  // ── Section observer → kicks off an overlapping cascade (~2s total) ──
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered.current) {
            hasTriggered.current = true;
            setIsVisible(true);
            setFlowersVisible(true);
            after(150,  () => setDateStarted(true));
            after(400,  () => setTitleStarted(true));
            after(750,  () => setLineDrawn(true));
            after(850,  () => setSubtitleStarted(true));
            after(1500, () => { setHintVisible(true); setCardsVisible(true); });
          }
        });
      },
      { threshold: 0.1, rootMargin: '-20px' }
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
      timers.forEach(clearTimeout);
    };
  }, []);

  // ── Auto-scroll filmstrip to active thumb ──
  useEffect(() => {
    const filmstrip = filmstripRef.current;
    if (!filmstrip) return;

    const activeThumb = filmstrip.children[currentIndex] as HTMLElement | undefined;
    if (!activeThumb) return;

    const targetLeft =
      activeThumb.offsetLeft - (filmstrip.clientWidth - activeThumb.clientWidth) / 2;

    filmstrip.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, [currentIndex]);

  // ── Swipe threshold ──
  const SWIPE_THRESHOLD = 80;

  // ── Mouse handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentIndex >= polaroids.length) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    setDragX(0);
  }, [currentIndex]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragX(e.clientX - dragStartX.current);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_THRESHOLD && currentIndex < polaroids.length) {
      const direction = dragX > 0 ? 'right' : 'left';
      setExitDirection(direction);
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, polaroids.length));
        setExitDirection(null);
        setDragX(0);
      }, 350);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, currentIndex]);

  // ── Touch handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (currentIndex >= polaroids.length) return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    setDragX(0);
  }, [currentIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragX(e.touches[0].clientX - dragStartX.current);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_THRESHOLD && currentIndex < polaroids.length) {
      const direction = dragX > 0 ? 'right' : 'left';
      setExitDirection(direction);
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, polaroids.length));
        setExitDirection(null);
        setDragX(0);
      }, 350);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, currentIndex]);

  const goToPhoto = (index: number) => {
    if (index === currentIndex || index >= polaroids.length) return;
    setCurrentIndex(index);
    setDragX(0);
    setExitDirection(null);
  };

  const resetCarousel = () => {
    setCurrentIndex(0);
    setDragX(0);
    setExitDirection(null);
  };

  const getCardStyle = (index: number): React.CSSProperties => {
    const relativeIndex = index - currentIndex;

    if (relativeIndex < 0) return { display: 'none' };

    if (relativeIndex === 0) {
      const rotation = polaroids[index].rotation;

      if (exitDirection) {
        const exitX = exitDirection === 'right' ? 900 : -900;
        const exitRotation = exitDirection === 'right' ? rotation + 25 : rotation - 25;
        return {
          transform: `translateX(${exitX}px) rotate(${exitRotation}deg)`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease',
          opacity: 0.4,
          zIndex: polaroids.length - relativeIndex,
          cursor: 'grab',
        };
      }

      if (isDragging) {
        const dragRotation = rotation + dragX * 0.08;
        return {
          transform: `translateX(${dragX}px) rotate(${dragRotation}deg)`,
          transition: 'none',
          zIndex: polaroids.length - relativeIndex,
          cursor: 'grabbing',
        };
      }

      return {
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        zIndex: polaroids.length - relativeIndex,
        cursor: 'grab',
      };
    }

    if (relativeIndex <= 3) {
      const offsetY = relativeIndex * 8;
      const offsetX = relativeIndex * 5;
      const scale = 1 - relativeIndex * 0.03;
      const stackRotation = polaroids[index].rotation * 0.6;
      return {
        transform: `translateY(${offsetY}px) translateX(${offsetX}px) scale(${scale}) rotate(${stackRotation}deg)`,
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        zIndex: polaroids.length - relativeIndex,
        pointerEvents: 'none' as const,
      };
    }

    return { display: 'none' };
  };

  const dragProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="min-h-screen w-full relative overflow-hidden flex items-center"
      style={{
        background: 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)',
      }}
    >
      {/* ═══ Elegant border frame — SVG drawn with stroke-dashoffset animation ═══ */}
      <div className="gl-border-frame pointer-events-none" aria-hidden="true">
        <svg
          className={`gl-border-svg ${isVisible && borderPerimeter > 0 ? 'gl-border-svg--draw' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{ ['--perim' as string]: borderPerimeter } as React.CSSProperties}
        >
          <rect
            ref={borderPathRef}
            className="gl-border-path"
            x="1" y="1"
            width="calc(100% - 2px)" height="calc(100% - 2px)"
            rx="0" ry="0"
            fill="none"
            stroke="rgba(196,152,91,0.28)"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Organic texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] z-[1] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196, 152, 91, 0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 60%, rgba(139, 115, 85, 0.12) 0%, transparent 60%),
                              radial-gradient(circle at 50% 90%, rgba(180, 147, 113, 0.1) 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* ═══ Main Vertical Layout ═══ */}
      <div className="w-full max-w-[1400px] mx-auto relative z-10 px-6 md:px-10 lg:px-12 py-16">
        <div className="flex flex-col items-center gap-10 lg:gap-12">

          {/* ── TOP: Elegant Text with Hero-style Letter Writing ── */}
          <div className="w-full max-w-3xl flex flex-col items-center text-center shrink-0">

          
            {/* ② Date — letter by letter writing animation */}
            <div className="mb-4">
              <p className="gallery-date-text">
                {dateText.split('').map((char, i) => (
                  <span
                    key={`d-${i}`}
                    className={`gl-letter${dateStarted ? ' gl-letter--animated' : ''}`}
                    style={{ animationDelay: `${i * LETTER_SPEED}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </p>
            </div>

            {/* ③ Title — letter by letter, two lines */}
            <div className="mb-6">
              <h2 className="gallery-title-text">
                {/* Line 1: ¡Nos */}
                {titleLine1.split('').map((char, i) => (
                  <span
                    key={`t1-${i}`}
                    className={`gl-letter${titleStarted ? ' gl-letter--animated' : ''}`}
                    style={{ animationDelay: `${i * LETTER_SPEED}ms` }}
                  >
                    {char}
                  </span>
                ))}
                <br />
                {/* Line 2: Casamos! */}
                {titleLine2.split('').map((char, i) => (
                  <span
                    key={`t2-${i}`}
                    className={`gl-letter${titleStarted ? ' gl-letter--animated' : ''}`}
                    style={{ animationDelay: `${(titleLine1.length + i) * LETTER_SPEED}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </h2>
            </div>

            {/* ④ Decorative line — draws in */}
            <div
              className={`transition-all duration-[900ms] ease-out ${
                lineDrawn ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`}
              style={{ transformOrigin: 'center center' }}
            >
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C4985B] to-transparent mb-6 mx-auto" />
            </div>

            {/* ⑤ Subtitle — word by word writing animation */}
            <div className="max-w-sm">
              <p className="gallery-subtitle-text">
                {subtitleWords.map((word, i) => (
                  <span key={`w-${i}`}>
                    <span
                      className={`gl-word${subtitleStarted ? ' gl-word--animated' : ''}`}
                      style={{ animationDelay: `${i * WORD_SPEED}ms` }}
                    >
                      {word}
                    </span>
                    {i < subtitleWords.length - 1 && ' '}
                  </span>
                ))}
              </p>
            </div>

            {/* ⑥ Swipe hint — fades in last */}
            <div
              className={`mt-8 flex items-center gap-2 transition-all duration-[800ms] ${
                hintVisible ? 'opacity-60' : 'opacity-0'
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B7355]/50 garamond-300">
                Desliza las fotos
              </span>
              <svg className="w-4 h-4 text-[#8B7355]/40 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* ── BOTTOM: Stacked Polaroid Carousel + Filmstrip ── */}
          {/* ⑦ Cards slide in with the hint */}
          <div
            className={`w-full flex flex-col items-center relative transition-all duration-1000 ease-out ${
              cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Card stack container */}
            <div
              ref={stackRef}
              className="relative select-none"
              style={{
                width: 'clamp(320px, 46vw, 540px)',
                height: 'clamp(420px, 58vw, 680px)',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { if (isDragging) handleMouseUp(); }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {polaroids.map((polaroid, index) => (
                <div
                  key={index}
                  className="absolute inset-0"
                  style={getCardStyle(index)}
                >
                  <div
                    className="bg-white rounded-[3px] w-full h-full"
                    style={{
                      padding: '8px 8px clamp(36px, 5.5vw, 56px) 8px',
                      boxShadow: index === currentIndex
                        ? '0 10px 40px rgba(0,0,0,0.13), 0 3px 10px rgba(0,0,0,0.07)'
                        : '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="relative w-full h-full bg-[#ede9e2] overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm md:text-base uppercase tracking-[0.25em] text-[#8B7355]/30 garamond-300 select-none">
                          {polaroid.label}
                        </span>
                      </div>
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.05)' }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center" style={{ height: 'clamp(30px, 5vw, 50px)' }}>
                      <p className="text-[10px] md:text-xs text-[#8B7355]/40 garamond-300 tracking-[0.2em] uppercase italic">
                        {polaroid.caption || '\u00A0'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {currentIndex >= polaroids.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[#8B7355]/50 garamond-300 text-sm tracking-[0.2em] uppercase mb-6">
                    Fin de las fotos
                  </p>
                  <button
                    onClick={resetCarousel}
                    className="px-6 py-2.5 border border-[#C4985B]/40 text-[#8B7355] garamond-300 text-xs tracking-[0.25em] uppercase hover:bg-[#C4985B]/10 transition-all duration-300 rounded-sm"
                  >
                    Ver de nuevo
                  </button>
                </div>
              )}

              {isDragging && Math.abs(dragX) > 20 && (
                <div
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ opacity: dragProgress * 0.6 }}
                >
                  <svg
                    className="w-5 h-5 text-[#C4985B]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    style={{
                      transform: dragX > 0 ? 'rotate(0deg)' : 'rotate(180deg)',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* ═══ Filmstrip / Carrete ═══ */}
            <div className="mt-8 w-full max-w-md lg:max-w-lg">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C4985B]/20 to-transparent mb-3" />

              <div
                ref={filmstripRef}
                className="flex items-center gap-2 overflow-x-auto px-2 py-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {polaroids.map((_polaroid, i) => (
                  <button
                    key={i}
                    onClick={() => goToPhoto(i)}
                    className="flex-shrink-0 relative overflow-hidden rounded-[2px] transition-all duration-300 focus:outline-none"
                    style={{
                      width: i === currentIndex ? 48 : 40,
                      height: i === currentIndex ? 60 : 50,
                      opacity: i === currentIndex ? 1 : i < currentIndex ? 0.35 : 0.55,
                      border: i === currentIndex
                        ? '2px solid rgba(196, 152, 91, 0.6)'
                        : '1px solid rgba(139, 115, 85, 0.15)',
                      transform: i === currentIndex ? 'scale(1)' : 'scale(0.95)',
                      boxShadow: i === currentIndex
                        ? '0 2px 8px rgba(196, 152, 91, 0.2)'
                        : 'none',
                    }}
                  >
                    <div className="w-full h-full bg-[#ede9e2] flex items-center justify-center">
                      <span className="text-[6px] uppercase tracking-wider text-[#8B7355]/30 garamond-300 select-none">
                        {i + 1}
                      </span>
                    </div>
                    {i < currentIndex && (
                      <div className="absolute inset-0 bg-[#f5f2ee]/40" />
                    )}
                  </button>
                ))}
              </div>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C4985B]/20 to-transparent mt-3" />

              <p className="text-center mt-2 text-[10px] tracking-[0.3em] uppercase text-[#8B7355]/40 garamond-300">
                {Math.min(currentIndex + 1, polaroids.length)}&thinsp;/&thinsp;{polaroids.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           GALLERY LETTER-WRITING STYLES
           Same technique as HeroSection: translateY + scaleX + blur
           ═══════════════════════════════════════════════════════════════ */}
      <style jsx>{`

        /* ── Typography ── */
        .gallery-date-text {
          font-family: 'Cormorant Garamond', 'EB Garamond', serif;
          font-weight: 400;
          font-size: 14px;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: #C4985B;
        }
        .gallery-title-text {
          font-family: 'Cormorant Garamond', 'EB Garamond', serif;
          font-weight: 300;
          font-size: 2.25rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #5c5c5c;
          line-height: 1.1;
        }
        .gallery-subtitle-text {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1rem;
          color: #8B7355;
          line-height: 1.7;
        }

        @media (min-width: 640px) {
          .gallery-date-text { font-size: 15px; }
          .gallery-title-text { font-size: 2.8rem; }
          .gallery-subtitle-text { font-size: 1.05rem; }
        }
        @media (min-width: 768px) {
          .gallery-date-text { font-size: 16px; }
          .gallery-title-text { font-size: 3.4rem; }
          .gallery-subtitle-text { font-size: 1.125rem; }
        }

        /* ═══ LETTER WRITING — same as Hero ═══ */
        .gl-letter {
          display: inline-block;
          opacity: 0;
        }
        .gl-letter--animated {
          animation: glLetterWrite 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes glLetterWrite {
          0%   { opacity: 0; transform: translateY(10px) scaleX(0.4); filter: blur(2px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scaleX(1); filter: blur(0); }
        }

        /* ═══ WORD WRITING — same feel, slightly softer for paragraphs ═══ */
        .gl-word {
          display: inline-block;
          opacity: 0;
        }
        .gl-word--animated {
          animation: glWordWrite 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes glWordWrite {
          0%   { opacity: 0; transform: translateY(8px) scaleX(0.6); filter: blur(1.5px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scaleX(1); filter: blur(0); }
        }

        /* ═══ BORDER FRAME — DRAWING ANIMATION ═══ */
        .gl-border-frame {
          position: absolute;
          top:    20px;
          left:   20px;
          right:  20px;
          bottom: 20px;
          z-index: 2;
        }
        @media (min-width: 640px) {
          .gl-border-frame { top: 28px; left: 28px; right: 28px; bottom: 28px; }
        }
        @media (min-width: 768px) {
          .gl-border-frame { top: 36px; left: 36px; right: 36px; bottom: 36px; }
        }

        .gl-border-svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /*
         * stroke-dasharray / dashoffset are set to the actual SVG rect
         * perimeter (measured by JS, passed via --perim CSS variable).
         * The animation draws the border from dashoffset = perimeter → 0.
         */
        .gl-border-path {
          stroke-dasharray: var(--perim);
          stroke-dashoffset: var(--perim);
          opacity: 0;
        }
        .gl-border-svg--draw .gl-border-path {
          animation: glDrawBorder 1.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          animation-delay: 0.15s;
        }

        @keyframes glDrawBorder {
          0%   { stroke-dashoffset: var(--perim); opacity: 0; }
          3%   { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }

        /* ── Scrollbar hide ── */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
