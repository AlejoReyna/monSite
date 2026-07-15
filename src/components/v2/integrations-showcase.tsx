"use client";

import { useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";

/* ══════════════════════════════════════════════════════
   SVG Tool Icons — minimal geometric marks, all grayscale
══════════════════════════════════════════════════════ */

function IconSlack() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Top-left petal */}
      <rect x="6" y="15" width="10" height="5" rx="2.5" fill="currentColor" />
      <rect x="6" y="10" width="5" height="10" rx="2.5" fill="currentColor" />
      {/* Top-right petal */}
      <rect x="24" y="6" width="5" height="10" rx="2.5" fill="currentColor" />
      <rect x="19" y="6" width="10" height="5" rx="2.5" fill="currentColor" />
      {/* Bottom-right petal */}
      <rect x="24" y="20" width="10" height="5" rx="2.5" fill="currentColor" />
      <rect x="29" y="20" width="5" height="10" rx="2.5" fill="currentColor" />
      {/* Bottom-left petal */}
      <rect x="15" y="29" width="5" height="10" rx="2.5" fill="currentColor" />
      <rect x="10" y="24" width="10" height="5" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path fillRule="evenodd" clipRule="evenodd" d="M20 4C11.16 4 4 11.16 4 20c0 7.08 4.59 13.09 10.97 15.22.8.15 1.09-.35 1.09-.77v-2.69c-4.45.97-5.39-2.14-5.39-2.14-.73-1.85-1.78-2.34-1.78-2.34-1.45-.99.11-1.04.11-1.04 1.61.11 2.46 1.66 2.46 1.66 1.43 2.45 3.75 1.74 4.66 1.33.14-1.04.56-1.74 1.02-2.14-3.56-.4-7.3-1.78-7.3-7.92 0-1.75.62-3.18 1.65-4.31-.16-.4-.72-2.04.16-4.25 0 0 1.35-.43 4.42 1.65A15.4 15.4 0 0120 9.4c1.37.01 2.74.18 4.03.54 3.06-2.08 4.41-1.65 4.41-1.65.88 2.21.33 3.85.16 4.25 1.03 1.13 1.65 2.56 1.65 4.31 0 6.15-3.75 7.51-7.32 7.91.58.5 1.09 1.48 1.09 2.98v4.42c0 .43.29.93 1.1.77C31.42 33.08 36 27.08 36 20c0-8.84-7.16-16-16-16z" />
    </svg>
  );
}

function IconNotion() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="7" y="7" width="26" height="26" rx="3" fill="currentColor" opacity="0.12" />
      <path d="M12 12h2.8l9.2 13V12H27v16h-2.8L15 15v13H12V12z" fill="currentColor" />
    </svg>
  );
}

function IconFigma() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="12" y="6" width="8" height="8" rx="2" fill="currentColor" opacity="0.8" />
      <rect x="20" y="6" width="8" height="8" rx="4" fill="currentColor" />
      <rect x="12" y="16" width="8" height="8" rx="4" fill="currentColor" opacity="0.6" />
      <rect x="12" y="26" width="8" height="8" rx="2" fill="currentColor" opacity="0.4" />
      <circle cx="24" cy="20" r="4" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function IconLinear() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M8 28L28 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 34L34 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function IconStripe() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 8c-3.5 0-7 1.6-7 5.2 0 6.8 10.5 5.2 10.5 8.5 0 1.8-2 2.4-4 2.4-3.2 0-6.2-1.2-6.2-1.2v4.8S16 29 20 29c4 0 8-1.8 8-5.6 0-7.2-10.5-5.4-10.5-8.6 0-1.6 1.8-2.2 3.8-2.2 2.8 0 5.5 1 5.5 1V9s-2.4-1-6.8-1z" fill="currentColor" />
    </svg>
  );
}

function IconAWS() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M8 16l4 10 4-10M14 22h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 16l2.5 10 2.5-6 2.5 6L32 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 29c2.5 1.5 5.5 2.5 9.5 2.5 4.2 0 7.5-1 10-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function IconVercel() {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 7L36 33H4L20 7z" />
    </svg>
  );
}

