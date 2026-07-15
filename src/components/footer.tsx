"use client";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";

export default function Footer() {
  const { language } = useLanguage();

  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-black via-gray-950 to-black">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-12 h-80 w-80 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-600/10 blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-24 right-12 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-rose-600/10 blur-3xl"
          style={{ animation: "float 8s ease-in-out infinite 2s" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {/* Brand (simplified) */}
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="flex items-center font-mono text-lg font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent transition-all duration-200">
                  Alexis&#39; desktop
                </span>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
              {t('footerTagline', language)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Next.js", "TypeScript", "React", "Node.js"].map((t2) => (
                <span
                  key={t2}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300 backdrop-blur-sm"
                >
                  {t2}
                </span>
              ))}
            </div>
          </div>

          {/* Compact: Contact + Social in one row */}
          <div className="flex flex-col justify-center">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              {t('contactAndSocial', language)}
            </h4>

            <div className="mt-3 flex flex-col gap-3">
              {/* Contact line */}
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <a className="hover:text-white" href="#contact">
                  {t('form', language)}
                </a>
                <span className="text-white/20">•</span>
                <a className="hover:text-white" href="mailto:hello@example.com">
                  hello@example.com
                </a>
              </div>

              {/* Social line */}
              <div className="flex items-center gap-3">
                <a
                  aria-label="GitHub"
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-gray-300 transition-colors hover:text-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58V20.9c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.57.12-3.27 0 0 1.01-.32 3.3 1.23a11.48 11.48 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.7.24 2.96.12 3.27.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.61-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0012 .5z" />
                  </svg>
                </a>

                <a
                  aria-label="LinkedIn"
                  href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-gray-300 transition-colors hover:text-white"
                >
                  <img src="/LinkedIn_icon.svg" alt="LinkedIn" className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar (no "All rights reserved") */}
        <div className="mt-10 flex items-center justify-center border-t border-white/10 py-6 text-sm text-gray-400">
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
            {t('backToTop', language)}
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-14px) scale(1.03);
            opacity: 0.25;
          }
        }
      `}</style>
    </footer>
  );
}
