"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import church from '../../assets/church.png';
import legalDocument from '../../assets/legal-document.png';
import nightClub from '../../assets/night-club.png';
import { useTheme } from '../context/ThemeContext';

interface ItineraryItem {
  time: string;
  displayTime: string;
  title: string;
  description: string;
  location?: string;
}

interface ItineraryItemCardProps {
  item: ItineraryItem;
  index: number;
}

export default function ItineraryItemCard({ item, index }: ItineraryItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const { isNightMode } = useTheme();
  const isRightSide = index % 2 !== 0;

  // Estados para el efecto de escritura
  const [displayedNumber, setDisplayedNumber] = useState('');
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedTime, setDisplayedTime] = useState('');
  const [displayedLocation, setDisplayedLocation] = useState('');
  const [displayedDescription, setDisplayedDescription] = useState('');
  const [showIcon, setShowIcon] = useState(false);
  const [showDivider, setShowDivider] = useState(false);
  const [showDots, setShowDots] = useState(false);



  // Función para crear efecto de escritura
  const typeWriter = (text: string, setter: (value: string) => void, delay: number = 50) => {
    return new Promise<void>((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        setter(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  };

  // Función para animar todos los elementos secuencialmente
  const animateCard = useCallback(async () => {
    // Reset todos los estados
    setDisplayedNumber('');
    setDisplayedTitle('');
    setDisplayedTime('');
    setDisplayedLocation('');
    setDisplayedDescription('');
    setShowIcon(false);
    setShowDivider(false);
    setShowDots(false);

    // Pequeño delay inicial
    await new Promise(resolve => setTimeout(resolve, 300));

    // 1. Número del evento
    const eventNumber = String(index + 1).padStart(2, '0');
    await typeWriter(eventNumber, setDisplayedNumber, 100);
    
    // 2. Mostrar icono con pequeño delay
    await new Promise(resolve => setTimeout(resolve, 200));
    setShowIcon(true);
    
    // 3. Título del evento
    await new Promise(resolve => setTimeout(resolve, 300));
    await typeWriter(item.title, setDisplayedTitle, 80);
    
    // 4. Mostrar línea divisoria
    await new Promise(resolve => setTimeout(resolve, 200));
    setShowDivider(true);
    
    // 5. Hora
    await new Promise(resolve => setTimeout(resolve, 300));
    await typeWriter(item.time, setDisplayedTime, 60);
    
    // 6. Ubicación (si existe)
    if (item.location) {
      await new Promise(resolve => setTimeout(resolve, 400));
      await typeWriter(item.location, setDisplayedLocation, 40);
    }
    
    // 7. Descripción (si existe)
    if (item.description && item.description.trim() !== "") {
      await new Promise(resolve => setTimeout(resolve, 400));
      await typeWriter(item.description, setDisplayedDescription, 30);
    }
    
    // 8. Puntos decorativos finales
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowDots(true);
  }, [index, item.title, item.time, item.location, item.description]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isCardVisible) {
            setIsCardVisible(true);
            // Iniciar animación de escritura después de que la card sea visible
            setTimeout(() => {
              animateCard();
            }, index * 200); // Delay escalonado para cada card
          }
        });
      },
      {
        threshold: 0.3, // Card debe estar 30% visible para activar
        rootMargin: '-50px' // Margen para activar un poco después
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [index, isCardVisible, animateCard]);

  const getAnimationClasses = () => {
    if (!isCardVisible) {
      if (index === 1) {
        return 'opacity-0 -translate-x-8 translate-y-12 scale-95';
      } else if (index === 2) {
        return 'opacity-0 translate-x-8 translate-y-12 scale-95';
      } else {
        return 'opacity-0 translate-y-12 scale-95';
      }
    } else {
      return 'opacity-100 translate-x-0 translate-y-0 scale-100';
    }
  };

  // Función para obtener el icono original según el evento
  const getEventIcon = () => {
    switch (item.title) {
      case 'Misa':
        return (
          <Image 
            src={church} 
            alt="Misa" 
            width={40} 
            height={40} 
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
          />
        );
      case 'Ceremonia':
        return (
          <Image 
            src={church} 
            alt="Ceremonia" 
            width={40} 
            height={40} 
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
          />
        );
      case 'Ceremonia Civil':
        return (
          <Image 
            src={legalDocument} 
            alt="Ceremonia Civil" 
            width={40} 
            height={40} 
            className="opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
          />
        );
      case 'Recepción':
        return (
          <Image 
            src={nightClub} 
            alt="Recepción" 
            width={40} 
            height={40} 
            className={`opacity-80 group-hover:opacity-100 transition-opacity duration-300 ${
              isNightMode ? 'brightness-0 invert' : 'brightness-0'
            }`} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-1000 ease-out ${getAnimationClasses()}`}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      {/* Timeline Dot */}
      <div className={`absolute left-1/2 top-12 transform -translate-x-1/2 w-8 h-8 z-10 hidden md:block transition-colors duration-500`}>
        <div className={`w-full h-full rounded-full border-4 shadow-lg transition-colors duration-500 ${
          isNightMode ? 'bg-gray-800 border-white/60' : 'bg-white border-[#947e63]/60'
        }`}>
          <div className={`absolute inset-2 rounded-full transition-colors duration-500 ${
            isNightMode ? 'bg-white/20' : 'bg-[#947e63]/40'
          }`}></div>

        </div>
      </div>

      {/* Event Card - Estilo Paul Allen */}
      <div className={`relative py-6 ${
        index === 0 ? 'md:w-3/4 md:-left-1/4' : 
        index === 1 ? 'md:w-3/4 md:left-1/2' : 
        index === 2 ? 'md:w-3/4 md:-left-1/4' : 
        `md:w-1/2 ${isRightSide ? 'md:left-1/2' : ''}`
      }`}>
        <div className={`w-full px-4 md:px-8 ${
          index === 0 ? 'md:w-[33rem] ml-auto' : 
          index === 1 ? 'md:w-[33rem]' : 
          index === 2 ? 'md:w-[33rem] ml-auto' : 
          `md:w-[22rem] ${!isRightSide ? 'ml-auto' : ''}`
        }`}>
          {/* Card con textura de cartón de huevo */}
          <div className={`rounded-lg overflow-hidden transition-all duration-700 transform hover:-translate-y-2 hover:scale-[1.01] group relative ${
            isNightMode 
              ? 'border border-white/20' 
              : 'border border-[#d4c4b0]/40'
          }`} style={{
            // Fondo base con color de cartón
            backgroundColor: isNightMode ? '#2a2a2a' : '#f0ebe5',
            // Textura de cartón sutil sin puntos
            backgroundImage: isNightMode 
              ? `
                linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.03) 100%),
                linear-gradient(45deg, rgba(255,255,255,0.01) 0%, rgba(0,0,0,0.02) 100%)
              `
              : `
                linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(139,115,85,0.05) 100%),
                linear-gradient(45deg, rgba(180,147,113,0.03) 0%, rgba(139,115,85,0.02) 100%)
              `,
            // Box shadow para profundidad de cartón de huevo
            boxShadow: isNightMode 
              ? `
                inset 2px 2px 4px rgba(0,0,0,0.3),
                inset -1px -1px 3px rgba(255,255,255,0.02),
                0 4px 8px rgba(0,0,0,0.4),
                0 1px 2px rgba(0,0,0,0.2)
              `
              : `
                inset 2px 2px 4px rgba(139,115,85,0.15),
                inset -1px -1px 3px rgba(255,255,255,0.4),
                0 4px 8px rgba(139,115,85,0.12),
                0 1px 2px rgba(139,115,85,0.08)
              `
          }}>
            
            {/* Content Section con overlay para mejorar legibilidad sobre textura */}
            <div className="p-12 md:p-16 relative text-center z-10">
              
              {/* Overlay sutil para mejorar legibilidad del texto sobre cartón */}
              <div className={`absolute inset-0 rounded-lg transition-all duration-500 ${
                isNightMode 
                  ? 'bg-gray-900/20' 
                  : 'bg-white/30'
              }`} style={{
                // Textura adicional de fibra de cartón
                backgroundImage: isNightMode
                  ? `
                    linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.01) 51%, transparent 52%),
                    linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.01) 50%, rgba(0,0,0,0.01) 51%, transparent 52%)
                  `
                  : `
                    linear-gradient(45deg, transparent 49%, rgba(139,115,85,0.02) 50%, rgba(139,115,85,0.02) 51%, transparent 52%),
                    linear-gradient(-45deg, transparent 49%, rgba(196,152,91,0.01) 50%, rgba(196,152,91,0.01) 51%, transparent 52%)
                  `,
                backgroundSize: '6px 6px, 8px 8px'
              }}></div>

              {/* Número de evento con efecto de escritura y mejor contraste */}
              <div className="mb-6 h-4 flex justify-center items-center relative z-20">
                <span className={`text-xs tracking-[0.2em] uppercase font-medium transition-colors duration-500 ${
                  isNightMode ? 'text-white/80' : 'text-[#5a4a3a]/80'
                }`} style={{
                  textShadow: isNightMode 
                    ? '0 1px 2px rgba(0,0,0,0.5)' 
                    : '0 1px 2px rgba(255,255,255,0.8)'
                }}>
                  {displayedNumber}
                  {displayedNumber && displayedNumber.length < String(index + 1).padStart(2, '0').length && (
                    <span className="animate-pulse">|</span>
                  )}
                </span>
              </div>

              {/* Icono original con textura de cartón y mejor sombra */}
              <div className="mb-8 h-16 flex justify-center items-center relative z-20">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full group-hover:scale-110 transition-all duration-500 ${
                  showIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`} style={{
                  backgroundColor: isNightMode ? '#1a1a1a' : '#e8ddd1',
                  backgroundImage: isNightMode
                    ? `
                      linear-gradient(45deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.05) 100%)
                    `
                    : `
                      linear-gradient(45deg, rgba(180,147,113,0.15) 0%, rgba(139,115,85,0.10) 100%)
                    `,
                  boxShadow: isNightMode
                    ? `
                      inset 1px 1px 3px rgba(0,0,0,0.4),
                      inset -1px -1px 2px rgba(255,255,255,0.03),
                      0 2px 4px rgba(0,0,0,0.3)
                    `
                    : `
                      inset 1px 1px 3px rgba(139,115,85,0.2),
                      inset -1px -1px 2px rgba(255,255,255,0.5),
                      0 2px 4px rgba(139,115,85,0.15)
                    `
                }}>
                  {getEventIcon()}
                </div>
              </div>

              {/* Título del evento con mejor contraste sobre cartón */}
              <div className="mb-8 h-12 md:h-16 flex justify-center items-center relative z-20">
                <h3 className={`text-2xl md:text-3xl font-light tracking-[0.15em] uppercase leading-tight transition-colors duration-500 ${
                  isNightMode ? 'text-white' : 'text-[#2c2826]'
                }`} style={{ 
                  fontFamily: 'Playfair Display, serif',
                  letterSpacing: '0.15em',
                  textShadow: isNightMode 
                    ? '0 2px 4px rgba(0,0,0,0.6)' 
                    : '0 1px 3px rgba(255,255,255,0.8)'
                }}>
                  {displayedTitle}
                  {displayedTitle && displayedTitle.length < item.title.length && (
                    <span className="animate-pulse">|</span>
                  )}
                </h3>
              </div>

              {/* Línea divisoria con textura */}
              <div className="flex justify-center mb-8 h-4 items-center relative z-20">
                <div className={`h-px transition-all duration-700 ${
                  showDivider ? 'w-16 opacity-100' : 'w-0 opacity-0'
                } ${isNightMode ? 'bg-white/40' : 'bg-[#8B7355]/60'}`} style={{
                  boxShadow: isNightMode 
                    ? '0 1px 2px rgba(0,0,0,0.4)' 
                    : '0 1px 2px rgba(255,255,255,0.6)'
                }}></div>
              </div>

              {/* Hora con mejor legibilidad */}
              <div className="mb-8 h-8 md:h-10 flex justify-center items-center relative z-20">
                <div className={`text-xl md:text-2xl font-light tracking-[0.1em] transition-colors duration-500 ${
                  isNightMode ? 'text-white/95' : 'text-[#3a342f]'
                }`} style={{ 
                  fontFamily: 'Playfair Display, serif',
                  textShadow: isNightMode 
                    ? '0 2px 4px rgba(0,0,0,0.6)' 
                    : '0 1px 3px rgba(255,255,255,0.7)'
                }}>
                  {displayedTime}
                  {displayedTime && displayedTime.length < item.time.length && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
              </div>

              {/* Ubicación con mejor contraste */}
              {item.location && (
                <div className="mb-8 min-h-[2rem] flex justify-center items-center relative z-20">
                  <div className={`text-sm md:text-base font-light tracking-[0.05em] leading-relaxed transition-colors duration-500 ${
                    isNightMode ? 'text-white/85' : 'text-[#5a4f45]'
                  }`} style={{ 
                    fontFamily: 'Inter, sans-serif',
                    textShadow: isNightMode 
                      ? '0 1px 2px rgba(0,0,0,0.5)' 
                      : '0 1px 2px rgba(255,255,255,0.6)'
                  }}>
                    {displayedLocation}
                    {displayedLocation && item.location && displayedLocation.length < item.location.length && (
                      <span className="animate-pulse">|</span>
                    )}
                  </div>
                </div>
              )}

              {/* Descripción con mejor legibilidad */}
              {item.description && item.description.trim() !== "" && (
                <div className="mt-6 min-h-[3rem] flex justify-center items-center relative z-20">
                  <p className={`text-sm font-light tracking-wide leading-relaxed max-w-sm mx-auto transition-colors duration-500 ${
                    isNightMode ? 'text-white/75' : 'text-[#6b5f52]'
                  }`} style={{ 
                    fontFamily: 'Inter, sans-serif',
                    textShadow: isNightMode 
                      ? '0 1px 2px rgba(0,0,0,0.5)' 
                      : '0 1px 2px rgba(255,255,255,0.6)'
                  }}>
                    {displayedDescription}
                    {displayedDescription && displayedDescription.length < item.description.length && (
                      <span className="animate-pulse">|</span>
                    )}
                  </p>
                </div>
              )}

              {/* Decoración inferior con línea */}
              <div className="mt-8 flex justify-center h-4 items-center relative z-20">
                <div className={`transition-all duration-500 ${
                  showDots ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}>
                  <div className={`w-12 h-px transition-colors duration-500 ${
                    isNightMode ? 'bg-white/40' : 'bg-[#8B7355]/60'
                  }`} style={{
                    boxShadow: isNightMode 
                      ? '0 1px 2px rgba(0,0,0,0.4)' 
                      : '0 1px 2px rgba(255,255,255,0.6)'
                  }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}