function IconDocker() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="7" y="15" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="14" y="15" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="21" y="15" width="5" height="4" rx="0.5" fill="currentColor" />
      <rect x="21" y="9" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="14" y="9" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
      <path d="M7 21c2 4 6 6 13 6s10-2 13-6c-3 0-4-1-4-1s-1 2-9 2-9-2-9-2-2 1-4 1z" fill="currentColor" />
    </svg>
  );
}

function IconOpenAI() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 6c7.7 0 14 6.3 14 14S27.7 34 20 34 6 27.7 6 20 12.3 6 20 6z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M20 6v28M6 20h28M9.4 9.4l21.2 21.2M30.6 9.4L9.4 30.6" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

function IconPostgres() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <ellipse cx="20" cy="13" rx="11" ry="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 13v14c0 2.8 4.9 5 11 5s11-2.2 11-5V13" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="20" cy="13" rx="11" ry="5" fill="currentColor" opacity="0.15" />
      <line x1="20" y1="13" x2="20" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function IconRedis() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <ellipse cx="20" cy="11" rx="13" ry="5" fill="currentColor" opacity="0.9" />
      <ellipse cx="20" cy="20" rx="13" ry="5" fill="currentColor" opacity="0.6" />
      <ellipse cx="20" cy="29" rx="13" ry="5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IconTypeScript() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect x="5" y="5" width="30" height="30" rx="3" fill="currentColor" />
      <path d="M12 18h8M16 18v10" stroke="var(--tech-cutout, white)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 25.5c0 1.4 1.1 2.5 3 2.5 2 0 3-1 3-2.5 0-1.2-.8-2-2.5-2.5L24 22.5c-1.2-.4-2-1-2-2.2 0-1.3 1-2.3 2.8-2.3 1.6 0 2.6.9 2.7 2.3" stroke="var(--tech-cutout, white)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconZapier() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M10 10h20L10 30h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHubSpot() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="20" cy="20" r="6" fill="currentColor" />
      <circle cx="20" cy="7" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="33" cy="20" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="20" cy="33" r="3" fill="currentColor" opacity="0.6" />
      <circle cx="7" cy="20" r="3" fill="currentColor" opacity="0.6" />
      <line x1="20" y1="10" x2="20" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="30" x2="20" y2="26" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="20" x2="14" y2="20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconNextJS() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="20" cy="20" r="14" fill="currentColor" opacity="0.12" />
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M14 28V12l16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 22l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function IconAnthropic() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M15 30L20 10l5 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M17 24h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 30L20 10l10 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.3" />
    </svg>
  );
}

function IconGraphQL() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <polygon points="20,6 32,13 32,27 20,34 8,27 8,13" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="20" cy="6" r="2.5" fill="currentColor" />
      <circle cx="32" cy="13" r="2.5" fill="currentColor" />
      <circle cx="32" cy="27" r="2.5" fill="currentColor" />
      <circle cx="20" cy="34" r="2.5" fill="currentColor" />
      <circle cx="8" cy="27" r="2.5" fill="currentColor" />
      <circle cx="8" cy="13" r="2.5" fill="currentColor" />
      <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function IconSalesforce() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M16 26.5a7 7 0 100-14c-1.8 0-3.4.7-4.6 1.8A5.5 5.5 0 005 19.5a5.5 5.5 0 005.5 5.5H16v1.5z" fill="currentColor" opacity="0.9" />
      <path d="M23 26.5a5 5 0 100-10 6 6 0 00-5 2.7 4.5 4.5 0 10-1 8.8l6 1v-2.5z" fill="currentColor" opacity="0.6" />
      <ellipse cx="28" cy="20" rx="7" ry="6" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IconReact() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <ellipse cx="20" cy="20" rx="15" ry="5.5" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="20" cy="20" rx="15" ry="5.5" stroke="currentColor" strokeWidth="2" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="15" ry="5.5" stroke="currentColor" strokeWidth="2" transform="rotate(120 20 20)" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

function IconTailwind() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M8 20c3-8 8-10 15-6 3 1.8 5 2.1 9-1-3 8-8 10-15 6-3-1.8-5-2.1-9 1z" fill="currentColor" opacity="0.55" />
      <path d="M8 29c3-8 8-10 15-6 3 1.8 5 2.1 9-1-3 8-8 10-15 6-3-1.8-5-2.1-9 1z" fill="currentColor" />
    </svg>
  );
}

