"use client";

import { useState, FormEvent } from "react";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";
import type { Language } from "@/components/lang-context";

type Interest =
  | "UI/UX design"
  | "Web design"
  | "Graphic design"
  | "Design system"
  | "Other";

const interestLabels: Record<Language, Record<Interest, string>> = {
  en: {
    "UI/UX design": "UI/UX design",
    "Web design": "Web design",
    "Graphic design": "Graphic design",
    "Design system": "Design system",
    "Other": "Other",
  },
  es: {
    "UI/UX design": "UI/UX design",
    "Web design": "Web design",
    "Graphic design": "Graphic design",
    "Design system": "Design system",
    "Other": "Other",
  },
  zh: {
    "UI/UX design": "UI/UX 设计",
    "Web design": "网页设计",
    "Graphic design": "平面设计",
    "Design system": "设计系统",
    "Other": "其他",
  },
};

export default function LetsTalk() {
  const { language } = useLanguage();
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>("UI/UX design");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interests: Interest[] = [
    "UI/UX design",
    "Web design",
    "Graphic design",
    "Design system",
    "Other",
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          interest: selectedInterest
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setMessage("");
        setSelectedInterest("UI/UX design");
      } else {
        throw new Error(result.error || t('errorSending', language));
      }
    } catch (error) {
      console.error("Error:", error);
      setError(t('errorSending', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-black py-24 sm:py-28"
      aria-labelledby="contact-title"
    >
      {/* Orbes sutiles (match con tu estética) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 left-10 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/15 to-violet-600/10 blur-3xl"
          style={{ animation: "float-soft 8s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-24 right-10 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-fuchsia-500/15 to-purple-700/10 blur-3xl"
          style={{ animation: "float-soft 8s ease-in-out infinite 2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-600/10 to-violet-800/10 blur-3xl"
          style={{ animation: "float-soft 10s ease-in-out infinite 1s" }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-2">
        {/* Columna izquierda: copy + contacto */}
        <div className="flex flex-col justify-center gap-6">
          <h2
            id="contact-title"
            className="text-4xl sm:text-5xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              {t('letsDiscuss', language)}
            </span>
            <br />
            <span className="font-mono font-light text-gray-300">
              {t('onSomething', language)}
            </span>
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
              {t('cool', language)}
            </span>
            <span className="font-mono font-light text-gray-300">
              {t('together', language)}
            </span>
          </h2>

          <p className="text-gray-300/90 font-mono font-light leading-relaxed">
            {t('contactSubtitle', language)}
          </p>

          <ul className="mt-2 space-y-3">
            <li className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-200 backdrop-blur-md">
                {/* Mail */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16v12H4z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </span>
              <a className="text-gray-300 hover:text-white transition-colors" href="mailto:hello@example.com">
                hello@example.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-200 backdrop-blur-md">
                {/* Phone */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5l4-2 4 8-3 1c1 2 3 4 5 5l1-3 8 4-2 4c-6 1-13-6-17-13z" />
                </svg>
              </span>
              <span className="text-gray-300">+1 234 567 890</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-200 backdrop-blur-md">
                {/* Location */}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="text-gray-300">Remote • Worldwide</span>
            </li>
          </ul>

          <div className="mt-2 flex items-center gap-2">
            <a
              aria-label="GitHub"
              href="#"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-200 hover:text-white hover:bg-black/50 backdrop-blur-md transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58V20.9c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.57.12-3.27 0 0 1.01-.32 3.3 1.23a11.48 11.48 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.7.24 2.96.12 3.27.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.61-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0012 .5z" />
              </svg>
            </a>
            <a
              aria-label="LinkedIn"
              href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-200 hover:text-white hover:bg-black/50 backdrop-blur-md transition-colors"
            >
              <img src="/LinkedIn_icon.svg" alt="LinkedIn" className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Columna derecha: tarjeta del formulario */}
        <div className="relative">
          {/* Halo suave */}
          <div className="pointer-events-none absolute -inset-0.5 -z-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-violet-600/20 blur-2xl opacity-40" />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8 shadow-2xl backdrop-blur-md"
            aria-live="polite"
          >
            <fieldset>
              <legend className="mb-3 block text-xs uppercase tracking-wider text-gray-300/80 font-mono">
                {t('imInterestedIn', language)}
              </legend>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => {
                  const isActive = selectedInterest === interest;
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setSelectedInterest(interest)}
                      className={`text-xs px-3 py-2 rounded-lg border font-mono transition-all
                        ${isActive
                          ? "border-cyan-500/30 bg-cyan-600/40 text-cyan-100 shadow-inner shadow-cyan-400/20"
                          : "border-gray-600/30 bg-gray-700/30 text-gray-200 hover:bg-gray-600/40"}`}
                      aria-pressed={isActive}
                    >
                      {interestLabels[language][interest]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="name" className="sr-only">
                  {t('yourName', language)}
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('yourName', language)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-200 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  {t('yourEmail', language)}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('yourEmail', language)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-200 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="message" className="sr-only">
                  {t('yourMessage', language)}
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('yourMessage', language)}
                  rows={5}
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-200 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  required
                />
              </div>

              {/* Hidden input for Web3Forms spam protection */}
              <input type="hidden" name="redirect" value="https://web3forms.com/success" />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400 font-mono">
                  {t('contactConsent', language)}
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || !name || !email || !message}
                  className="group relative inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-600/40 px-5 py-2.5 text-sm font-mono font-semibold text-cyan-100 shadow-inner shadow-cyan-400/10 transition-all hover:bg-cyan-500/50 hover:text-white hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {isSubmitting
                      ? t('sending', language)
                      : t('sendMessage', language)}
                  </span>
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {submitted && (
                <p className="mt-2 text-sm text-emerald-400 font-mono">
                  {t('thanksContact', language)}
                </p>
              )}
              
              {error && (
                <p className="mt-2 text-sm text-red-400 font-mono">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Separador sutil (match Navbar/Hero) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </section>
  );
}
