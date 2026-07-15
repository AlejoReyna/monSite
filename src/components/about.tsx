"use client";
import Image from "next/image";
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";

type AboutProps = {
  className?: string;
};

const skillCategories: Record<string, string[]> = {
  en: ['Frontend', 'Backend', 'DevOps & Cloud', 'Blockchain'],
  es: ['Frontend', 'Backend', 'DevOps & Cloud', 'Blockchain'],
  zh: ['前端', '后端', 'DevOps 与云', '区块链'],
};

export default function About({ className }: AboutProps) {
  const { language } = useLanguage();

  // Estados para animaciones
  const [isVisible, setIsVisible] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    experience: 0,
    projects: 0,
    technologies: 0
  });

  // Datos para las estadísticas
  const finalStats = useMemo(() => ({
    experience: 5,
    projects: 50,
    technologies: 15
  }), []);

  // Intersection Observer para activar animaciones cuando sea visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      observer.observe(aboutSection);
    }

    return () => observer.disconnect();
  }, []);

  // Animación de contadores
  useEffect(() => {
    if (!isVisible) return;

    const animateCounter = (key: keyof typeof finalStats, duration: number) => {
      const start = 0;
      const end = finalStats[key];
      const startTime = Date.now();

      const updateCounter = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        setAnimatedStats(prev => ({ ...prev, [key]: current }));
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    };

    // Iniciar animaciones con delays escalonados
    setTimeout(() => animateCounter('experience', 2000), 500);
    setTimeout(() => animateCounter('projects', 2500), 800);
    setTimeout(() => animateCounter('technologies', 2000), 1100);
  }, [isVisible, finalStats]);

  // Datos de habilidades técnicas
  const skills = useMemo(() => {
    const categories = skillCategories[language] ?? skillCategories.en;
    return [
      {
        category: categories[0],
        items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
        gradient: 'from-blue-500 to-cyan-400'
      },
      {
        category: categories[1], 
        items: ['Node.js', 'Ruby on Rails', 'PostgreSQL', 'MongoDB'],
        gradient: 'from-purple-500 to-indigo-400'
      },
      {
        category: categories[2],
        items: ['AWS', 'Docker', 'CI/CD', 'Kubernetes'],
        gradient: 'from-orange-500 to-red-400'
      },
      {
        category: categories[3],
        items: ['Solidity', 'Web3.js', 'Smart Contracts', 'DeFi'],
        gradient: 'from-yellow-500 to-orange-400'
      }
    ];
  }, [language]);

  return (
    <section 
      id="about-section"
      className={`relative min-h-screen overflow-hidden bg-transparent mt-20 ${className}`}
    >
      {/* Sin background separado - continúa el fondo del Hero */}

      {/* Efectos de partículas de fondo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-3000"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-0 md:py-0">
        
        {/* Header Section */}
        <div className="text-left mb-16 pt-20">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-mono tracking-tight transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              {t('aboutMe', language)}
            </span>
          </h2>
          
          <div className={`w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`}></div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Text Content */}
          <div className={`space-y-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            
            {/* Descripción principal */}
            <div className="space-y-6">
              <p className="text-lg lg:text-xl text-gray-300 leading-relaxed font-light">
                {t('aboutIntro', language)}
              </p>
              
              <p className="text-lg text-gray-400 leading-relaxed font-light">
                {t('aboutFocus', language)}
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-6 py-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {animatedStats.experience}+
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  {t('yearsExperience', language)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {animatedStats.projects}+
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  {t('projects', language)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                  {animatedStats.technologies}+
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">
                  {t('technologies', language)}
                </div>
              </div>
            </div>

            {/* Botón CTA */}
            <div className="pt-4">
              <a 
                href="#contact"
                className="cyberpunk-btn cyberpunk-btn-primary inline-flex items-center gap-2"
              >
                <span>{t('letsWorkTogether', language)}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Side - Skills & Image */}
          <div className={`space-y-8 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            
            {/* Profile Image */}
            <div className="relative w-64 h-64 mx-auto lg:w-80 lg:h-80">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative w-full h-full">
                <Image 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                  alt="Profile"
                  fill
                  className="rounded-full border-4 border-gray-700/50 object-cover"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20"></div>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill, index) => (
                <div 
                  key={skill.category}
                  className={`p-4 rounded-xl border border-gray-700/40 bg-gray-800/20 backdrop-blur-sm hover:bg-gray-800/40 transition-all duration-300 hover:scale-105 ${isVisible ? 'animate-[fadeInUp_0.6s_ease-out_forwards]' : 'opacity-0'}`}
                  style={{ animationDelay: `${1000 + index * 200}ms` }}
                >
                  <h4 className={`text-sm font-semibold mb-3 bg-gradient-to-r ${skill.gradient} bg-clip-text text-transparent uppercase tracking-wider`}>
                    {skill.category}
                  </h4>
                  <div className="space-y-1">
                    {skill.items.map((item) => (
                      <div key={item} className="text-xs text-gray-400 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${skill.gradient}`}></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos personalizados */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Reutilizar estilos de botones del Hero */
        .cyberpunk-btn {
          position: relative;
          padding: 1rem 2rem;
          border: 2px solid transparent;
          border-radius: 12px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          overflow: hidden;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        
        .cyberpunk-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }
        
        .cyberpunk-btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }
        
        .cyberpunk-btn-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 1;
          z-index: -2;
        }
        
        .cyberpunk-btn-primary:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4), 0 0 0 2px rgba(118, 75, 162, 0.3);
        }
        
        .cyberpunk-btn-primary:hover::before {
          opacity: 1;
        }

        .cyberpunk-btn span {
          position: relative;
          z-index: 10;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .cyberpunk-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .cyberpunk-btn {
            padding: 0.9rem 1.8rem;
            font-size: 0.9rem;
            border-radius: 10px;
          }
        }
      `}</style>
    </section>
  );
}