function IconPython() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M11 19V10c0-2.2 1.8-4 4-4h9c2.2 0 4 1.8 4 4v4H18c-2.2 0-4 1.8-4 4v1h-3z" fill="currentColor" opacity="0.85" />
      <path d="M29 21v9c0 2.2-1.8 4-4 4h-9c-2.2 0-4-1.8-4-4v-4h10c2.2 0 4-1.8 4-4v-1h3z" fill="currentColor" opacity="0.45" />
      <circle cx="16" cy="11" r="1.4" fill="white" opacity="0.9" />
      <circle cx="24" cy="29" r="1.4" fill="white" opacity="0.9" />
    </svg>
  );
}

function IconSwift() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M9 9c7 7 12 11 18 14-3.8.8-7.8.2-11.7-1.8l6.7 6.8c-6.4-2.4-10.7-6.7-13-13 3.9 4.3 7.7 7.2 11.5 8.7C16.8 20.4 13 15.5 9 9z" fill="currentColor" />
      <path d="M25 25c3.5-.5 5.7.8 6.7 4 1-4.5-.1-8.3-3.5-11.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function IconKotlin() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M8 8h24L20 20 32 32H8V8z" fill="currentColor" opacity="0.85" />
      <path d="M8 32l12-12 12 12H8z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IconCpp() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 5l13 7.5v15L20 35 7 27.5v-15L20 5z" stroke="currentColor" strokeWidth="2.4" fill="currentColor" fillOpacity="0.08" />
      <path d="M22.5 16.2A6 6 0 1022.5 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M27 17v6M24 20h6M34 17v6M31 20h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconFirebase() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M10 31l4-23 5 10 3-6 8 19H10z" fill="currentColor" opacity="0.85" />
      <path d="M14 8l8 23H10l4-23z" fill="currentColor" opacity="0.35" />
      <path d="M19 18l-9 13h20L19 18z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M15 12L7 20l8 8M25 12l8 8-8 8" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 9l-4 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function IconWeb3() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M20 5l11 15-11 15L9 20 20 5z" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M20 5v30M9 20h22M14 13l12 14M26 13L14 27" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <circle cx="20" cy="20" r="3.2" fill="currentColor" />
    </svg>
  );
}

function IconMotion() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <path d="M7 28h9L30 12h3L19 28h14" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 20h7M7 12h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Tool data — 18 items, cols 1–7
   Distribution: 2, 3, 3, 2, 3, 3, 2
══════════════════════════════════════════════ */

interface Tool {
  name: string;
  col: number; // 1-indexed
  Icon: React.FC;
  background: string;
  iconColor: string;
  textColor: string;
  mutedColor: string;
  cutoutColor?: string;
}

