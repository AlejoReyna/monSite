"use client"
import { useEffect, useRef, useState, useCallback } from 'react';

export default function GiftSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.12, rootMargin: '-20px' }
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  // Small copy icon
  const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block ml-2 opacity-0 group-hover/copy:opacity-60 transition-opacity duration-300">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="#8B7355" strokeWidth="1" />
      <path d="M10,4 V2.5 A1.5,1.5 0 0,0 8.5,1 H2.5 A1.5,1.5 0 0,0 1,2.5 V8.5 A1.5,1.5 0 0,0 2.5,10 H4" stroke="#8B7355" strokeWidth="1" />
    </svg>
  );

  // Copiable detail row
  const DetailRow = ({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-[#C4985B]/10 last:border-b-0">
      <span className="garamond-300 tracking-[0.2em] text-[10px] md:text-[11px] uppercase text-[#8B7355]/70 mb-1 sm:mb-0">
        {label}
      </span>
      {copyValue ? (
        <button
          onClick={() => copyToClipboard(copyValue, label)}
          className="group/copy inline-flex items-center cursor-pointer hover:text-[#8B7355] transition-colors duration-300"
          title="Copiar"
        >
          <span className="font-mono text-sm text-[#543c24] tracking-wide">
            {value}
          </span>
          <CopyIcon />
          {copied === label && (
            <span className="ml-2 text-[10px] tracking-[0.15em] uppercase text-[#C4985B] animate-fade-in-up">
              copiado
            </span>
          )}
        </button>
      ) : (
        <span className="garamond-regular text-sm text-[#543c24]">
          {value}
        </span>
      )}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="min-h-screen w-full py-28 px-6 md:px-8 relative overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #fbf9f6 0%, #f8f6f3 50%, #fbf9f6 100%)'
      }}
    >
      {/* Very subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(196,152,91,0.035) 0%, transparent 65%)'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10 w-full">

        {/* ── Header (centered) ── */}
        <div className="text-center mb-16">

          {/* Top ornamental line */}
          <div className={`flex items-center justify-center gap-3 mb-14 transition-all duration-[1800ms] ease-out ${
            isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`} style={{ transitionDelay: '100ms' }}>
            <span className="block w-16 h-[0.5px] bg-[#C4985B]/40" />
            <span className="block w-1.5 h-1.5 rounded-full bg-[#C4985B]/35" />
            <span className="block w-16 h-[0.5px] bg-[#C4985B]/40" />
          </div>

          {/* Script accent */}
          <p className={`mrs-saint-delafield-regular text-3xl md:text-4xl text-[#8B7355]/60 mb-2 transition-all duration-[1600ms] ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`} style={{ transitionDelay: '300ms' }}>
            Si deseas obsequiarnos
          </p>

          {/* Section title */}
          <h2 className={`garamond-300 text-xs md:text-sm tracking-[0.35em] uppercase text-[#5c5c5c] mb-10 transition-all duration-[1600ms] ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`} style={{ transitionDelay: '500ms' }}>
            mesa de regalos
          </h2>

          {/* Intro message */}
          <p className={`garamond-regular text-base md:text-lg text-[#543c24] leading-relaxed max-w-md mx-auto transition-all duration-[1800ms] ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '650ms' }}>
            Tu presencia es nuestro regalo más preciado. Si deseas honrarnos con un obsequio, te ofrecemos estas opciones con profunda gratitud.
          </p>
        </div>

        {/* ══════════════════════════════════════════════
            Horizontal layout — two options side by side
            ══════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-10 md:gap-0">

          {/* ── Left: Sobre ── */}
          <div className={`flex-1 text-center md:px-10 transition-all duration-[1800ms] ease-out ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 md:-translate-x-10'
          }`} style={{ transitionDelay: '850ms' }}>

            {/* Envelope icon */}
            <div className="flex justify-center mb-5">
              <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                <rect x="1" y="1" width="34" height="26" rx="3" stroke="#C4985B" strokeWidth="0.7" opacity="0.4" />
                <path d="M1,1 L18,15 L35,1" stroke="#C4985B" strokeWidth="0.7" opacity="0.35" fill="none" />
                <path d="M1,27 L13,15" stroke="#C4985B" strokeWidth="0.5" opacity="0.2" fill="none" />
                <path d="M35,27 L23,15" stroke="#C4985B" strokeWidth="0.5" opacity="0.2" fill="none" />
              </svg>
            </div>

            <p className="garamond-300 tracking-[0.3em] text-[11px] md:text-xs uppercase text-[#8B7355] mb-4">
              Sobre
            </p>
            <p className="garamond-regular text-base md:text-lg text-[#543c24]/80 leading-relaxed max-w-xs mx-auto">
              Un sobre con tu contribución será recibido con profundo agradecimiento el día de nuestra celebración.
            </p>
          </div>

          {/* ── Center divider ── */}
          {/* Vertical on desktop, horizontal on mobile */}
          <div className={`flex items-center justify-center transition-all duration-[1800ms] ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`} style={{ transitionDelay: '1000ms' }}>
            {/* Mobile: horizontal */}
            <div className="flex md:hidden items-center gap-4">
              <span className="block w-12 h-[0.5px] bg-[#C4985B]/25" />
              <span className="garamond-300 text-[11px] tracking-[0.2em] text-[#C4985B]/40 uppercase">o</span>
              <span className="block w-12 h-[0.5px] bg-[#C4985B]/25" />
            </div>
            {/* Desktop: vertical */}
            <div className="hidden md:flex flex-col items-center gap-4 self-stretch py-4">
              <span className="block w-[0.5px] flex-1 bg-[#C4985B]/25" />
              <span className="garamond-300 text-[11px] tracking-[0.2em] text-[#C4985B]/40 uppercase">o</span>
              <span className="block w-[0.5px] flex-1 bg-[#C4985B]/25" />
            </div>
          </div>

          {/* ── Right: Transferencia ── */}
          <div className={`flex-1 text-center md:px-10 transition-all duration-[2000ms] ease-out ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 md:translate-x-10'
          }`} style={{ transitionDelay: '1100ms' }}>

            {/* Card icon */}
            <div className="flex justify-center mb-5">
              <svg width="38" height="26" viewBox="0 0 38 26" fill="none">
                <rect x="1" y="1" width="36" height="24" rx="3" stroke="#C4985B" strokeWidth="0.7" opacity="0.4" />
                <rect x="1" y="7" width="36" height="4" fill="#8B7355" opacity="0.1" />
                <rect x="5" y="17" width="10" height="2" rx="1" fill="#C4985B" opacity="0.2" />
                <rect x="18" y="17" width="6" height="2" rx="1" fill="#C4985B" opacity="0.15" />
              </svg>
            </div>

            <p className="garamond-300 tracking-[0.3em] text-[11px] md:text-xs uppercase text-[#8B7355] mb-4">
              Transferencia bancaria
            </p>
            <p className="garamond-regular text-base md:text-lg text-[#543c24]/80 leading-relaxed max-w-xs mx-auto mb-8">
              Puedes realizar una transferencia directa a nuestra cuenta.
            </p>

            {/* Bank details */}
            <div className={`max-w-sm mx-auto text-left transition-all duration-[2000ms] ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`} style={{ transitionDelay: '1400ms' }}>

              <div className="border border-[#C4985B]/15 rounded-sm px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(248,246,243,0.8) 100%)'
                }}
              >
                <DetailRow label="Banco" value="BBVA" />
                <DetailRow label="CLABE" value="0125 8001 5127 6602 40" copyValue="012580015127660240" />
                <DetailRow label="Tarjeta" value="4152 3141 2145 2463" copyValue="4152314121452463" />
                <DetailRow label="Titular" value="Cindy Janeth Medina Sanchez" />
              </div>

              <p className="garamond-300 text-[10px] tracking-[0.15em] text-[#8B7355]/40 text-center mt-3 uppercase">
                Toca un número para copiarlo
              </p>
            </div>
          </div>

        </div>

        {/* ── Bottom ornamental line ── */}
        <div className={`flex items-center justify-center gap-3 mt-16 transition-all duration-[1800ms] ease-out ${
          isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`} style={{ transitionDelay: '1700ms' }}>
          <span className="block w-16 h-[0.5px] bg-[#C4985B]/40" />
          <span className="block w-1.5 h-1.5 rounded-full bg-[#C4985B]/35" />
          <span className="block w-16 h-[0.5px] bg-[#C4985B]/40" />
        </div>

      </div>
    </section>
  );
}
