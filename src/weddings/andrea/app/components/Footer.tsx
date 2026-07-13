"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiGithub, FiInstagram, FiLinkedin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

type FooterLink = { label: string; href: string };
type FooterSection = { title: string; links: FooterLink[] };

type SocialItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  icon: React.ReactNode;
};

type BrandInfo = {
  name: string;
  slogan?: string;
  href?: string;
  logoSrc?: string;
};

type FooterProps = {
  brand?: BrandInfo;
  sections?: FooterSection[];
  social?: SocialItem[];
  className?: string;
};

const defaultBrand: BrandInfo = {
  name: "Alexis Reyna",
  slogan: "Hecho con calma — y café",
  href: "https://alexisreyna.dev",
  logoSrc: "/weddings/andrea/assets/logos/IMG_0340.PNG",
};

const defaultSocial: SocialItem[] = [
  { label: "GitHub", href: "https://github.com/AlejoReyna", icon: <FiGithub />, ariaLabel: "GitHub" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4", icon: <FiLinkedin />, ariaLabel: "LinkedIn" },
  { label: "Instagram", href: "https://www.instagram.com/_alexisreyna/", icon: <FiInstagram />, ariaLabel: "Instagram" },
  { label: "WhatsApp", href: "https://wa.me/8140490960?text=%C2%A1Hola%21%20Me%20gustar%C3%ADa%20hablar%20de%20...", icon: <FaWhatsapp />, ariaLabel: "WhatsApp" },
];

export default function Footer({
  brand = defaultBrand,
  social = defaultSocial,
  className = "",
}: FooterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const footerRef = useRef<HTMLElement>(null);
  const targetText = "¡Hablemos!";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= targetText.length) {
        setDisplayText(targetText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);
    return () => clearInterval(typeInterval);
  }, [isVisible]);

  return (
    <footer
      ref={footerRef}
      id="footer"
      role="contentinfo"
      className={[
        "border-t border-white/10",
        "bg-black text-neutral-200",
        "backdrop-blur supports-[backdrop-filter]:bg-black/95",
        className,
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        {/* Top */}
        <div className="grid gap-12 md:grid-cols-12">
          {/* Marca */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <BrandMark href={brand.href} name={brand.name} slogan={brand.slogan} />
            <SocialRow items={social} />
          </div>

          {/* CTA */}
          <div className="md:col-span-8 flex justify-end md:justify-center items-center">
            <TalkCTA
              href="https://wa.me/8140490960?text=%C2%A1Hola%21%20Me%20gustar%C3%ADa%20hablar%20de%20..."
              prefix="¿Tienes una idea?"
              displayText={displayText}
              showCaret={isVisible && displayText.length < targetText.length}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Subcomponentes ---------- */

function BrandMark({
  href,
  name,
  slogan,
}: {
  href?: string;
  name: string;
  slogan?: string;
}) {
  const Mark = (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-semibold tracking-tight text-base text-neutral-100 hover:text-white transition-colors cursor-pointer">
          {name}
        </span>
        {slogan ? (
          <span className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer">
            {slogan}
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <a
      href={href ?? "https://alexisreyna.dev"}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex w-fit items-center"
    >
      {Mark}
      <span className="sr-only">{name} - Portfolio</span>
    </a>
  );
}

function SocialRow({ items }: { items: SocialItem[] }) {
  return (
    <ul className="flex items-center gap-3">
      {items.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel ?? item.label}
            className={[
              "inline-flex items-center justify-center",
              "h-9 w-9 rounded-full",
              "border border-white/15 text-neutral-100",
              "hover:-translate-y-0.5 transition-all duration-200",
              "hover:border-white/30 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
            ].join(" ")}
          >
            <span className="text-[18px]">{item.icon}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function FooterLink({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  const content = (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative">
        <span className="text-neutral-300 hover:text-white transition-colors">
          {children}
        </span>
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white/70 transition-all duration-200 group-hover:w-full" />
      </span>
    </span>
  );

  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  return isExternal ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group"
    >
      {content}
    </a>
  ) : (
    <Link href={href} className="group">
      {content}
    </Link>
  );
}

/* ---------- CTA con micro-interacciones ---------- */

function TalkCTA({
  href,
  prefix = "¿Tienes una idea?",
  displayText,
  showCaret,
}: {
  href: string;
  prefix?: string;
  displayText: string;
  showCaret: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>(
    []
  );

  // Efecto magnético
  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10;
    const y = ((e.clientY - (r.top + r.height / 2)) / r.height) * 10;
    setPos({ x, y });
  };
  const onLeave = () => setPos({ x: 0, y: 0 });

  // Ripple al click
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const id = Date.now();
    setRipples((rs) => [...rs, { id, x, y }]);
    setTimeout(() => setRipples((rs) => rs.filter((ri) => ri.id !== id)), 600);
  };

  return (
    <>
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
        className={[
          "group relative inline-flex items-center gap-3",
          "rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3",
          "text-neutral-200 hover:text-white",
          "backdrop-blur transition-all duration-200",
          "hover:bg-white/[0.10] hover:border-white/30",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
          "cursor-pointer select-none",
        ].join(" ")}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-label="Hablemos por WhatsApp"
      >
        <span className="text-sm md:text-base">{prefix}</span>

        <span className="relative inline-flex items-center font-semibold">
          <span className="relative">
            <span className="text-white">{displayText}</span>
            <span
              className="absolute -bottom-1 left-0 block h-[2px] w-0 bg-white/70 transition-all duration-300 group-hover:w-full"
              aria-hidden="true"
            />
          </span>
          {showCaret && <span className="ml-0.5 caret-blink">|</span>}
        </span>

        {/* Ripples */}
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          {ripples.map((r) => (
            <span
              key={r.id}
              className="absolute block h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full ripple"
              style={{ left: r.x, top: r.y }}
            />
          ))}
        </span>
      </a>

      {/* Estilos locales */}
      <style jsx>{`
        .caret-blink {
          animation: blink 1s steps(2, start) infinite;
        }
        @keyframes blink {
          to {
            visibility: hidden;
          }
        }
        .ripple {
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.12) 40%,
            rgba(255, 255, 255, 0) 70%
          );
          animation: ripple-anim 0.6s ease-out forwards;
        }
        @keyframes ripple-anim {
          from {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(0.6);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2.2);
          }
        }
      `}</style>
    </>
  );
}