const TOOLS: Tool[] = [
  // Col 1 (2)
  {
    name: "TypeScript",
    col: 1,
    Icon: IconTypeScript,
    background: "linear-gradient(145deg, #3178c6 0%, #235a97 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.68)",
    cutoutColor: "#3178c6",
  },
  {
    name: "JavaScript",
    col: 1,
    Icon: IconCode,
    background: "linear-gradient(145deg, #f7df1e 0%, #f5c400 100%)",
    iconColor: "#1f1f1f",
    textColor: "#151515",
    mutedColor: "rgba(0,0,0,0.48)",
  },
  // Col 2 (3)
  {
    name: "React",
    col: 2,
    Icon: IconReact,
    background: "linear-gradient(145deg, #071d2b 0%, #0f5f76 100%)",
    iconColor: "#61dafb",
    textColor: "#e9fbff",
    mutedColor: "rgba(233,251,255,0.6)",
  },
  {
    name: "Next.js",
    col: 2,
    Icon: IconNextJS,
    background: "linear-gradient(145deg, #050505 0%, #202020 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.56)",
  },
  {
    name: "Tailwind CSS",
    col: 2,
    Icon: IconTailwind,
    background: "linear-gradient(145deg, #083344 0%, #06b6d4 100%)",
    iconColor: "#cffafe",
    textColor: "#f0fdff",
    mutedColor: "rgba(240,253,255,0.62)",
  },
  // Col 3 (3)
  {
    name: "Framer Motion",
    col: 3,
    Icon: IconMotion,
    background: "linear-gradient(145deg, #24003d 0%, #e100ff 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.62)",
  },
  {
    name: "Vercel",
    col: 3,
    Icon: IconVercel,
    background: "linear-gradient(145deg, #111111 0%, #3a3a3a 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.56)",
  },
  {
    name: "GitHub",
    col: 3,
    Icon: IconGitHub,
    background: "linear-gradient(145deg, #0d1117 0%, #30363d 100%)",
    iconColor: "#f0f6fc",
    textColor: "#ffffff",
    mutedColor: "rgba(240,246,252,0.58)",
  },
  // Col 4 (2)
  {
    name: "Web3",
    col: 4,
    Icon: IconWeb3,
    background: "linear-gradient(145deg, #172554 0%, #7c3aed 56%, #06b6d4 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.64)",
  },
  {
    name: "Motoko / ICP",
    col: 4,
    Icon: IconGraphQL,
    background: "linear-gradient(135deg, #ff6b00 0%, #e000ff 48%, #29abe2 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.66)",
  },
  // Col 5 (3)
  {
    name: "Python",
    col: 5,
    Icon: IconPython,
    background: "linear-gradient(145deg, #306998 0%, #ffd43b 100%)",
    iconColor: "#ffffff",
    textColor: "#101820",
    mutedColor: "rgba(16,24,32,0.58)",
  },
  {
    name: "SwiftUI",
    col: 5,
    Icon: IconSwift,
    background: "linear-gradient(145deg, #f05138 0%, #ff8a00 100%)",
    iconColor: "#fff7ed",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.68)",
  },
  {
    name: "Kotlin",
    col: 5,
    Icon: IconKotlin,
    background: "linear-gradient(145deg, #7f52ff 0%, #e24462 52%, #ff8a00 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.65)",
  },
  // Col 6 (3)
  {
    name: "Firebase",
    col: 6,
    Icon: IconFirebase,
    background: "linear-gradient(145deg, #ffca28 0%, #f57c00 100%)",
    iconColor: "#3b2200",
    textColor: "#2a1700",
    mutedColor: "rgba(42,23,0,0.54)",
  },
  {
    name: "C++",
    col: 6,
    Icon: IconCpp,
    background: "linear-gradient(145deg, #004482 0%, #659ad2 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.62)",
  },
  {
    name: "PHP",
    col: 6,
    Icon: IconCode,
    background: "linear-gradient(145deg, #4f5b93 0%, #8892bf 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.62)",
  },
  // Col 7 (2)
  {
    name: "Figma",
    col: 7,
    Icon: IconFigma,
    background: "linear-gradient(145deg, #ff7262 0%, #a259ff 42%, #1abcfe 100%)",
    iconColor: "#ffffff",
    textColor: "#ffffff",
    mutedColor: "rgba(255,255,255,0.66)",
  },
  {
    name: "AI / ML",
    col: 7,
    Icon: IconOpenAI,
    background: "linear-gradient(145deg, #052e16 0%, #16a34a 100%)",
    iconColor: "#dcfce7",
    textColor: "#f0fdf4",
    mutedColor: "rgba(240,253,244,0.62)",
  },
];

/* ══════════════════════════════════════════════
   Column vertical offsets (% of grid width)
   Creates a wave/arch shape
══════════════════════════════════════════════ */
const COL_OFFSETS: Record<number, number> = {
  1: 0,
  2: 7.5,
  3: 20,
  4: 15,
  5: 20,
  6: 7.5,
  7: 0,
};

/* ══════════════════════════════════════════════
   ToolCard component
══════════════════════════════════════════════ */
interface ToolCardProps {
  tool: Tool;
  isEdgeLeft: boolean;
  isEdgeRight: boolean;
}

