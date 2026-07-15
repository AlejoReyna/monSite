"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import type { Language } from "@/components/lang-context";
import styles from "./plebes-project-gateway.module.css";

const simpleIcon = (slug: string, color = "fff7ff") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const BADGE_COPY: Record<Language, { label: string; aria: string }> = {
  en: { label: "as seen on", aria: "As seen on ICP" },
  es: { label: "visto en", aria: "Visto en ICP" },
  zh: { label: "见于", aria: "见于 ICP" },
};

const contributions = [
  {
    key: "homepage",
    title: {
      en: "Homepage Redesign",
      es: "Rediseño de Homepage",
      zh: "首页重新设计",
    },
    body: {
      en: "Replaced a bloated info-heavy site with a single-page minimal design plus a public DAO treasury view for full ownership transparency.",
      es: "Reemplacé un sitio cargado de información con un diseño minimalista de una sola página y una vista pública del tesoro DAO para transparencia total.",
      zh: "将一个信息臃肿的网站替换为单页极简设计，并提供公开的 DAO 财库视图，以实现完全的所有权透明。",
    },
  },
  {
    key: "deposit",
    title: {
      en: "Deposit Flow UX",
      es: "UX del Flujo de Depósito",
      zh: "存款流程 UX",
    },
    body: {
      en: "Owned the /deposit path redesign — built a 4-step guided process that walked users through the funding flow end to end.",
      es: "Lideré el rediseño de /deposit — construí un flujo guiado de 4 pasos que lleva al usuario de principio a fin en el proceso de fondeo.",
      zh: "负责 /deposit 路径的重新设计 — 构建了一个四步引导流程，带领用户从头到尾完成注资流程。",
    },
  },
  {
    key: "multichain",
    title: {
      en: "Multichain Integration",
      es: "Integración Multicadena",
      zh: "多链集成",
    },
    body: {
      en: "Worked on ckBTC conversion to solve the minimum-deposit friction — making $5 NFT purchases viable without requiring $80 in SOL.",
      es: "Trabajé en la conversión ckBTC para resolver la fricción de depósito mínimo — haciendo viable comprar NFTs de $5 sin necesitar $80 en SOL.",
      zh: "致力于 ckBTC 转换，以解决最低存款摩擦 — 让用户无需持有 80 美元的 SOL 也能购买 5 美元的 NFT。",
    },
  },
  {
    key: "dao",
    title: {
      en: "DAO on ICP",
      es: "DAO en ICP",
      zh: "ICP 上的 DAO",
    },
    body: {
      en: "Built and shipped features for a live Web3 DAO on Internet Computer Protocol, working directly with the Senior Dev and Founder.",
      es: "Desarrollé y entregué features para una DAO Web3 en vivo sobre Internet Computer Protocol, trabajando directo con el Senior Dev y el Founder.",
      zh: "为互联网计算机协议上的在线 Web3 DAO 开发并交付功能，与高级开发人员和创始人直接合作。",
    },
  },
] as const;

function localizedText(
  record: { en: string; es: string; zh: string },
  lang: Language
) {
  return record[lang];
}

export default function PlebesProjectGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -60, y: 60 },
    show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const grid = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.5 },
    },
  };

  const tile = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const badgeReveal = {
    hidden: { clipPath: "inset(0 100% 0 0)" },
    show: {
      clipPath: "inset(0 0% 0 0)",
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
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

  return (
    <section className={styles.screen} aria-labelledby="plebes-project-title">
      <motion.div
        className={styles.deployBadge}
        variants={badgeReveal}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
        style={{ transformOrigin: "left" }}
        aria-label={BADGE_COPY[language].aria}
      >
        <span className={styles.deployLabel}>{BADGE_COPY[language].label}</span>
        <div className={styles.deployNetwork}>
          <img
            className={styles.deployLogo}
            src="/icp_logo.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <span className={styles.deployName}>ICP!</span>
        </div>
      </motion.div>

      <motion.h2
        className={styles.mobileTitle}
        variants={logoItem}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <span>
          {language === "es"
            ? "Desarrollador del"
            : language === "zh"
              ? "Plebes 项目的"
              : "Developer for the"}
        </span>
        <span>
          <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
          {language === "es"
            ? " Proyecto"
            : language === "zh"
              ? "开发者"
              : " Project"}
        </span>
      </motion.h2>

      <div className={styles.scrollBody} data-carousel-scrollable="true">
        <div className={styles.inner}>
          <motion.div
            className={styles.copy}
            variants={container}
            initial="hidden"
            animate={isActive ? "show" : "hidden"}
          >
            <motion.h2 id="plebes-project-title" className={styles.title} variants={item}>
              {language === "zh"
                ? "Plebes 项目的开发者"
                : language === "es"
                  ? "desarrollador del proyecto"
                  : "developer for the"}{" "}
              <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
              {language === "en" && " project"}
            </motion.h2>
          </motion.div>

          <motion.div
            className={styles.media}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <img src="/mon_frame.png" alt="Mon frame artwork for the Plebes project" />
          </motion.div>

          <motion.div
            className={styles.details}
            variants={container}
            initial="hidden"
            animate={isActive ? "show" : "hidden"}
          >
            <motion.p className={styles.lead} variants={item}>
              {language === "es"
                ? "Como Desarrollador Frontend, rediseñé la homepage de Plebes, construí un flujo de depósito de 4 pasos e integré conversión ckBTC para esta DAO de NFTs en vivo sobre Internet Computer Protocol."
                : language === "zh"
                  ? "作为前端开发者，我重新设计了 Plebes 首页，构建了四步存款流程，并为这个运行在互联网计算机协议上的实时 NFT DAO 进行了 ckBTC 多链集成。"
                  : "As a Frontend Developer, I redesigned the Plebes homepage, built a 4-step deposit flow, and worked on ckBTC multichain integration for this live NFT DAO on Internet Computer Protocol."}
            </motion.p>
            <motion.a className={styles.cta} href="https://plebes.xyz" target="_blank" rel="noreferrer" variants={item}>
              <span>
                {language === "es"
                  ? "Visitar plebes.xyz"
                  : language === "zh"
                    ? "访问 plebes.xyz"
                    : "Visit plebes.xyz"}
              </span>
              <ExternalLink aria-hidden="true" size={16} strokeWidth={2.4} />
            </motion.a>
          </motion.div>

          <motion.div
            className={styles.contributionGrid}
            variants={grid}
            initial="hidden"
            animate={isActive ? "show" : "hidden"}
            aria-label={
              language === "es"
                ? "Contribuciones en Plebes"
                : language === "zh"
                  ? "在 Plebes 的贡献"
                  : "Plebes contributions"
            }
          >
            {contributions.map((contribution, index) => (
              <motion.article className={styles.contributionTile} variants={tile} key={contribution.key}>
                <span className={styles.tileIndex}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{localizedText(contribution.title, language)}</h3>
                <p>{localizedText(contribution.body, language)}</p>
              </motion.article>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
