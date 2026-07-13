"use client"
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string, index: number, shape?: string } | null>(null);
  // Fix hydration error by removing window check in initial state
  const [centerIndex, setCenterIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  // Add useEffect to set initial centerIndex after component mounts
  useEffect(() => {
    // Set initial index based on screen size after component mounts
    if (window.innerWidth >= 768) {
      setCenterIndex(2);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            // Secuencia de animación
            // Paso 1: Extensión de la barra (inmediato)
            setAnimationStep(1);
            
            // Paso 2: Aparición del título y descripción desde la línea (después de 700ms)
            setTimeout(() => setAnimationStep(2), 700);
            
            // Paso 3: Resto de elementos (después de 1200ms)
            setTimeout(() => setAnimationStep(3), 1200);
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
  }, [isVisible]);

  // Observer para la cita de The Beatles
  useEffect(() => {
    const quoteObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !quoteVisible) {
            setQuoteVisible(true);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-50px'
      }
    );

    const currentQuoteRef = quoteRef.current;
    if (currentQuoteRef) {
      quoteObserver.observe(currentQuoteRef);
    }

    return () => {
      if (currentQuoteRef) {
        quoteObserver.unobserve(currentQuoteRef);
      }
    };
  }, [quoteVisible]);



  const photos = [
    { src: '/weddings/andrea/carousel/c-1.jpeg', alt: 'Andrea & Aldo - Recuerdo 1' },
    { src: '/weddings/andrea/carousel/c-2.jpeg', alt: 'Andrea & Aldo - Recuerdo 2' },
    { src: '/weddings/andrea/carousel/c-3.jpeg', alt: 'Andrea & Aldo - Recuerdo 3' },
    { src: '/weddings/andrea/carousel/c-4.jpeg', alt: 'Andrea & Aldo - Recuerdo 4' },
    { src: '/weddings/andrea/carousel/c-5.jpeg', alt: 'Andrea & Aldo - Recuerdo 5' },
    { src: '/weddings/andrea/carousel/c-6.jpeg', alt: 'Andrea & Aldo - Recuerdo 6' },
    { src: '/weddings/andrea/carousel/c-7.jpeg', alt: 'Andrea & Aldo - Recuerdo 7' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (galleryRef.current) {
        const container = galleryRef.current;
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        
      
        
        const centerX = scrollLeft + (containerWidth / 2);
        
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        for (let i = 0; i < photos.length; i++) {
          const cardElement = container.children[i] as HTMLElement;
          if (cardElement) {
            const cardLeft = cardElement.offsetLeft;
            const cardWidth = cardElement.offsetWidth;
            const cardCenter = cardLeft + (cardWidth / 2);
            
            const distance = Math.abs(centerX - cardCenter);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        
        setCenterIndex(closestIndex);
      }
    };

    const galleryElement = galleryRef.current;
    if (galleryElement) {
      galleryElement.addEventListener('scroll', handleScroll);
      
      const initialCheck = () => {
        setTimeout(handleScroll, 100);
        setTimeout(handleScroll, 500);
        setTimeout(handleScroll, 1000);
      };
      
      initialCheck();
      
      return () => {
        galleryElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [photos.length]);

  // Touch event listeners for debugging (removed console logs)
  useEffect(() => {
    const galleryElement = galleryRef.current;
    if (!galleryElement) return;

    const handleTouchStart = () => {
      // Touch start handler
    };

    const handleTouchMove = () => {
      // Touch move handler
    };

    const handleTouchEnd = () => {
      // Touch end handler
    };

    const handlePointerDown = () => {
      // Pointer down handler
    };

    const handlePointerMove = () => {
      // Pointer move handler
    };

    // Add all event listeners
    galleryElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    galleryElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    galleryElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    galleryElement.addEventListener('pointerdown', handlePointerDown);
    galleryElement.addEventListener('pointermove', handlePointerMove);

    // Also check for mouse events
    const handleMouseDown = () => {
      // Mouse down handler
    };

    galleryElement.addEventListener('mousedown', handleMouseDown);

    return () => {
      galleryElement.removeEventListener('touchstart', handleTouchStart);
      galleryElement.removeEventListener('touchmove', handleTouchMove);
      galleryElement.removeEventListener('touchend', handleTouchEnd);
      galleryElement.removeEventListener('pointerdown', handlePointerDown);
      galleryElement.removeEventListener('pointermove', handlePointerMove);
      galleryElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Check CSS properties (removed console logs)
  useEffect(() => {
    const galleryElement = galleryRef.current;
    if (!galleryElement) return;

    // Check for overlapping elements
    const rect = galleryElement.getBoundingClientRect();

    // Check for elements with higher z-index that might be blocking
    const allElements = document.querySelectorAll('*');
    const overlappingElements: Element[] = [];

    allElements.forEach(el => {
      const elStyles = window.getComputedStyle(el);
      const elZIndex = parseInt(elStyles.zIndex) || 0;
      
      if (elZIndex > 10 && el !== galleryElement && !galleryElement.contains(el)) {
        const elRect = el.getBoundingClientRect();
        // Check if it overlaps with gallery
        if (!(elRect.right < rect.left || 
              elRect.left > rect.right || 
              elRect.bottom < rect.top || 
              elRect.top > rect.bottom)) {
          overlappingElements.push(el);
        }
      }
    });

  }, [animationStep]);

  useEffect(() => {
            const centerImageWithPeek = () => {
          if (galleryRef.current) {
            const container = galleryRef.current;
            
            // Check if screen is medium or larger
            const isMediumOrLarger = window.innerWidth >= 768;
            const targetIndex = isMediumOrLarger ? 2 : 0; // Third photo (index 2) for md+, first photo for mobile
            
            // Update center index immediately
            setCenterIndex(targetIndex);
            
            setTimeout(() => {
              // Calculate responsive card dimensions
              const isLarge = window.innerWidth >= 1024; // lg breakpoint
              const cardWidth = isMediumOrLarger ? 384 : 256; // md:w-96 = 384px, w-64 = 256px
              const gap = isLarge ? 48 : (isMediumOrLarger ? 32 : 16); // lg:gap-12 = 48px, md:gap-8 = 32px, gap-4 = 16px
              const containerWidth = container.clientWidth;
              
              // Calculate scroll position to center the target image
              const scrollPosition = (targetIndex * (cardWidth + gap)) - (containerWidth / 2) + (cardWidth / 2);
              
              // Set scroll position
              container.scrollLeft = Math.max(0, scrollPosition);
              
              // Force a scroll event to ensure everything is in sync
              setTimeout(() => {
                const event = new Event('scroll');
                container.dispatchEvent(event);
              }, 50);
            }, 100);
          }
        };

    // Multiple attempts to ensure proper initialization
    const timer1 = setTimeout(centerImageWithPeek, 100);
    const timer2 = setTimeout(centerImageWithPeek, 500);
    const timer3 = setTimeout(centerImageWithPeek, 1000);
    
    // Handle window resize
    const handleResize = () => {
      centerImageWithPeek();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const openModal = (photo: { src: string, alt: string, shape: string }, index: number) => {
    setSelectedImage({ ...photo, index });
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const getCardStyle = (index: number, isCenterCard: boolean) => {
    const distance = Math.abs(index - centerIndex);
    
    if (isCenterCard) {
      return {
        transform: 'perspective(1000px) translateZ(80px) scale(1.1)',
        zIndex: 50,
        opacity: 1,
        filter: 'brightness(1.1) contrast(1.1) saturate(1.1)',
      };
    }
    
    if (distance === 1) {
      return {
        transform: 'perspective(1000px) translateZ(20px) scale(0.9)',
        zIndex: 40,
        opacity: 0.85,
        filter: 'brightness(0.95) contrast(1)',
      };
    }
    
    if (distance === 2) {
      return {
        transform: 'perspective(1000px) translateZ(-20px) scale(0.8)',
        zIndex: 30,
        opacity: 0.7,
        filter: 'brightness(0.9) contrast(0.95)',
      };
    }
    
    return {
      transform: 'perspective(1000px) translateZ(-60px) scale(0.7)',
      zIndex: 20,
      opacity: 0.5,
      filter: 'brightness(0.8) contrast(0.9)',
    };
  };



  return (
    <section 
      id="galeria"
      ref={sectionRef}
      className="min-h-screen w-full py-24 relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)'
      }}
    >


      {/* Enhanced organic texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] z-[2] pointer-events-none"> {/* DEBUG: Added pointer-events-none */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196, 152, 91, 0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 60%, rgba(139, 115, 85, 0.12) 0%, transparent 60%),
                              radial-gradient(circle at 50% 90%, rgba(180, 147, 113, 0.1) 0%, transparent 60%),
                              radial-gradient(circle at 20% 70%, rgba(155, 131, 102, 0.08) 0%, transparent 50%),
                              radial-gradient(circle at 80% 30%, rgba(212, 169, 113, 0.1) 0%, transparent 55%)`
          }}
        />
      </div>


      


      {/* Header and decorative elements with max-width */}
      <div className="max-w-6xl mx-auto relative z-10 px-4 md:px-8 pointer-events-none"> {/* DEBUG: Added pointer-events-none to header */}
        {/* Header with elegant styling */}
        <div className="text-center mb-16">
          


          {/* Flowers decoration above title */}
          <div className={`flex justify-center mb-6 transition-all duration-1000 ease-out ${
            animationStep >= 1 ? 'opacity-100 -translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <div className="w-68 h-24 relative">
              <Image
                src="/weddings/andrea/assets/legal_assets/flowers_s2.png"
                alt="Decorative flowers"
                fill
                className="object-contain"
                style={{
                  filter: 'sepia(20%) saturate(90%) hue-rotate(10deg) brightness(1.05)',
                  opacity: 0.8
                }}
              />
            </div>
          </div>

          {/* Main title - emerges upward from divider */}
          <div className="relative overflow-hidden">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.3em] uppercase text-[#5c5c5c] mb-2 garamond-300 relative transition-all duration-500 ease-out ${
              animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
              ¡Nos Casamos!
            </h2>
          </div>

          {/* Decorative line with extension animation - appears first */}
          <div className="flex justify-center mb-3">
            <div 
              className={`h-px bg-[#C4985B] opacity-60 transition-all duration-700 ease-out origin-left ${
                animationStep >= 1 ? 'w-60 scale-x-100' : 'w-60 scale-x-0'
              }`}
            ></div>
          </div>
          
          {/* Description - emerges downward from divider */}
          <div className="relative overflow-hidden">
            <p className={`text-lg md:text-xl font-light tracking-[0.1em] uppercase mb-4 text-[#8B7355] italic garamond-300 max-w-2xl mx-auto transition-all duration-500 ease-out ${
              animationStep >= 2 ? 'opacity-100 -translate-y-0' : 'opacity-0 -translate-y-6'
            }`}>
             Hoy, mañana y siempre, <br/> elegimos amarnos.
            </p>
          </div>
        </div>


      </div>

      {/* FULL WIDTH CAROUSEL - Outside of max-width container */}
      <div className={`relative w-screen transition-all duration-1200 ease-out ${
        animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`} style={{ 
        perspective: '1500px',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)'
      }}>
        
        {/* Left Navigation Arrow */}
        {centerIndex > 0 && (
          <button 
            onClick={() => {
              if (galleryRef.current) {
                galleryRef.current.scrollBy({
                  left: -300,
                  behavior: 'smooth'
                });
              }
            }}
            className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white text-[#8B7355] hover:text-[#C4985B] transition-all duration-300 p-3 rounded-full shadow-elegant hover:shadow-elegant-hover hover:scale-110"
            aria-label="Previous photo"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Full Width Carousel */}
        <div 
          ref={galleryRef}
          className="flex gap-4 md:gap-8 lg:gap-12 overflow-x-auto scrollbar-hide py-12"
          style={{
            scrollSnapType: 'x mandatory',
            scrollPadding: '0 1rem',
            transformStyle: 'preserve-3d',
            paddingLeft: 'calc(50vw - 12rem)',
            paddingRight: 'calc(50vw - 12rem)',
            // DEBUG: Add explicit touch-action
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch'
          }}
          onTouchStart={() => {
            // Carousel touch start handler
          }}
          onTouchMove={() => {
            // Carousel touch move handler
          }}
        >
          {photos.map((photo, index) => {
            const isCenterCard = index === centerIndex;
            const cardStyle = getCardStyle(index, isCenterCard);
            
            return (
              <div 
                key={index}
                className="flex-shrink-0 w-64 h-80 md:w-96 md:h-[28rem] overflow-hidden transition-all duration-700 ease-out cursor-pointer relative"
                style={{
                  scrollSnapAlign: 'center',
                  ...cardStyle,
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => {
                  openModal({ ...photo, shape: 'rectangle' }, index);
                }}
                onTouchStart={() => {
                  // Card touch start handler
                }}
              >
                <div className="relative h-full w-full transition-all duration-700 hover:scale-105">
                  {/* Enhanced depth effect for center card */}
                  {isCenterCard && (
                    <>
                      <div className="absolute -inset-8 bg-gradient-to-br from-[#C4985B]/20 via-[#D4C9B8]/15 to-[#8B7355]/20 blur-3xl pointer-events-none"></div>
                      <div className="absolute -inset-6 bg-gradient-to-br from-[#C4985B]/15 via-[#F8F6F3]/10 to-[#8B7355]/15 blur-2xl pointer-events-none"></div>
                      <div className="absolute -inset-4 bg-gradient-to-br from-[#C4985B]/15 to-[#8B7355]/15 blur-xl pointer-events-none"></div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-[#C4985B]/30 via-transparent to-[#8B7355]/30 pointer-events-none"></div>
                    </>
                  )}
                  
                  {/* Shadow effects for non-center cards */}
                  {!isCenterCard && (
                    <div 
                      className="absolute inset-0 bg-black/5 pointer-events-none"
                      style={{
                        boxShadow: '0 8px 32px rgba(139, 115, 85, 0.1), 0 4px 16px rgba(139, 115, 85, 0.05)'
                      }}
                    ></div>
                  )}
                  
                  {/* Image container */}
                  <div className="relative overflow-hidden h-full">
                    {isCenterCard && (
                      <div className="absolute -inset-2 bg-gradient-to-br from-stone-800/5 via-transparent to-stone-800/10 shadow-elegant pointer-events-none"></div>
                    )}
                    
                    <div className="relative w-full h-full bg-white overflow-hidden shadow-elegant">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="object-cover transition-all duration-700 pointer-events-none" // DEBUG: Added pointer-events-none to image
                        sizes="(max-width: 768px) 18rem, 24rem"
                        priority={index < 3}
                        style={{
                          filter: isCenterCard ? 'brightness(1.05) contrast(1.1) saturate(1.1)' : 'brightness(0.95) contrast(0.98) saturate(0.95)'
                        }}
                      />
                      
                      <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
                        isCenterCard 
                          ? 'bg-gradient-to-br from-transparent via-transparent to-[#8B7355]/5'
                          : 'bg-gradient-to-br from-stone-800/5 via-transparent to-stone-800/10'
                      }`}></div>
                      
                      {/* Tap indicator for center card */}
                      {isCenterCard && (
                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-elegant pointer-events-none">
                          <svg className="w-4 h-4 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      )}
                      
                      {isCenterCard && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Navigation Arrow */}
        {centerIndex < photos.length - 1 && (
          <button 
            onClick={() => {
              if (galleryRef.current) {
                galleryRef.current.scrollBy({
                  left: 300,
                  behavior: 'smooth'
                });
              }
            }}
            className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white text-[#8B7355] hover:text-[#C4985B] transition-all duration-300 p-3 rounded-full shadow-elegant hover:shadow-elegant-hover hover:scale-110"
            aria-label="Next photo"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Scroll indicator and bottom content with max-width */}
      <div className="max-w-6xl mx-auto relative z-10 px-4 md:px-8">
        {/* Enhanced scroll indicator */}
        <div className={`flex justify-center mt-8 space-x-3 transition-all duration-1000 ease-out ${
          animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '300ms' }}>
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (galleryRef.current) {
                  const card = galleryRef.current.children[index] as HTMLElement;
                  card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                  });
                }
              }}
              className={`transition-all duration-300 rounded-full ${
                index === centerIndex 
                  ? 'w-8 h-3 bg-gradient-to-r from-[#C4985B] to-[#8B7355] shadow-lg' 
                  : 'w-3 h-3 bg-stone-300 hover:bg-[#C4985B]/60'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>

        {/* Bottom quote */}
        <div 
          ref={quoteRef}
          className={`text-center mt-16 transition-all duration-1000 ease-out pointer-events-none ${
            quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative py-16 px-8">
            {/* Background image with realhands */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url('/weddings/andrea/assets/legal_assets/realhands_s2.png')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
                backgroundSize: 'contain',
                filter: 'sepia(60%) saturate(120%) hue-rotate(25deg) brightness(1.1) contrast(1.05)',
                opacity: 0.15,
              }}
            />
            {/* Text content */}
            <div className="relative z-10">
              <p className="text-lg text-stone-700 italic max-w-lg mx-auto garamond-300 leading-relaxed font-medium">
                &ldquo; A love like ours could never die, as long as I have you near me &rdquo;
                <br />
                <small>
                  - The Beatles, 1964
                </small>
              </p>
            </div>
          </div>
          

        </div>
      </div>

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeModal}
        >
          <button 
            className="absolute top-6 right-6 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-4 text-white transition-all duration-300 hover:scale-110 shadow-elegant"
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
            <div className="relative w-full h-full max-w-6xl max-h-full rounded-2xl overflow-hidden shadow-elegant">
              <Image 
                src={selectedImage.src} 
                alt={selectedImage.alt} 
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              />
            </div>
          </div>
        </div>
      )}

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

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