function ToolCard({ tool, isEdgeLeft, isEdgeRight }: ToolCardProps) {
  const [hovered, setHovered] = useState(false);
  const { language } = useLanguage();
  const copy = COPY[language];
  const { Icon } = tool;

  const borderRadius = [
    isEdgeLeft ? "0" : "16px",
    isEdgeRight ? "0" : "16px",
    isEdgeRight ? "0" : "16px",
    isEdgeLeft ? "0" : "16px",
  ].join(" ");

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius,
        background: tool.background,
        paddingBottom: "160%",
        overflow: "hidden",
        cursor: "default",
        boxShadow: hovered
          ? "0 22px 54px rgba(0,0,0,0.18)"
          : "0 1px 0 rgba(255,255,255,0.28) inset",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition:
          "transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease",
        ["--tech-cutout" as string]: tool.cutoutColor ?? "#ffffff",
      }}
    >
      {/* Icon wrapper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "38%",
            height: "38%",
            color: tool.iconColor,
            opacity: hovered ? 0.68 : 1,
            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.22))",
            transition: "opacity 0.4s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
            transform: hovered ? "scale(0.92)" : "scale(1)",
          }}
        >
          <Icon />
        </div>
      </div>

      {/* Top hover label — slides down from above */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "12px 6px 0",
          transform: hovered ? "translateY(0)" : "translateY(-8px)",
          opacity: hovered ? 1 : 0,
          transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.9s ease",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
            fontSize: "8px",
            fontWeight: 400,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: tool.mutedColor,
            textAlign: "center",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
          }}
        >
          {copy.hoverLabel}
        </span>
      </div>

      {/* Bottom hover label — slides up from below */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          padding: "0 6px 12px",
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          opacity: hovered ? 1 : 0,
          transition: "transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.9s ease",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-bebas, sans-serif)",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "0.08em",
            color: tool.textColor,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {tool.name}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Copy
══════════════════════════════════════════════ */

const COPY: Record<Language, {
  eyebrow: string;
  titleLine1: string;
  titleLine2Real: string;
  titleLine2Rest: string;
  description: string;
  hoverLabel: string;
  stats: Record<string, string>;
}> = {
  en: {
    eyebrow: "section 02 / stack",
    titleLine1: "Built from",
    titleLine2Real: "real",
    titleLine2Rest: "shipped work",
    description: "A stack pulled from 35 public repos — TypeScript frontends, Web3 dApps, Python automation and mobile experiments.",
    hoverLabel: "shipped with",
    stats: {
      technologies: "technologies",
      publicRepos: "public repos",
      yearsShipping: "years shipping",
    },
  },
  es: {
    eyebrow: "sección 02 / stack",
    titleLine1: "Construido con",
    titleLine2Real: "trabajo",
    titleLine2Rest: "real enviado",
    description: "Un stack extraído de 35 repositorios públicos — frontends TypeScript, dApps Web3, automatización Python y experimentos móviles.",
    hoverLabel: "enviado con",
    stats: {
      technologies: "tecnologías",
      publicRepos: "repos públicos",
      yearsShipping: "años enviando",
    },
  },
  zh: {
    eyebrow: "第 02 部分 / 技术栈",
    titleLine1: "构建自",
    titleLine2Real: "真实",
    titleLine2Rest: "上线作品",
    description: "从 35 个公共仓库中提取的技术栈——TypeScript 前端、Web3 去中心化应用、Python 自动化和移动端实验。",
    hoverLabel: "使用",
    stats: {
      technologies: "技术",
      publicRepos: "公共仓库",
      yearsShipping: "年交付经验",
    },
  },
};

/* ══════════════════════════════════════════════
   Main: IntegrationsShowcase
══════════════════════════════════════════════ */

