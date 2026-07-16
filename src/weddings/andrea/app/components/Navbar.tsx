"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '../context/ThemeContext';

interface NavigationItem {
  id: string;
  label: string;
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isInFooterSection, setIsInFooterSection] = useState(false);
  const [isInRSVPSection, setIsInRSVPSection] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isNightMode } = useTheme();
  
  const navigationItems: NavigationItem[] = [
    { id: 'galeria', label: 'Galería' },
    { id: 'itinerario', label: 'Itinerario' },
    { id: 'ubicacion', label: 'Ubicación' },
    { id: 'dresscode', label: 'Dress Code' },
    { id: 'regalos', label: 'Mesa de regalos' },
    { id: 'rsvp', label: 'Confirmar' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Lógica para ocultar/mostrar la navbar al hacer scroll
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setIsMobileMenuOpen(false);
      } else {
        setIsVisible(true);
      }

      // Lógica para el fondo de la navbar
      const heroSection = document.getElementById('hero-section');
      const footerSection = document.getElementById('footer');
      const rsvpSection = document.getElementById('rsvp');

      if (heroSection && footerSection) {
        const heroRect = heroSection.getBoundingClientRect();
        const footerRect = footerSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Se considera que se ha hecho scroll cuando la parte inferior de la sección hero está por encima de la navbar (100px)
        setIsScrolled(heroRect.bottom < 100);

        // Es transparente si el inicio del footer está a menos del 80% de la altura de la ventana
        const isFooterVisible = footerRect.top < windowHeight * 0.8;
        setIsInFooterSection(isFooterVisible);

        // RSVP Section
        if (rsvpSection) {
          const rsvpRect = rsvpSection.getBoundingClientRect();
          let isRSVPVisible = false;
          if (rsvpRect.bottom > 0 && rsvpRect.top < windowHeight) {
            const visibleTop = Math.max(0, rsvpRect.top);
            const visibleBottom = Math.min(windowHeight, rsvpRect.bottom);
            const actualVisibleHeight = visibleBottom - visibleTop;
            const rsvpSixtyPercent = rsvpRect.height * 0.6;
            const requiredHeight = Math.min(rsvpSixtyPercent, windowHeight);
            isRSVPVisible = actualVisibleHeight >= requiredHeight;
          }
          setIsInRSVPSection(isRSVPVisible);
        } else {
          setIsInRSVPSection(false);
        }


        
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Llamar una vez al inicio para establecer el estado inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Función para determinar el estilo basado en el estado de scroll y modo nocturno
      const getNavbarStyle = () => {
      let style;
      // Priorizar el estilo transparente en hero, RSVP y footer, independientemente del modo nocturno
      if (isInRSVPSection || isInFooterSection || !isScrolled) {
        // En secciones especiales, siempre transparente
        style = 'bg-white/10 hover:bg-white/15';
      } else if (isNightMode) {
        // Aplicar modo nocturno solo cuando no estamos en las secciones especiales
        style = 'bg-black/95 shadow-lg hover:bg-black';
      } else {
        // En todas las demás secciones, es blanco
      style = 'bg-white/95 shadow-lg hover:bg-white';
    }
    
    return style;
  };

  const getTextStyle = () => {
    if (isNightMode) {
      return 'text-white/70 hover:text-white';
    }
    
    // En la sección RSVP, Footer o Hero, usar texto blanco
    if (isInRSVPSection || isInFooterSection || !isScrolled) {
      return 'text-white/60 hover:text-white';
    }
    
    // En todas las demás secciones, usar texto oscuro
    return 'text-[#543c24]/70 hover:text-[#543c24]';
  };

  const getLineStyle = () => {
    if (isNightMode) {
      return 'bg-white';
    }
    
    // En la sección RSVP, Footer o Hero, usar línea blanca
    if (isInRSVPSection || isInFooterSection || !isScrolled) {
      return 'bg-white';
    }
    
    // En todas las demás secciones, usar línea oscura
    return 'bg-[#543c24]';
  };

  const getDecorativeLineStyle = () => {
    if (isNightMode) {
      return 'bg-white/30';
    }
    
    // En la sección RSVP, Footer o Hero, usar línea decorativa blanca
    if (isInRSVPSection || isInFooterSection || !isScrolled) {
      return 'bg-white/30';
    }
    
    // En todas las demás secciones, usar línea decorativa oscura
    return 'bg-[#543c24]/30';
  };

  // Función para determinar qué logo usar según la sección y modo nocturno
  const getLogoSrc = () => {
    // En modo nocturno, siempre usar IMG_0340.PNG
    if (isNightMode) {
      return '/weddings/andrea/assets/logos/IMG_0340.PNG';
    }
    
    // En modo normal: Logo IMG_0340.PNG para hero (cuando no ha scrolled), RSVP y Footer
    if (!isScrolled || isInRSVPSection || isInFooterSection) {
      return '/weddings/andrea/assets/logos/IMG_0340.PNG';
    }
    
    // Logo IMG_0342.PNG para todas las demás secciones en modo normal
    return '/weddings/andrea/assets/logos/IMG_0342.PNG';
  };

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);
    // Pequeño delay para permitir que la animación del menú termine
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 backdrop-blur-sm transition-all duration-500 ${getNavbarStyle()} ${
      isVisible ? 'transform translate-y-0' : 'transform -translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Desktop Navigation - Pantallas grandes */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            <div className="w-8 h-8 relative">
              <Image
                src={getLogoSrc()}
                alt="Logo"
                fill
                className="object-contain transition-all duration-500"
                sizes="32px"
              />
            </div>
          </div>
          
          {/* Navegación centrada */}
          <ul className="flex items-center justify-center space-x-8 xl:space-x-12 flex-1">
            {navigationItems.map((item, index) => (
              <li key={item.id} className="flex items-center">
                <a
                  href={`#${item.id}`}
                  className={`text-xs garamond-300 tracking-[0.25em] transition-all duration-500 relative group px-2 py-1 ${getTextStyle()}`}
                >
                  {item.label.toUpperCase()}
                  <span className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-[1px] group-hover:w-3/4 transition-all duration-500 ${getLineStyle()}`}></span>
                </a>
                {/* Separador decorativo entre elementos (excepto el último) */}
                {index < navigationItems.length - 1 && (
                  <div className={`ml-6 xl:ml-8 w-1 h-1 rounded-full transition-colors duration-500 ${getDecorativeLineStyle()}`}></div>
                )}
              </li>
            ))}
          </ul>
          
          {/* Espacio para balancear */}
          <div className="w-8 h-8"></div>
        </div>

        {/* Mobile Navigation - MD and above */}
        <div className="hidden md:flex lg:hidden items-center justify-between">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            <div className="w-8 h-8 relative">
              <Image
                src={getLogoSrc()}
                alt="Logo"
                fill
                className="object-contain transition-all duration-500"
                sizes="32px"
              />
            </div>
          </div>
          
          {/* Solo elementos principales en móvil md+ */}
          <ul className="flex items-center space-x-3 sm:space-x-4 text-xs flex-1 justify-center">
            {navigationItems.slice(0, 4).map((item, index) => (
              <li key={item.id} className="flex items-center">
                <a 
                  href={`#${item.id}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.id);
                  }}
                  className={`garamond-300 tracking-[0.1em] sm:tracking-[0.15em] transition-colors duration-500 px-1 ${getTextStyle()}`}
                >
                  {item.label.toUpperCase()}
                </a>
                {index < 3 && (
                  <span className={`ml-2 sm:ml-3 transition-colors duration-500 ${
                    isNightMode ? 'text-white/30' : 
                    (!isScrolled || isInFooterSection || isInRSVPSection ? 'text-white/30' : 'text-[#543c24]/30')
                  }`}>·</span>
                )}
              </li>
            ))}
          </ul>
          
          {/* Botón de menú hamburguesa para elementos secundarios */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`ml-4 p-2 transition-colors duration-500 ${getTextStyle()}`}
            aria-label="Menú adicional"
          >
            <div className="flex flex-col space-y-1">
              <div className={`w-4 h-0.5 transition-all duration-300 ${getLineStyle()} ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-4 h-0.5 transition-all duration-300 ${getLineStyle()} ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-4 h-0.5 transition-all duration-300 ${getLineStyle()} ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Small Mobile Navigation - Solo logo y hamburguesa */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 relative">
              <Image
                src={getLogoSrc()}
                alt="Logo"
                fill
                className="object-contain transition-all duration-500"
                sizes="32px"
              />
            </div>
          </div>
          
          {/* Botón de menú hamburguesa */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 transition-colors duration-500 ${getTextStyle()}`}
            aria-label="Menú de navegación"
          >
            <div className="flex flex-col space-y-1.5">
              <div className={`w-6 h-0.5 transition-all duration-300 ${getLineStyle()} ${
                isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}></div>
              <div className={`w-6 h-0.5 transition-all duration-300 ${getLineStyle()} ${
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}></div>
              <div className={`w-6 h-0.5 transition-all duration-300 ${getLineStyle()} ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}></div>
            </div>
          </button>
        </div>

        {/* TEMPORALMENTE COMENTADO PARA DEBUG - Menú móvil desplegable para MD+ */}
        {/* <div className={`hidden md:block lg:hidden absolute top-full left-0 right-0 transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}>
        </div> */}

        {/* Menú móvil elegante para SM - 50% ancho - CONTENEDOR UNIFICADO */}
        <div className={`md:hidden fixed top-0 right-0 w-1/2 transition-all duration-500 ease-out z-50 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } border-l border-[#543c24]/20 bg-white p-6`}
        style={{
          backgroundColor: 'white !important',
          height: '100vh',
          minHeight: '100vh'
        }}
        >
          
          {/* Header del menú */}
          <div className="flex items-center justify-between mb-8 border-b border-[#543c24]/10 pb-6">
            <h2 className="text-sm garamond-300 tracking-[0.2em] text-[#543c24]/70">
              MENÚ
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-[#543c24]/70 hover:text-[#543c24]"
              aria-label="Cerrar menú"
            >
              <div className="relative w-5 h-5">
                <div className="absolute top-1/2 left-0 w-full h-0.5 rotate-45 bg-[#543c24]"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 -rotate-45 bg-[#543c24]"></div>
              </div>
            </button>
          </div>
          
          {/* Lista de navegación */}
          <ul className="space-y-6 flex-1">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.id);
                  }}
                  className="block text-sm garamond-300 tracking-[0.2em] py-3 border-b border-[#543c24]/10 group text-[#543c24]/60 hover:text-[#543c24]"
                >
                  <span className="relative">
                    {item.label.toUpperCase()}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-500 bg-[#543c24]"></span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          
          {/* Elemento decorativo en el footer - posicionado al final */}
          <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-[#543c24]/10">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-[#543c24]/30"></div>
              <div className="w-8 h-0.5 bg-[#543c24]/30"></div>
              <div className="w-1 h-1 rounded-full bg-[#543c24]/30"></div>
            </div>
          </div>
        </div>

        {/* Overlay para cerrar el menú en SM */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-500"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>

      <style jsx>{`
        .garamond-300 {
          font-family: 'EB Garamond', serif;
          font-weight: 300;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
