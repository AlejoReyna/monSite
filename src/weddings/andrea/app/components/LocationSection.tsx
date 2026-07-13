"use client"
import { useEffect, useRef, useState } from 'react';
import { MdDirections } from 'react-icons/md';
import Image from 'next/image';
import sagradoCorazon from '../../assets/robada.jpg';
import museum from '../../assets/museum.jpg';

export default function LocationSection() {
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
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  // Decorative floral elements matching the project style
  const FloralDecoration = ({ className = "" }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 80 80" fill="none">
      <path 
        d="M10,40 Q25,20 40,40 Q55,60 70,40 Q55,20 40,40 Q25,60 10,40" 
        stroke="#8B7355" 
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      <path d="M25,35 Q30,25 35,35 Q30,45 25,35" fill="#9B8366" opacity="0.5"/>
      <path d="M45,45 Q50,35 55,45 Q50,55 45,45" fill="#C4985B" opacity="0.4"/>
    </svg>
  );

  return (
    <section
      ref={sectionRef}
      className="min-h-screen w-full py-24 px-4 md:px-8 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)'
      }}
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
            <pattern id="locationPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <path 
                d="M20,20 Q40,30 60,20 Q80,10 100,25" 
                stroke="#8B7355" 
                strokeWidth="0.5" 
                fill="none" 
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#locationPattern)"/>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with elegant styling */}
        <div className={`text-center mb-20 transition-all duration-2000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`} style={{ transitionDelay: '200ms' }}>
          
          {/* Decorative top element */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 opacity-40">
              <FloralDecoration />
            </div>
          </div>
          
          {/* Main title */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.3em] uppercase text-[#5c5c5c] mb-8 garamond-300 relative">
            Ubicaciones
          </h2>

          {/* Decorative line */}
          <div className="w-100 h-px mx-auto mb-6 bg-[#C4985B] opacity-60"></div>
        </div>

        {/* Side decorative elements */}
        <div className="absolute left-8 top-1/3 w-12 h-12 opacity-20 hidden lg:block">
          <FloralDecoration />
        </div>
        <div className="absolute right-8 top-2/3 w-12 h-12 opacity-20 hidden lg:block">
          <FloralDecoration className="transform rotate-180" />
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-20 max-w-[1500px] mx-auto">
          
          {/* Ceremonia Card */}
          <div
            className={`group transition-all duration-2500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0 md:translate-x-4' : 'opacity-0 translate-y-8 translate-x-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            {/* FRAME + PAPER SURFACE (reemplaza el cuadro blanco) */}
            <div className="card-frame">
              <div className="card-surface">
                <div className="accent-bar" aria-hidden />
                
                {/* Image Section */}
                <div className="relative h-80 md:h-96 overflow-hidden">
                  <Image
                    src={sagradoCorazon}
                    alt="Ceremonia Religiosa"
                    fill
                    className="object-cover transition-transform duration-700 scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-all duration-700"></div>
                  
                  {/* Overlay Content */}
                  <div className="absolute bottom-6 left-6 text-white opacity-100 transition-all duration-500 transform translate-y-0">
                    <div className="w-12 h-px bg-white mb-3"></div>
                    <p className="text-sm tracking-[0.2em] uppercase font-light">Iglesia &apos;Sagrado corazón de Jesús&apos;</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-10 md:p-12 text-center relative">
                  {/* Title */}
                  <h3 className="text-3xl md:text-4xl font-light text-stone-800 mb-6 tracking-wide" style={{fontFamily: 'Georgia, serif'}}>
                    Ceremonia religiosa
                  </h3>

                  {/* Time (opcional) */}
                  <div className="mb-8"></div>

                  {/* Location */}
                  <div className="space-y-2 mb-10">
                    <p className="text-stone-800 text-lg font-medium tracking-wide">
                      Iglesia Sagrado Corazón de Jesús
                    </p>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Calle Ignacio Zaragoza 700, Centro de Montemorelos
                    </p>
                    <p className="text-stone-600 text-sm">
                      67500 Montemorelos, N.L.
                    </p>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-10">
                    <a 
                      href="https://www.google.com/maps?client=firefox-b-d&sca_esv=289557ae53a63d3d&uact=5&gs_lp=Egxnd3Mtd2l6LXNlcnAiOWdvb2dsZSBtYXBzIGlnbGVzaWEgc2FncmFkbyBjb3Jhem9uIGRlIGplc3VzIG1vbnRlbW9yZWxvc0gAUABYAHAAeAGQAQCYAQCgAQCqAQC4AQPIAQD4AQGYAgCgAgCYAwCSBwCgBwCyBwC4BwDCBwDIBwA&um=1&ie=UTF-8&fb=1&gl=mx&sa=X&geocode=KafWv5En13yGMVJTeLebkJ03&daddr=Calle+Ignacio+Zaragoza+700,+Centro+de+Montemorelos,+67500+Montemorelos,+N.L."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn inline-flex items-center gap-3 px-8 py-4 border border-stone-500 text-stone-900 transition-all duration-400 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-stone-100 translate-x-0 transition-transform duration-400"></div>
                      <MdDirections className="text-lg relative z-10 rotate-12 transition-transform duration-300" />
                      <span className="font-light tracking-[0.1em] uppercase text-sm relative z-10">Ver en Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recepción Card */}
          <div
            className={`group transition-all duration-2500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0 md:-translate-x-4' : 'opacity-0 translate-y-8 translate-x-0'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <div className="card-frame">
              <div className="card-surface">
                <div className="accent-bar" aria-hidden />
                
                {/* Image Section */}
                <div className="relative h-80 md:h-96 overflow-hidden">
                  <Image
                    src={museum}
                    alt="Lugar de Recepción"
                    fill
                    className="object-cover transition-transform duration-700 scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-all duration-700"></div>
                  
                  {/* Overlay Content */}
                  <div className="absolute bottom-6 left-6 text-white opacity-100 transition-all duration-500 transform translate-y-0">
                    <div className="w-12 h-px bg-white mb-3"></div>
                    <p className="text-sm tracking-[0.2em] uppercase font-light">Salón del museo &apos;Valle del Pilón&apos;</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-10 md:p-12 text-center relative">
                  {/* Title */}
                  <h3 className="text-3xl md:text-4xl font-light text-stone-800 mb-6 tracking-wide" style={{fontFamily: 'Georgia, serif'}}>
                    Recepción
                  </h3>

                  {/* Location */}
                  <div className="space-y-2 mb-10">
                    <p className="text-stone-800 text-lg font-medium tracking-wide">
                      Museo histórico &apos;Valle del Pilón&apos;
                    </p>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      Prolongación Frontera, s/n, Barrio Parar
                    </p>
                    <p className="text-stone-600 text-sm">
                      67500 Montemorelos, N.L.
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-10">
                    <a 
                      href="https://www.google.com/maps/dir//Prolongaci%C3%B3n+Frontera,+s%2Fn,+Barrio+Parar,+67500+Montemorelos,+N.L./@25.1930478,-99.9006511,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x867cd727ceb145f5:0x1500ee5283da0c71!2m2!1d-99.8182496!2d25.1930706?entry=ttu&g_ep=EgoyMDI1MDYzMC4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn inline-flex items-center gap-3 px-8 py-4 border border-stone-500 text-stone-900 transition-all duration-400 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-stone-100 translate-x-0 transition-transform duration-400"></div>
                      <MdDirections className="text-lg relative z-10 rotate-12 transition-transform duration-300" />
                      <span className="font-light tracking-[0.1em] uppercase text-sm relative z-10">Ver en Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
       
      </div>

      <style jsx>{`
        /* ====== NUEVO LOOK ELEGANTE PARA LAS CARDS ====== */
        .card-frame {
          position: relative;
          border-radius: 22px;
          padding: 1px; /* finísimo borde */
          background: linear-gradient(
            135deg,
            rgba(196, 152, 91, 0.65),
            rgba(139, 115, 85, 0.55) 45%,
            rgba(180, 147, 113, 0.6)
          );
          box-shadow:
            0 10px 24px -12px rgba(0,0,0,0.2),
            0 0 0 1px rgba(0,0,0,0.03) inset;
          transition: transform 400ms ease, box-shadow 400ms ease, opacity 400ms ease;
        }
        .card-frame:hover {
          box-shadow:
            0 20px 60px -20px rgba(0,0,0,0.28),
            0 0 0 1px rgba(0,0,0,0.04) inset;
        }

        .card-surface {
          position: relative;
          border-radius: 21px;
          overflow: hidden;
          /* Papel fino con leve brillo y veta sutil en la misma paleta */
          background:
            radial-gradient(120% 70% at 10% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%),
            linear-gradient(180deg, #f7f3ee 0%, #faf8f5 60%, #f6f1ea 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.65),
            inset 0 -1px 0 rgba(139,115,85,0.06);
          transition: box-shadow 400ms ease, transform 400ms ease;
        }
        /* Textura orgánica muy ligera (sin ruido pesado) */
        .card-surface::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(1px 1px at 12% 18%, rgba(139,115,85,0.06) 50%, transparent 51%),
            radial-gradient(1px 1px at 78% 72%, rgba(196,152,91,0.05) 50%, transparent 51%),
            radial-gradient(1px 1px at 45% 40%, rgba(180,147,113,0.045) 50%, transparent 51%);
          mix-blend-mode: multiply;
          opacity: .8;
        }
        /* Barra superior “filo dorado” para remate de lujo */
        .accent-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #C4985B, #8B7355, #C4985B);
          opacity: .8;
        }

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
        
        @keyframes fadeInSeparate {
          0% { opacity: 0; transform: translateY(20px) translateX(0); }
          70% { opacity: 1; transform: translateY(0) translateX(0); }
          100% { opacity: 1; transform: translateY(0) translateX(var(--final-x, 0)); }
        }
        
        @media (max-width: 768px) {
          .md\\:translate-x-4,
          .md\\:-translate-x-4 {
            transform: translateY(0) translateX(0) !important;
          }
        }
      `}</style>
    </section>
  );
}