export default function IntegrationsShowcase() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 72,
    damping: 24,
    mass: 0.65,
  });
  const gridLift = useTransform(
    smoothProgress,
    [0.06, 0.42],
    shouldReduceMotion ? [0, 0] : [72, 0]
  );
  const gridOpacity = useTransform(
    smoothProgress,
    [0.05, 0.22],
    shouldReduceMotion ? [1, 1] : [0.55, 1]
  );

  /* ── Group tools by column ── */
  const byCol = useMemo(() => {
    const grouped: Record<number, Tool[]> = {};
    for (let c = 1; c <= 7; c++) grouped[c] = TOOLS.filter((t) => t.col === c);
    return grouped;
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        background: "transparent",
        paddingBottom: "clamp(72px, 10vw, 132px)",
      }}
    >
      <style>{`
        .integrations-desktop { display: block; }
        .integrations-mobile { display: none; }
        .integrations-mobile-scroller::-webkit-scrollbar { display: none; }

        @media (max-width: 939px) {
          .integrations-desktop { display: none; }
          .integrations-mobile { display: block; }
        }
      `}</style>

      {/* ── Heading ── */}
      <div
        style={{
          paddingTop: "clamp(64px, 9vw, 104px)",
          paddingLeft: "clamp(24px, 6vw, 80px)",
          paddingRight: "clamp(24px, 6vw, 80px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: "clamp(32px, 5vw, 56px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        <div>
          <p style={{
            fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(200,168,74,0.82)",
            margin: "0 0 16px",
          }}>
            {copy.eyebrow}
          </p>
          <h2 style={{
            fontFamily: "var(--font-bebas, sans-serif)",
            fontSize: "clamp(3rem, 7vw, 6.5rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            color: "#f8f5ea",
            margin: 0,
          }}>
            {copy.titleLine1}<br />
            <em style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontStyle: "italic",
              color: "rgba(200,168,74,0.9)",
              fontSize: "0.65em",
              fontWeight: 300,
            }}>{copy.titleLine2Real}</em>{" "}{copy.titleLine2Rest}
          </h2>
        </div>
        <p style={{
          fontFamily: "var(--font-cormorant, serif)",
          fontStyle: "italic",
          fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
          color: "rgba(248,245,234,0.5)",
          lineHeight: 1.65,
          maxWidth: "360px",
          margin: 0,
        }}>
          {copy.description}
        </p>
      </div>

      {/* ══════════════
          DESKTOP LAYOUT
      ══════════════ */}
      <div className="integrations-desktop">
        {/* ── Part 1: Tool Grid ── */}
        <motion.div
          style={{
            y: gridLift,
            opacity: gridOpacity,
            paddingTop: "clamp(96px, 11vw, 140px)",
            paddingLeft: 0,
            paddingRight: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "8px",
              alignItems: "start",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((col) => {
              const tools = byCol[col] ?? [];
              const offsetPct = COL_OFFSETS[col] ?? 0;
              const isEdgeLeft = col === 1;
              const isEdgeRight = col === 7;

              return (
                <div
                  key={col}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: `${offsetPct}%`,
                  }}
                >
                  {tools.map((tool) => (
                    <ToolCard
                      key={tool.name}
                      tool={tool}
                      isEdgeLeft={isEdgeLeft}
                      isEdgeRight={isEdgeRight}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Stats bar ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "clamp(20px, 3vw, 32px) clamp(24px, 6vw, 80px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          marginTop: "clamp(32px, 5vw, 56px)",
          flexWrap: "wrap",
          gap: "16px",
        }}>
          {[
            { num: "18", label: copy.stats.technologies, key: "technologies" },
            { num: "35", label: copy.stats.publicRepos, key: "publicRepos" },
            { num: "6", label: copy.stats.yearsShipping, key: "yearsShipping" },
          ].map(({ num, label, key }) => (
            <div key={key} style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{
                fontFamily: "var(--font-bebas, sans-serif)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                lineHeight: 1,
                color: "#f8f5ea",
              }}>{num}</span>
              <span style={{
                fontFamily: "var(--font-space-mono, ui-monospace, monospace)",
                fontSize: "0.58rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(248,245,234,0.35)",
              }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════
          MOBILE LAYOUT
      ══════════════ */}
      <div
        className="integrations-mobile"
        style={{ padding: "40px 20px 0" }}
      >
        {/* 3-col carousel */}
        <div
          className="integrations-mobile-scroller"
          style={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            gap: "10px",
            paddingBottom: "12px",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {TOOLS.slice(0, 9).map((tool) => {
            const { Icon } = tool;
            return (
              <div
                key={tool.name}
                style={{
                  flexShrink: 0,
                  width: "calc(33.333% - 7px)",
                  scrollSnapAlign: "start",
                  borderRadius: "12px",
                  background: tool.background,
                  paddingBottom: "130%",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.24) inset",
                  ["--tech-cutout" as string]: tool.cutoutColor ?? "#ffffff",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <div style={{ width: "40%", height: "40%", color: tool.iconColor }}>
                    <Icon />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-bebas, sans-serif)",
                      fontSize: "13px",
                      fontWeight: 400,
                      letterSpacing: "0.08em",
                      color: tool.textColor,
                      textAlign: "center",
                      paddingInline: "6px",
                    }}
                  >
                    {tool.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
