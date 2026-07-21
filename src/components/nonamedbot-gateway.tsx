"use client";

import { motion } from "framer-motion";
import styles from "./nonamedbot-gateway.module.css";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";

// TODO: replace with the live cascade-ai dashboard URL once confirmed.
const DEPLOYMENT_URL = "https://cascade-ai-dashboard.vercel.app";
const DOCS_URL = "https://github.com/AlejoReyna/no-named-yet-bot";

const simpleIcon = (slug: string, color = "e8f0ea") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const COPY: Record<Language, {
  deployedOn: string;
  subtitle: string;
  lead: string;
  leadAccent: string;
  ctaPrimary: string;
  ctaSecondary: string;
  techAriaLabel: string;
}> = {
  en: {
    deployedOn: "Deployed on",
    subtitle: "Autonomous BSC trading agent",
    lead: "At its core, a {accent} — a production-minded Python bot for the BNB Hack AI Trading Agent Edition. It scores high-liquidity BNB Chain tokens with regime-aware guardrails and executes self-custody swaps through TWAK, so Python never holds a trading key.",
    leadAccent: "TWAK agent",
    ctaPrimary: "View deployment",
    ctaSecondary: "Docs",
    techAriaLabel: "NoNamedBot tech stack",
  },
  es: {
    deployedOn: "Desplegado en",
    subtitle: "Agente autónomo de trading en BSC",
    lead: "En su núcleo, un {accent} — un bot de Python pensado para producción para la BNB Hack AI Trading Agent Edition. Evalúa tokens de alta liquidez en BNB Chain con barreras de seguridad conscientes del régimen y ejecuta swaps de autocustodia a través de TWAK, para que Python nunca tenga una clave de trading.",
    leadAccent: "agente TWAK",
    ctaPrimary: "Ver despliegue",
    ctaSecondary: "GitHub repo",
    techAriaLabel: "Stack tecnológico de NoNamedBot",
  },
  zh: {
    deployedOn: "部署于",
    subtitle: "自主 BSC 交易代理",
    lead: "其核心是一个 {accent} —— 一个为 BNB Hack AI Trading Agent Edition 打造的生产级 Python 机器人。它通过基于市场状态的防护栏对高流动性 BNB Chain 代币进行评分，并通过 TWAK 执行自托管交换，因此 Python 永远不会持有交易密钥。",
    leadAccent: "TWAK 代理",
    ctaPrimary: "查看部署",
    ctaSecondary: "文档",
    techAriaLabel: "NoNamedBot 技术栈",
  },
};

const techStack = [
  { label: "Python", logo: simpleIcon("python") },
  { label: "pandas", logo: simpleIcon("pandas") },
  { label: "NumPy", logo: simpleIcon("numpy") },
  { label: "CoinMarketCap", logo: simpleIcon("coinmarketcap") },
  { label: "pytest", logo: simpleIcon("pytest") },
  { label: "Next.js", logo: simpleIcon("nextdotjs") },
  { label: "GitHub", logo: simpleIcon("github") },
] as const;

export default function NoNamedBotGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();
  const copy = COPY[language];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  // The "Deployed on" badge is the last thing to animate in.
  const badgeContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 1.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const logoGroup = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
  };

  const logoItem = {
    hidden: { opacity: 0, y: 12, scale: 0.85 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const renderTechItems = () =>
    techStack.map((tech) => (
      <motion.li key={tech.label} className={styles.techChip} variants={logoItem}>
        <img
          className={styles.techLogo}
          src={tech.logo}
          alt={tech.label}
          title={tech.label}
          loading="lazy"
        />
      </motion.li>
    ));

  return (
    <section className={styles.screen} aria-labelledby="nonamedbot-title">
      <motion.div
        className={styles.backgroundCol}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.1 }}
      >
        <div className={styles.watermark} aria-hidden="true" />
      </motion.div>

      <motion.div
        className={styles.deployBadge}
        variants={badgeContainer}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <motion.span className={styles.deployLabel} variants={item}>
          {copy.deployedOn}
        </motion.span>
        <motion.img
          className={styles.deployLogo}
          src="/bnb_logo.webp"
          alt="BNB Chain"
          loading="lazy"
          variants={item}
        />

        <motion.ul
          className={`${styles.techRow} ${styles.techRowTop}`}
          variants={logoGroup}
          aria-label={copy.techAriaLabel}
        >
          {renderTechItems()}
        </motion.ul>
      </motion.div>

      <motion.div
        className={styles.foreground}
        variants={container}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <div className={styles.content}>
          <motion.h2 id="nonamedbot-title" className={styles.wordmark} variants={item}>
            NoNamedBot
          </motion.h2>

          <motion.p className={styles.subtitle} variants={item}>
            {copy.subtitle}
          </motion.p>

          <motion.p className={styles.lead} variants={item}>
            {copy.lead.split("{accent}").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={styles.leadAccent}>{copy.leadAccent}</span>
                )}
              </span>
            ))}
          </motion.p>

          <motion.div className={styles.actions} variants={item}>
            <a
              className={styles.ctaPrimary}
              href={DEPLOYMENT_URL}
              target="_blank"
              rel="noreferrer"
            >
              {copy.ctaPrimary}
            </a>
            <a
              className={styles.ctaSecondary}
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
            >
              {copy.ctaSecondary}
            </a>
          </motion.div>

          <motion.ul
            className={`${styles.techRow} ${styles.techRowBottom}`}
            variants={logoGroup}
            aria-label={copy.techAriaLabel}
          >
            {renderTechItems()}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}
