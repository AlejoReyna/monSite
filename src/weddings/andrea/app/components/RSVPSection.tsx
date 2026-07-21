"use client"
import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp, FaCalendarPlus } from 'react-icons/fa';
import DisabledRsvpButton from '@/weddings/shared/disabled-rsvp-button';
import MessageSection from './MessageSection';
import { useStatusBarSection } from '../../hooks/useStatusBarManager';
import { useTheme } from '../context/ThemeContext';

export default function RSVPSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Obtener el estado del tema
  const { isNightMode } = useTheme();
  
  // Hook para cambiar el color del status bar cuando RSVP está visible
  const rsvpSectionRef = useStatusBarSection({
    sectionId: 'rsvp',
    color: '#4c4c48', // Mismo color que Hero section
    defaultColor: isNightMode ? '#000000' : '#ffffff', // Color basado en el tema
    isNightMode // Pasar el estado del tema
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '-20px'
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Decorative floral elements matching the project style
  const FloralDecoration = ({ className = "" }) => (
    <svg className={`w-full h-full ${className}`} viewBox="0 0 80 80" fill="none">
      <path 
        d="M10,40 Q25,20 40,40 Q55,60 70,40 Q55,20 40,40 Q25,60 10,40" 
        stroke="rgba(255,255,255,0.6)" 
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      <path d="M25,35 Q30,25 35,35 Q30,45 25,35" fill="rgba(255,255,255,0.5)" opacity="0.5"/>
      <path d="M45,45 Q50,35 55,45 Q50,55 45,45" fill="rgba(255,255,255,0.4)" opacity="0.4"/>
      <circle cx="40" cy="40" r="2.5" fill="rgba(255,255,255,0.6)" opacity="0.6"/>
      <circle cx="32" cy="38" r="1" fill="rgba(255,255,255,0.4)" opacity="0.4"/>
      <circle cx="48" cy="42" r="1" fill="rgba(255,255,255,0.4)" opacity="0.4"/>
    </svg>
  );

  const addToCalendar = () => {
    const startDate = '20241018T170000';
    const endDate = '20241019T020000';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wedding Invitation//Event//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      'SUMMARY:Boda de Andrea y Aldo',
      'DESCRIPTION:Celebración de la boda de Andrea y Aldo',
      'LOCATION:Montemorelos, N.L.',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'DESCRIPTION:Recordatorio: Boda de Andrea y Aldo mañana',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'boda-andrea-aldo.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  };

  return (
    <section 
      // eslint-disable-next-line react-hooks/immutability
      ref={(el) => {
        sectionRef.current = el as HTMLDivElement;
        if (rsvpSectionRef) {
          // eslint-disable-next-line react-hooks/immutability
          (rsvpSectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-12"
      style={{
        backgroundImage: `url('/weddings/andrea/carousel/c-1.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Elegant overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-black/10 to-black/20"></div>
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 70%),
                              radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Side decorative elements */}
      <div className="absolute left-8 top-1/4 w-16 h-16 opacity-20 hidden lg:block">
        {/* eslint-disable-next-line react-hooks/static-components */}
        <FloralDecoration />
      </div>
      
      <div className="absolute right-8 bottom-1/4 w-16 h-16 opacity-20 hidden lg:block">
        {/* eslint-disable-next-line react-hooks/static-components */}
        <FloralDecoration className="transform rotate-180" />
      </div>

      {/* Main Container with Grid Layout */}
      <div className="max-w-7xl mx-auto relative z-10 px-4 w-full">
        
        {/* Header Section - simplified */}
        <div className={`text-center mb-16 transition-all duration-2000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`} style={{ transitionDelay: '200ms' }}>
        </div>

        {/* Grid Layout: 1 row, 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 items-start">
          
          {/* Left Column: Text Content */}
          <div className={`flex flex-col justify-center min-h-[60vh] transition-all duration-2000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            
            {/* Main message */}
            <div className="text-center">
              {/* Confirma tu asistencia title */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.3em] uppercase text-white  garamond-300 relative">
                CONFIRMA TU ASISTENCIA
              </h2>
            
            </div>

            {/* Content without card container */}
            <div className="p-8 md:p-10 text-center relative">
              
              {/* Welcome message */}
              <p className="text-lg md:text-xl font-light text-white/90 tracking-wide mb-8 garamond-300">
                Para nosotros es muy importante tu presencia es por eso que te pedimos confirmar tu asistencia antes del 15 de septiembre.
              </p>
              
              <p className="text-lg md:text-xl font-light text-white/90 tracking-wide mb-8 garamond-300">
                ¡Te esperamos!
              </p>
              
              
              {/* Buttons */}
              <div className="flex flex-col gap-4 items-center">
                <DisabledRsvpButton
                  className="group inline-flex items-center gap-3 px-8 py-3 bg-white/15 backdrop-blur-md border border-white/30 text-white font-light tracking-[0.1em] hover:bg-white/25 hover:border-white/50 transition-all duration-400 relative overflow-hidden garamond-300 uppercase text-sm shadow-lg w-full justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <FaWhatsapp className="text-lg relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Confirmar por WhatsApp</span>
                </DisabledRsvpButton>
                
                <button 
                  className="group inline-flex items-center gap-3 px-8 py-3 bg-white/15 backdrop-blur-md border border-white/30 text-white font-light tracking-[0.1em] hover:bg-white/25 hover:border-white/50 transition-all duration-400 relative overflow-hidden garamond-300 uppercase text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full justify-center"
                  onClick={addToCalendar}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <FaCalendarPlus className="text-lg relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10">Agendar en Calendario</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center Column: Empty space for the couple */}
          <div className="hidden lg:block">
            {/* Espacio libre para mostrar la pareja */}
          </div>

          {/* Right Column: Message Block */}
          <div className={`transition-all duration-2000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '800ms' }}>
            <MessageSection />
          </div>
        </div>


      </div>

      <style jsx>{`
        .shadow-elegant {
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 20px 25px -5px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        
        .shadow-elegant-hover {
          box-shadow: 
            0 10px 15px -3px rgba(0, 0, 0, 0.4),
            0 25px 50px -12px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </section>
  );
}