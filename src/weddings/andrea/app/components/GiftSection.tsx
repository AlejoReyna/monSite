"use client"
import { useEffect, useRef, useState } from 'react';
import { FaCreditCard, FaEnvelope, FaGift } from 'react-icons/fa';
import Image from 'next/image';

// Componente GiftCard premium
interface GiftCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  content: string;
  details?: Array<{ label: string; value: string }>;
  className?: string;
}

function GiftCard({ icon: Icon, title, subtitle, content, details, className = "" }: GiftCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg transition-all duration-700 transform hover:-translate-y-2 hover:scale-[1.01] group relative border border-[#d4c4b0]/40 h-full ${className}`}
      style={{
        backgroundColor: '#f0ebe5',
        backgroundImage: `
          linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(139,115,85,0.05) 100%),
          linear-gradient(45deg, rgba(180,147,113,0.03) 0%, rgba(139,115,85,0.02) 100%)
        `,
        boxShadow: `
          inset 2px 2px 4px rgba(139,115,85,0.15),
          inset -1px -1px 3px rgba(255,255,255,0.4),
          0 4px 8px rgba(139,115,85,0.12),
          0 1px 2px rgba(139,115,85,0.08)
        `
      }}
    >
      {/* Overlay sutil para mejorar legibilidad del texto sobre cartón */}
      <div
        className="absolute inset-0 rounded-lg bg-white/30"
        style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, rgba(139,115,85,0.02) 50%, rgba(139,115,85,0.02) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 49%, rgba(196,152,91,0.01) 50%, rgba(196,152,91,0.01) 51%, transparent 52%)
          `,
          backgroundSize: '6px 6px, 8px 8px'
        }}
      ></div>

      {/* Content Section */}
      <div className="p-8 md:p-10 text-center relative h-full flex flex-col justify-between z-10">
        <div className="flex-grow">
          {/* Icon */}
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-md shadow-lg inline-flex items-center justify-center"
            style={{
              backgroundColor: '#e8ddd1',
              backgroundImage: `
                linear-gradient(45deg, rgba(180,147,113,0.15) 0%, rgba(139,115,85,0.10) 100%)
              `,
              boxShadow: `
                inset 1px 1px 3px rgba(139,115,85,0.2),
                inset -1px -1px 2px rgba(255,255,255,0.5),
                0 2px 4px rgba(139,115,85,0.15)
              `
            }}
          >
            <Icon className="text-[#5a4a3a] text-xl" />
          </div>

          {/* Title */}
          <h3
            className="text-2xl md:text-3xl font-light text-[#2c2826] mb-3 tracking-[0.15em] uppercase"
            style={{
              fontFamily: 'Playfair Display, serif',
              textShadow: '0 1px 3px rgba(255,255,255,0.8)'
            }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          <p
            className="text-[#5a4a3a]/80 text-sm font-light tracking-[0.15em] uppercase mb-6"
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
          >
            {subtitle}
          </p>

          {/* Content */}
          <p
            className="text-[#5a4f45] text-base leading-relaxed mb-6"
            style={{
              fontFamily: 'Inter, sans-serif',
              textShadow: '0 1px 2px rgba(255,255,255,0.6)'
            }}
          >
            {content}
          </p>
        </div>

        {/* Bottom section with details */}
        {details && (
          <div
            className="rounded-lg p-6 shadow-inner"
            style={{
              backgroundColor: '#f5f0e8',
              backgroundImage: `
                linear-gradient(135deg, rgba(180,147,113,0.05) 0%, rgba(139,115,85,0.03) 100%)
              `,
              boxShadow: `
                inset 1px 1px 3px rgba(139,115,85,0.2),
                inset -1px -1px 2px rgba(255,255,255,0.6)
              `,
              border: '1px solid rgba(212, 196, 176, 0.3)'
            }}
          >
            <div className="space-y-3">
              {details.map((detail: { label: string; value: string }, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span
                    className="text-[#5a4a3a]/80 font-medium tracking-[0.1em] uppercase text-xs"
                    style={{ textShadow: '0 1px 1px rgba(255,255,255,0.7)' }}
                  >
                    {detail.label}:
                  </span>
                  <span
                    className="font-semibold font-mono text-[#2c2826] text-sm"
                    style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GiftSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.15, rootMargin: '-20px' }
    );

    const currentRef = sectionRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  // Decorative floral elements matching the project style
  const FloralDecoration = ({ className = "" }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 80 80" fill="none">
      <path d="M10,40 Q25,20 40,40 Q55,60 70,40 Q55,20 40,40 Q25,60 10,40" stroke="#8B7355" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M25,35 Q30,25 35,35 Q30,45 25,35" fill="#9B8366" opacity="0.5" />
      <path d="M45,45 Q50,35 55,45 Q50,55 45,45" fill="#C4985B" opacity="0.4" />
      <circle cx="40" cy="40" r="2.5" fill="#D4A971" opacity="0.6" />
      <circle cx="32" cy="38" r="1" fill="#8B7355" opacity="0.4" />
      <circle cx="48" cy="42" r="1" fill="#8B7355" opacity="0.4" />
    </svg>
  );

  const bankDetails = [
    { label: "Banco", value: "BBVA" },
    { label: "CLABE", value: "012 180 01571801772 5" },
    { label: "Tarjeta", value: "4152 3143 6348 6377" },
    { label: "Titular", value: "Aldo Berlanga Mendoza" }
  ];

  return (
    <section
      ref={sectionRef}
      className="min-h-screen w-full py-24 px-4 md:px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)' }}
    >
      {/* Subtle organic texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196, 152, 91, 0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 60%, rgba(139, 115, 85, 0.12) 0%, transparent 60%),
                              radial-gradient(circle at 50% 90%, rgba(180, 147, 113, 0.1) 0%, transparent 60%)`
          }}
        />
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="giftPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M20,20 Q40,30 60,20 Q80,10 100,25" stroke="#8B7355" strokeWidth="0.5" fill="none" opacity="0.3" />
              <circle cx="30" cy="25" r="1" fill="#C4985B" opacity="0.2" />
              <circle cx="70" cy="22" r="0.8" fill="#9B8366" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#giftPattern)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-20 transition-all duration-2000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="flex justify-center mb-2">
            <div className="w-32 h-32 md:w-80 md:h-40 ">
              <Image
                src="/weddings/andrea/assets/gift_asset.png"
                alt="Gift icon"
                width={160}
                height={160}
                className="object-contain w-full h-full"
                style={{ filter: 'sepia(40%) saturate(80%) hue-rotate(5deg) brightness(1.1)' }}
              />
            </div>
          </div>

          <p className="text-xs md:text-sm font-light tracking-[0.4em] uppercase mb-6 text-[#8B7355] italic garamond-300">
            SI DESEAS OBSEQUIARNOS
          </p>
          <div className="w-24 h-px mx-auto mb-6 bg-[#C4985B] opacity-60"></div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.3em] uppercase text-[#5c5c5c] mb-8 garamond-300 relative">
            Regalos
          </h2>
          <p className="text-center text-stone-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light mb-8">
            Tu presencia es nuestro regalo más preciado. Si deseas honrarnos con un obsequio, te ofrecemos estas opciones con profunda gratitud.
          </p>
        </div>

        {/* Side decorative elements */}
        <div className="absolute left-8 top-1/3 w-12 h-12 opacity-20 hidden lg:block">
          {/* eslint-disable-next-line react-hooks/static-components */}
          <FloralDecoration />
        </div>
        <div className="absolute right-8 top-2/3 w-12 h-12 opacity-20 hidden lg:block">
          {/* eslint-disable-next-line react-hooks/static-components */}
          <FloralDecoration className="transform rotate-180" />
        </div>

        {/* Gift Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-20 max-w-[1200px] mx-auto items-stretch">
          {/* Envelope Card */}
          <div
            className={`group transition-all duration-2500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0 md:translate-x-4' : 'opacity-0 translate-y-8 translate-x-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <GiftCard
              icon={FaEnvelope}
              title="Sobre"
              subtitle="Tradicional"
              content="Un sobre con tu contribución será recibido con profundo agradecimiento el día de nuestra celebración. Es la forma más tradicional y querida de acompañarnos."
            />
          </div>

          {/* Bank Transfer Card */}
          <div
            className={`group transition-all duration-2500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0 md:-translate-x-4' : 'opacity-0 translate-y-8 translate-x-0'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <GiftCard
              icon={FaCreditCard}
              title="Transferencia"
              subtitle="Bancaria"
              content="Puedes realizar una transferencia bancaria directa a nuestra cuenta."
              details={bankDetails}
            />
          </div>

          {/* Horizontal Amazon Registry Card (full width on md+) */}
          <div
            className={`md:col-span-2 transition-all duration-2500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            <div
              className="relative overflow-hidden rounded-lg h-full border border-dashed border-[#d4c4b0]/60 px-6 py-7 md:px-10 md:py-9"
              style={{
                backgroundColor: '#f7f3ee',
                backgroundImage: `
                  linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(240,235,229,0.4) 100%),
                  repeating-linear-gradient(45deg, rgba(139,115,85,0.05) 0, rgba(139,115,85,0.05) 6px, transparent 6px, transparent 12px)
                `,
                boxShadow: `
                  inset 1px 1px 2px rgba(139,115,85,0.12),
                  inset -1px -1px 2px rgba(255,255,255,0.5),
                  0 6px 12px rgba(139,115,85,0.10)
                `
              }}
            >
              {/* Sutil banda superior */}
              <div
                className="absolute left-0 right-0 top-0 h-1"
                style={{ background: 'linear-gradient(90deg, rgba(196,152,91,0.35), rgba(139,115,85,0.25), rgba(196,152,91,0.35))' }}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Texto */}
                <div>
                  <h3
                    className="text-xl md:text-2xl font-light tracking-[0.12em] uppercase text-[#2c2826] mb-1"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Mesa de Regalos
                  </h3>
                  <p
                    className="text-[#5a4f45] leading-relaxed text-sm md:text-base"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Si prefieres, también puedes obsequiarnos desde nuestra mesa de regalos en Amazon.
                  </p>
                </div>

                {/* Botón creativo tipo “gift-tag” */}
                <div className="md:text-right">
                  <a
                    href="https://www.amazon.com.mx/wedding/share/aldoyandrea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gift-tag-btn group inline-flex items-center"
                    aria-label="Abrir Mesa de Regalos de Aldo Berlanga y Andrea Reyna en Amazon"
                    title="Mesa de Regalos de Aldo Berlanga y Andrea Reyna"
                  >
                    {/* Efecto brillo barrido */}
                    <span className="shine" aria-hidden="true" />
                    {/* Agujero del tag */}
                    <span className="tag-hole" aria-hidden="true" />
                    {/* Contenido */}
                    <span className="flex items-center gap-2 z-10">
                      <FaGift className="text-[#5a4a3a] text-base md:text-lg" />
                      <span className="btn-text uppercase tracking-[0.12em] text-xs md:text-sm">
                        Abrir mesa en Amazon
                      </span>
                    </span>
                    {/* Flecha */}
                    <svg
                      className="ml-2 w-4 h-4 md:w-5 md:h-5 stroke-[#8B7355] transition-transform duration-300 group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* END Horizontal Card */}
        </div>
      </div>

      <style jsx>{`
        .shadow-elegant {
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        .shadow-elegant-hover {
          box-shadow:
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        /* --- Gift Tag Button Styles --- */
        .gift-tag-btn {
          position: relative;
          padding: 0.7rem 0.95rem;
          border-radius: 9999px;
          border: 1px dashed rgba(212, 196, 176, 0.6);
          background:
            linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(240,235,229,0.5) 100%),
            linear-gradient(135deg, #fffaf5 0%, #f3ece5 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 6px 12px rgba(139,115,85,0.10);
          color: #5a4a3a;
          backdrop-filter: blur(2px);
          transform: translateZ(0);
        }
        .gift-tag-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.7),
            0 10px 18px rgba(139,115,85,0.14);
        }

        /* Agujero del tag (detalle sutil) */
        .gift-tag-btn .tag-hole {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 35% 35%, #ffffff 0%, #e8ddd1 60%, #c9b59e 100%);
          box-shadow: inset 0 0 0 1px rgba(90,74,58,0.35);
          opacity: 0.9;
        }

        /* Brillo en barrido */
        @keyframes sweep {
          0% { left: -120%; }
          100% { left: 120%; }
        }
        .gift-tag-btn .shine {
          position: absolute;
          top: 0; bottom: 0;
          left: -120%;
          width: 40%;
          pointer-events: none;
          background: linear-gradient(120deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.28) 35%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0.0) 70%);
          transform: skewX(-20deg);
          filter: blur(0.2px);
        }
        .gift-tag-btn:hover .shine {
          animation: sweep 1.2s ease-in-out;
        }

        .gift-tag-btn .btn-text {
          text-shadow: 0 1px 2px rgba(255,255,255,0.65);
          letter-spacing: 0.12em;
        }
      `}</style>
    </section>
  );
}