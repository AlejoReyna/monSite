"use client";

import { Fragment, useEffect, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { useNavigation } from "@/contexts/navigation-context";
import { t } from "@/lib/translations";
import Image from "next/image";

export default function Navbar() {
  const { language } = useLanguage();
  const { navigateToSection, currentSection } = useNavigation();
  // Removed unused isScrolled state variable
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Removed unused scroll effect that was setting isScrolled

  // Update time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* macOS-style Top Menu Bar - visible on all breakpoints (match md view) */}
      <div className="fixed inset-x-0 top-0 z-[70] flex h-7 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex w-full items-center justify-between px-4">
          {/* Left side - App name */}
          <div className="flex items-center">
            <span className="text-white/90 text-sm font-bold">Alexis&#39; desktop</span>
          </div>

          {/* Center - Current section indicator */}
          <div className="flex items-center">
            <span className="text-white/70 text-xs font-mono">
              {currentSection === "home" && t('navHome', language)}
              {currentSection === "services" && t('services', language)}
              {currentSection === "projects" && t('projects', language)}
              {currentSection === "contact" && t('contact', language)}
            </span>
          </div>

          {/* Right side - System icons */}
          <div className="flex items-center gap-3">
            {/* WiFi icon */}
            <svg className="w-4 h-4 text-white/70 hover:text-white transition-colors cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            
            {/* Battery icon */}
            <svg className="w-4 h-4 text-white/70 hover:text-white transition-colors cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            </svg>

            {/* Time */}
            <span className="text-white/70 text-xs font-mono tabular-nums">
              {currentTime
                ? currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "--:--"}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop macOS-style Sidebar */}
      <aside className="hero-sidebar hidden lg:fixed lg:top-11 lg:bottom-4 lg:left-4 lg:z-[60] lg:flex lg:w-16 xl:w-18 lg:flex-col">
        <div className="flex grow flex-col gap-y-3 overflow-y-auto bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-3">
          {/* Brand Section */}
          <div className="flex shrink-0 items-center justify-center">
            <a
              href="https://github.com/AlejoReyna/monNewPortfolio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open GitHub repository"
              className="group relative flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl bg-black shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {/* GitHub icon */}
              <svg className="w-5 h-5 xl:w-6 xl:h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.01c0 4.424 2.865 8.18 6.839 9.504.5.092.682-.218.682-.486 0-.24-.009-.876-.014-1.72-2.782.605-3.369-1.343-3.369-1.343-.454-1.157-1.11-1.467-1.11-1.467-.908-.622.069-.609.069-.609 1.003.071 1.53 1.032 1.53 1.032.892 1.542 2.341 1.096 2.91.838.091-.654.35-1.096.636-1.349-2.22-.254-4.555-1.114-4.555-4.957 0-1.095.39-1.991 1.029-2.693-.103-.253-.446-1.274.098-2.656 0 0 .84-.27 2.75 1.028A9.564 9.564 0 0112 6.844c.851.004 1.707.115 2.507.337 1.909-1.298 2.748-1.028 2.748-1.028.546 1.382.203 2.403.1 2.656.64.702 1.028 1.598 1.028 2.693 0 3.854-2.339 4.701-4.566 4.951.359.31.679.924.679 1.862 0 1.344-.012 2.428-.012 2.758 0 .27.18.582.688.483A10.02 10.02 0 0022 12.01C22 6.484 17.523 2 12 2z"/>
              </svg>
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                GitHub
              </div>
            </a>
          </div>

          {/* Separator */}
          <div className="h-px bg-white/20 mx-1" />

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {[ 
                { 
                  section: "home", 
                  label: t('navHome', language),
                  icon: (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-white" />
                      <Image
                        src="/terminal_icon.png"
                        alt="Terminal"
                        fill
                        className="relative z-10 object-contain p-0"
                        sizes="(max-width: 1280px) 2.5rem, 2.75rem"
                        priority
                      />
                    </>
                  ),
                  bgColor: "from-orange-500 to-red-500"
                },
                { 
                  section: "projects", 
                  label: t('projects', language),
                  icon: (
                    <Image
                      src="/linux_folder.png"
                      alt="Linux Folder"
                      fill
                      className="object-contain p-0"
                      sizes="(max-width: 1280px) 2.5rem, 2.75rem"
                      priority
                    />
                  ),
                  bgColor: "from-purple-500 to-pink-500"
                },
                // { 
                //   section: "services", 
                //   label: t('services', language),
                //   icon: (
                //     <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="currentColor" viewBox="0 0 24 24">
                //       <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                //     </svg>
                //   ),
                //   bgColor: "from-yellow-500 to-orange-500"
                // }
              ].map((item) => (
                <Fragment key={item.section}>
                <li>
                  <button
                    onClick={() => navigateToSection(item.section as "home" | "services" | "projects" | "contact")}
                    className={`group relative flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl ${
                      item.section === "home" || item.section === "projects"
                        ? "bg-transparent"
                        : currentSection === item.section
                          ? `bg-gradient-to-br ${item.bgColor} text-white`
                          : `bg-white/20 text-white/80 hover:bg-white/30 hover:text-white`
                    }`}
                  >
                    {item.icon}
                    {/* Active indicator removed on desktop; kept only in MobileDock */}
                    {/* Tooltip */}
                    {(item.section === 'home' || item.section === 'projects' || item.section === 'services') && (
                      <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {item.section === 'home' ? t('navHome', language) : item.section === 'projects' ? t('projects', language) : t('services', language)}
                      </div>
                    )}
                  </button>
                </li>
                {item.section === 'home' && (
                  <>
                    {/* LinkedIn below Terminal */}
                    <li key="social-linkedin">
                      <a
                        href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open LinkedIn"
                        className="group relative flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl bg-transparent text-white/80"
                      >
                        <Image
                          src="/LinkedIn_icon.svg"
                          alt="LinkedIn"
                          fill
                          className="object-contain p-0"
                          sizes="(max-width: 1280px) 2.5rem, 2.75rem"
                          priority
                        />
                        <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          LinkedIn
                        </div>
                      </a>
                    </li>
                    {/* SoundCloud below LinkedIn - COMMENTED OUT */}
                    {/* <li key="social-soundcloud">
                      <a
                        href="https://soundcloud.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open SoundCloud"
                        className="group relative flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl bg-white/20 text-white/80 hover:bg-white/30 hover:text-white"
                      >
                        <svg className="w-5 h-5 xl:w-6 xl:h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <g fill="#FF5500">
                            <rect x="2.2" y="13" width="1.2" height="5" rx="0.6" />
                            <rect x="4.2" y="11.5" width="1.2" height="6.5" rx="0.6" />
                            <rect x="6.2" y="10" width="1.2" height="8" rx="0.6" />
                            <rect x="8.2" y="9" width="1.2" height="9" rx="0.6" />
                            <rect x="10.2" y="8.2" width="1.2" height="9.8" rx="0.6" />
                          </g>
                          <path fill="#FF5500" d="M13.5 8.5a4.5 4.5 0 00-4.5 4.5v.05A2.95 2.95 0 007.5 13c-1.66 0-3 1.34-3 3s1.34 3 3 3H18a3.5 3.5 0 000-7 3.6 3.6 0 00-1 .14A4.5 4.5 0 0013.5 8.5z" />
                        </svg>
                        <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          SoundCloud
                        </div>
                      </a>
                    </li> */}
                  </>
                )}
                </Fragment>
              ))}
            </ul>
            

            {/* Separator */}
            <div className="h-px bg-white/20 mx-1 my-2" />

            {/* Contact CTA */}
            <div className="pb-2">
              <button
                onClick={() => navigateToSection("contact")}
                className={`group relative flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl ${
                  currentSection === "contact"
                    ? "bg-gradient-to-br from-green-500 to-teal-500 text-white"
                    : "bg-white/20 text-white/80 hover:bg-white/30 hover:text-white"
                }`}
              >
                {/* Message/Chat icon */}
                <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                {/* Active indicator */}
                {currentSection === "contact" && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
                )}
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {t('contact', language)}
                </div>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Navigation removed to avoid overlaying the chat on small screens */}
    </>
  );
}
