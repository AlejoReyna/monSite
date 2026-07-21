"use client"
import ItineraryItemCard from './ItineraryItemCard';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import Image from 'next/image';

interface ItineraryItem {
  time: string;
  displayTime: string;
  title: string;
  description: string;
  location?: string;
}

export default function ItinerarySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { isNightMode, setIsNightMode } = useTheme();
  
  // Enhanced scroll-based animation state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Define itinerary items first so we can use them in other functions
  const itineraryItems: ItineraryItem[] = useMemo(() => [
    {
      time: "3:30 PM",
      displayTime: "3:30",
      title: "Misa",
      description: "",
      location: "Iglesia 'Sagrado corazón de Jesús'"
    },
    {
      time: "6:30 PM",
      displayTime: "06:30",
      title: "Ceremonia Civil",
      description: "",
      location: "Museo histórico 'Valle del Pilón'"
    },
    {
      time: "7:00 PM ",
      displayTime: "07:00",
      title: "Recepción",
      description: "",
      location: "Museo histórico 'Valle del Pilón'"
    }
  ], []);

  // Set up client-side state and window dimensions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const updateWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    
    updateWindowHeight();
    window.addEventListener('resize', updateWindowHeight);
    
    // Ensure we start in day mode and wait a bit before allowing theme changes
    setIsNightMode(false);
    
    // Allow theme changes after a short delay to prevent immediate activation
    const timer = setTimeout(() => {
      setHasInitialized(true);
    }, 1000);
    
    return () => {
      window.removeEventListener('resize', updateWindowHeight);
      clearTimeout(timer);
    };
  }, [setIsNightMode]);

  // Calculate which specific card we're currently viewing
  const getCurrentCardIndex = useCallback(() => {
    if (!sectionRef.current || !isClient || windowHeight === 0) return -1;

    const rect = sectionRef.current.getBoundingClientRect();
    const sectionTop = rect.top;
    
    // Calculate based on viewport center position
    const viewportCenter = windowHeight / 2;
    const relativeCenter = viewportCenter - sectionTop;
    
    // Estimate card height and spacing (each card takes roughly 1/3 of section)
    const cardHeight = rect.height / itineraryItems.length;
    const currentIndex = Math.floor(relativeCenter / cardHeight);
    
    return Math.max(0, Math.min(currentIndex, itineraryItems.length - 1));
  }, [isClient, windowHeight, itineraryItems.length]);

  // eslint-disable-next-line react-hooks/refs
  const currentCardIndex = getCurrentCardIndex();

  // Calculate scroll progress for content transitions only
  const updateScrollProgress = useCallback(() => {
    if (!sectionRef.current || !isClient || windowHeight === 0) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const sectionHeight = sectionRef.current.offsetHeight;
    
    // Calculate how much of the section has been scrolled through
    const sectionTop = rect.top;
    const sectionBottom = rect.bottom;
    
    let progress = 0;
    
    if (sectionTop <= 0 && sectionBottom >= windowHeight) {
      // Section is larger than viewport and we're scrolling through it
      const scrolledDistance = Math.abs(sectionTop);
      const totalScrollableDistance = sectionHeight - windowHeight;
      progress = Math.min(scrolledDistance / totalScrollableDistance, 1);
    } else if (sectionTop <= windowHeight && sectionBottom >= 0) {
      // Section is partially visible
      const visibleHeight = Math.min(sectionBottom, windowHeight) - Math.max(sectionTop, 0);
      progress = visibleHeight / windowHeight;
    }
    
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Check if section is significantly visible AND user is actively scrolling within it
    const isVisible = (
      sectionTop <= windowHeight * 0.3 && // Section header is well into viewport
      sectionBottom >= windowHeight * 0.7 && // Section extends well below viewport
      clampedProgress > 0.2 // User has scrolled significantly into the section content
    );
    
   
    setIsSectionVisible(isVisible);
    setScrollProgress(clampedProgress);
    
  }, [isClient, windowHeight]);

  // Update night mode based on current card - activate when reaching "Recepción" card
  useEffect(() => {
    if (!hasInitialized) {
      return;
    }
    
    if (!isSectionVisible) {
      setIsNightMode(false);
      return;
    }
    
    // Check if we're currently viewing the "Recepción" card (index 2)
    const currentCard = itineraryItems[currentCardIndex];
    const isReceptionCard = currentCard?.title === 'Recepción';
    
    if (isReceptionCard !== isNightMode) {
      setIsNightMode(isReceptionCard);
    }
  }, [currentCardIndex, setIsNightMode, isSectionVisible, hasInitialized, isNightMode, itineraryItems, scrollProgress]);

  // Listen to normal page scroll
  useEffect(() => {
    if (!isClient) return;

    const handleScroll = () => {
      updateScrollProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollProgress, isClient]);

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
      <circle cx="40" cy="40" r="2.5" fill="#D4A971" opacity="0.6"/>
      <circle cx="32" cy="38" r="1" fill="#8B7355" opacity="0.4"/>
      <circle cx="48" cy="42" r="1" fill="#8B7355" opacity="0.4"/>
    </svg>
  );

  return (
    <section 
      ref={sectionRef}
      className={`min-h-screen w-full py-24 px-4 md:px-8 relative overflow-hidden transition-all duration-1000 ease-in-out ${
        isNightMode ? 'bg-[#1a1a1a]' : ''
      }`}
      style={{ 
        background: isNightMode ? '#1a1a1a' : 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)'
      }}
    >
      {/* Celestial Elements - Siguen el scroll del viewport con efecto parallax */}
      {/* Sol que aparece durante el día */}
      <div 
        className={`absolute celestial-transition animate-celestial-float ${
          isNightMode ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`} 
        style={{ 
          zIndex: 1,
          top: `${20 + (scrollProgress * 40)}%`, // Se mueve hacia abajo del 20% al 60%
          right: `${10 + (scrollProgress * 30)}%`, // Se mueve hacia la derecha del 10% al 40%
          transform: `translateX(${scrollProgress * 100}px) translateY(${Math.sin(scrollProgress * Math.PI) * 30}px) rotate(${scrollProgress * 360}deg)` // Movimiento adicional suave con rotación
        }}
      >
        <div className="relative animate-fade-celestial">
          <div className="w-32 h-32 bg-[#d4c4b0] rounded-full opacity-80 relative">
            <div className="absolute inset-0 animate-sun-rotate">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-60"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 rotate-180">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-60"></div>
              </div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 -rotate-90">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-60"></div>
              </div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 rotate-90">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-60"></div>
              </div>
              <div className="absolute top-2 right-2 transform rotate-45">
                <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-40"></div>
              </div>
              <div className="absolute top-2 left-2 transform -rotate-45">
                <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-40"></div>
              </div>
              <div className="absolute bottom-2 right-2 transform rotate-135">
                <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-40"></div>
              </div>
              <div className="absolute bottom-2 left-2 transform -rotate-135">
                <div className="w-0 h-0 border-l-3 border-r-3 border-b-6 border-l-transparent border-r-transparent border-b-[#d4c4b0] opacity-40"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Luna que aparece cuando es modo nocturno */}
      <div 
        className={`absolute celestial-transition animate-celestial-float ${
          isNightMode ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`} 
        style={{ 
          zIndex: 1, 
          animationDelay: '2s',
          top: `${30 - (scrollProgress * 20)}%`, // Se mueve hacia arriba del 30% al 10%
          left: `${10 + (scrollProgress * 25)}%`, // Se mueve hacia la derecha del 10% al 35%
          transform: `translateX(${scrollProgress * -50}px) translateY(${Math.cos(scrollProgress * Math.PI) * 20}px) rotate(${scrollProgress * -180}deg)` // Movimiento contrario al sol con rotación inversa
        }}
      >
        <div className="relative animate-fade-celestial">
          <div className="w-24 h-24 bg-white opacity-70 rounded-full relative overflow-hidden">
            <div className="absolute top-3 left-5 w-2 h-2 bg-gray-300 rounded-full opacity-40"></div>
            <div className="absolute top-6 right-3 w-1.5 h-1.5 bg-gray-300 rounded-full opacity-30"></div>
            <div className="absolute bottom-4 left-3 w-1 h-1 bg-gray-300 rounded-full opacity-35"></div>
            <div className="absolute bottom-3 right-4 w-3 h-3 bg-gray-300 rounded-full opacity-25"></div>
            <div className="absolute top-4 left-2 w-1 h-1 bg-gray-300 rounded-full opacity-30"></div>
          </div>
          <div className="absolute -top-1 -left-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
          <div className="absolute top-1 right-6 w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
          <div className="absolute top-6 -right-2 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
          <div className="absolute bottom-2 left-8 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
        </div>
      </div>



      {/* Subtle organic texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ zIndex: 3 }}>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196, 152, 91, 0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 60%, rgba(139, 115, 85, 0.12) 0%, transparent 60%),
                              radial-gradient(circle at 50% 90%, rgba(180, 147, 113, 0.1) 0%, transparent 60%)`
          }}
        />
      </div>



      <div className="max-w-6xl mx-auto relative" style={{ zIndex: 10 }}>
        {/* Header with elegant styling */}
        <div className="text-center mb-20 transition-all duration-2000 ease-out opacity-100 translate-y-0" style={{ transitionDelay: '200ms' }}>
          
          {/* Clock Asset - Above the title like in Gallery */}
          <div className="flex justify-center mb-16">
            <div className="w-24 h-24 md:w-32 md:h-32 relative">
              <Image 
                src="/weddings/andrea/assets/clock.png" 
                alt="Reloj decorativo" 
                fill
                className="object-contain opacity-80 transition-opacity duration-500 hover:opacity-100"
              />
            </div>
          </div>
        
          
          {/* Main title replaced with 'Itinerario del Día', color from subtitle, font size from Cronograma */}
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.1em] uppercase mb-8 garamond-300 relative transition-colors duration-500 ${
            isNightMode ? 'text-white' : 'text-[#8B7355]'
          }`}>
            Itinerario 
          </h2>
          {/* Decorative line below the main title */}
          <div className={`w-24 h-px mx-auto mb-6 transition-colors duration-500 ${
            isNightMode ? 'bg-white/60' : 'bg-[#C4985B]'
          } opacity-60`}></div>
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

        {/* Timeline Container */}
        <div className="max-w-4xl mx-auto relative">
          {/* Desktop: Timeline line connecting all dots */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-px transition-all duration-500 opacity-60 ${
              isNightMode ? 'bg-gradient-to-b from-white/60 via-white/40 to-white/60' : 'bg-gradient-to-b from-[#C4985B] via-[#8B7355] to-[#C4985B]'
            } hidden md:block`}
            style={{
              top: '3rem', // Start from first dot
              height: 'calc(100% - 6rem)', // Go through entire container minus padding
              zIndex: 1
            }}
          />
          
          {/* Mobile: Timeline line connecting all cards */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 w-px transition-all duration-500 opacity-40 ${
              isNightMode ? 'bg-gradient-to-b from-white/50 via-white/30 to-white/50' : 'bg-gradient-to-b from-[#C4985B] via-[#8B7355] to-[#C4985B]'
            } md:hidden`}
            style={{
              top: '2rem',
              height: 'calc(100% - 4rem)',
              zIndex: 1
            }}
          />
          
          {/* Mobile: Timeline dots */}
          <div className="md:hidden">
            {itineraryItems.map((_, index) => (
              <div 
                key={index}
                className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 z-10"
                style={{
                  top: `${3 + (index * 24)}rem`, // Position dots at 3rem, 27rem, 51rem
                }}
              >
                <div className={`w-full h-full rounded-full border-2 shadow-lg transition-colors duration-500 ${
                  isNightMode ? 'bg-gray-800 border-white/60' : 'bg-white border-[#947e63]/60'
                }`}>
                  <div className={`absolute inset-1 rounded-full transition-colors duration-500 ${
                    isNightMode ? 'bg-white/20' : 'bg-[#947e63]/40'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Events */}
          <div className="space-y-24 md:space-y-32 relative z-10">
            {itineraryItems.map((item, index) => (
              <ItineraryItemCard key={index} item={item} index={index} />
            ))}
          </div>
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

        .celestial-transition {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes celestial-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(1deg); }
          50% { transform: translateY(-12px) rotate(0deg); }
          75% { transform: translateY(-6px) rotate(-1deg); }
        }

        @keyframes fade-celestial {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes sun-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-celestial-float {
          animation: celestial-float 6s ease-in-out infinite;
        }

        .animate-fade-celestial {
          animation: fade-celestial 4s ease-in-out infinite;
        }

        .animate-sun-rotate {
          animation: sun-rotate 20s linear infinite;
        }
      `}</style>
    </section>
  );
}