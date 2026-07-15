"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";
import type { Language } from "@/components/lang-context";

type Service = {
  title: string;
  description: string;
  highlights: string[];
  gradientFromTo: string;
  icon: (props: { className?: string }) => ReactElement;
};

const servicesEs: Service[] = [
  {
    title: "Web Apps",
    description:
      "Aplicaciones modernas con Next.js, React y TypeScript: rápidas, accesibles y escalables.",
    highlights: ["SSR/SSG", "Rendimiento", "Accesibilidad"],
    gradientFromTo: "from-sky-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M3 9h18M7 13h10M9 17h6" />
      </svg>
    ),
  },
  {
    title: "UI/UX & Interacciones",
    description:
      "Interfaces limpias con micro-interacciones y transiciones fluidas para experiencias memorables.",
    highlights: ["Animaciones", "Design Systems", "Responsive"],
    gradientFromTo: "from-violet-500/20 to-fuchsia-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h10M4 17h7" />
      </svg>
    ),
  },
  {
    title: "APIs & Backends",
    description:
      "APIs robustas con Node.js y mejores prácticas: autenticación, caching y escalabilidad.",
    highlights: ["REST/GraphQL", "Auth", "Observabilidad"],
    gradientFromTo: "from-amber-500/20 to-orange-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m9-9H3" />
      </svg>
    ),
  },
  {
    title: "Performance & SEO",
    description:
      "Auditorías y optimización de Core Web Vitals para mejorar ranking y conversión.",
    highlights: ["CWV", "Lighthouse 95+", "SEO técnico"],
    gradientFromTo: "from-emerald-500/20 to-teal-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l7-9 7 9-7 9-7-9z" />
      </svg>
    ),
  },
  {
    title: "E2E Integrations",
    description:
      "Integraciones de terceros (Stripe, Supabase, CMS) con seguridad y DX impecable.",
    highlights: ["Stripe", "CMS", "Supabase"],
    gradientFromTo: "from-indigo-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h12M6 12l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "Consultoría",
    description:
      "Mentoría técnica, code reviews y roadmap para acelerar tu producto.",
    highlights: ["Arquitectura", "Mejores prácticas", "Escalabilidad"],
    gradientFromTo: "from-pink-500/20 to-rose-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h8m-8 4h5M5 21l2-4h10l2 4M12 3v4" />
      </svg>
    ),
  },
];

const servicesEn: Service[] = [
  {
    title: "Web Apps",
    description:
      "Modern apps with Next.js, React and TypeScript: fast, accessible and scalable.",
    highlights: ["SSR/SSG", "Performance", "Accessibility"],
    gradientFromTo: "from-sky-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M3 9h18M7 13h10M9 17h6" />
      </svg>
    ),
  },
  {
    title: "UI/UX & Interactions",
    description:
      "Clean interfaces with micro‑interactions and smooth transitions for memorable experiences.",
    highlights: ["Animations", "Design Systems", "Responsive"],
    gradientFromTo: "from-violet-500/20 to-fuchsia-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h10M4 17h7" />
      </svg>
    ),
  },
  {
    title: "APIs & Backends",
    description:
      "Robust APIs with Node.js and best practices: authentication, caching and scalability.",
    highlights: ["REST/GraphQL", "Auth", "Observability"],
    gradientFromTo: "from-amber-500/20 to-orange-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m9-9H3" />
      </svg>
    ),
  },
  {
    title: "Performance & SEO",
    description:
      "Audits and Core Web Vitals optimization to improve ranking and conversion.",
    highlights: ["CWV", "Lighthouse 95+", "Technical SEO"],
    gradientFromTo: "from-emerald-500/20 to-teal-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l7-9 7 9-7 9-7-9z" />
      </svg>
    ),
  },
  {
    title: "E2E Integrations",
    description:
      "Third‑party integrations (Stripe, Supabase, CMS) with security and great DX.",
    highlights: ["Stripe", "CMS", "Supabase"],
    gradientFromTo: "from-indigo-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h12M6 12l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "Consulting",
    description:
      "Technical mentoring, code reviews and roadmap to accelerate your product.",
    highlights: ["Architecture", "Best practices", "Scalability"],
    gradientFromTo: "from-pink-500/20 to-rose-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h8m-8 4h5M5 21l2-4h10l2 4M12 3v4" />
      </svg>
    ),
  },
];

const servicesZh: Service[] = [
  {
    title: "Web Apps",
    description:
      "使用 Next.js、React 和 TypeScript 构建的现代应用：快速、可访问且可扩展。",
    highlights: ["SSR/SSG", "性能", "可访问性"],
    gradientFromTo: "from-sky-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M3 9h18M7 13h10M9 17h6" />
      </svg>
    ),
  },
  {
    title: "UI/UX 与交互",
    description:
      "干净的界面，搭配微交互和流畅过渡，打造令人难忘的体验。",
    highlights: ["动画", "设计系统", "响应式"],
    gradientFromTo: "from-violet-500/20 to-fuchsia-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h10M4 17h7" />
      </svg>
    ),
  },
  {
    title: "API 与后端",
    description:
      "使用 Node.js 和最佳实践构建稳健的 API：认证、缓存和可扩展性。",
    highlights: ["REST/GraphQL", "认证", "可观测性"],
    gradientFromTo: "from-amber-500/20 to-orange-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m9-9H3" />
      </svg>
    ),
  },
  {
    title: "性能与 SEO",
    description:
      "审计并优化 Core Web Vitals，以提升排名和转化率。",
    highlights: ["CWV", "Lighthouse 95+", "技术 SEO"],
    gradientFromTo: "from-emerald-500/20 to-teal-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l7-9 7 9-7 9-7-9z" />
      </svg>
    ),
  },
  {
    title: "端到端集成",
    description:
      "第三方集成（Stripe、Supabase、CMS），注重安全性和出色的开发者体验。",
    highlights: ["Stripe", "CMS", "Supabase"],
    gradientFromTo: "from-indigo-500/20 to-cyan-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h12M6 12l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "咨询",
    description:
      "技术指导、代码审查和路线图，加速你的产品落地。",
    highlights: ["架构", "最佳实践", "可扩展性"],
    gradientFromTo: "from-pink-500/20 to-rose-500/10",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9h8m-8 4h5M5 21l2-4h10l2 4M12 3v4" />
      </svg>
    ),
  },
];

const servicesByLang: Record<Language, Service[]> = {
  en: servicesEn,
  es: servicesEs,
  zh: servicesZh,
};

export default function Services() {
  const { language } = useLanguage();
  const services = servicesByLang[language];
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(
    () => new Array(services.length).fill(false)
  );

  useEffect(() => {
    setVisibleCards(new Array(services.length).fill(false));
  }, [services]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cardElements = Array.from(
      section.querySelectorAll<HTMLDivElement>("[data-service-card]")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute("data-index");
          if (!indexAttr) return;
          const index = Number(indexAttr);
          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
    );

    cardElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [services]);

  return (
    <section
      id="services"
      className="relative overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black py-28 sm:py-32"
    >
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-12 h-96 w-96 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/10 blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-16 -right-12 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-fuchsia-600/20 to-rose-600/10 blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite 2s" }}
        />
      </div>

      {/* Heading */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            {t('services', language)}
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
          {t('servicesLead', language)}
        </p>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Grid */}
      <div ref={sectionRef} className="relative z-10 mx-auto mt-14 max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const isVisible = visibleCards[index];
            const translateY = isVisible ? 0 : 40;
            const opacity = isVisible ? 1 : 0;
            const delay = `${index * 80}ms`;

            return (
              <div
                key={service.title}
                data-service-card
                data-index={index}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.05] hover:shadow-2xl glow-ring"
                style={{
                  transform: `translateY(${translateY}px)` ,
                  opacity,
                  transition: `opacity 700ms cubic-bezier(0.4,0,0.2,1) ${delay}, transform 700ms cubic-bezier(0.4,0,0.2,1) ${delay}`,
                }}
              >
                {/* Gradient background */}
                <div
                  className={`pointer-events-none absolute inset-0 opacity-50 ${service.gradientFromTo} bg-gradient-to-br transition-opacity duration-300 group-hover:opacity-80`}
                />

                {/* Hover ring */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Icon */}
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 shadow-inner shadow-white/5 transition-colors group-hover:text-white will-change-transform group-hover:scale-105"
                       style={{ transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)' }}>
                    {service.icon({ className: "h-6 w-6" })}
                  </div>
                </div>

                {/* Content */}
                <h3 className="relative z-10 text-lg font-semibold text-white sm:text-xl">
                  {service.title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-relaxed text-gray-300 sm:text-base">
                  {service.description}
                </p>

                {/* Highlights */}
                <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                  {service.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="relative z-10 mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-all group-hover:text-white">
                  <span>{t('moreInfo', language)}</span>
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-18px) scale(1.04);
            opacity: 0.25;
          }
        }
      `}</style>
    </section>
  );
}
