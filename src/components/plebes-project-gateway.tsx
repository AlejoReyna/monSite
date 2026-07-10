"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import styles from "./plebes-project-gateway.module.css";

const simpleIcon = (slug: string, color = "fff7ff") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const techStack = [
  { label: "ICP", logo: simpleIcon("internetcomputer") },
  { label: "Motoko", logo: "/motoko.svg" },
  { label: "Web3", logo: simpleIcon("web3dotjs") },
  { label: "Figma", logo: simpleIcon("figma") },
] as const;

const contributions = [
  {
    key: "homepage",
    title: { en: "Homepage Redesign", es: "Rediseño de Homepage" },
    body: {
      en: "Replaced a bloated info-heavy site with a single-page minimal design plus a public DAO treasury view for full ownership transparency.",
      es: "Reemplacé un sitio cargado de información con un diseño minimalista de una sola página y una vista pública del tesoro DAO para transparencia total.",
    },
  },
  {
    key: "deposit",
    title: { en: "Deposit Flow UX", es: "UX del Flujo de Depósito" },
    body: {
      en: "Owned the /deposit path redesign — built a 4-step guided process that walked users through the funding flow end to end.",
      es: "Lideré el rediseño de /deposit — construí un flujo guiado de 4 pasos que lleva al usuario de principio a fin en el proceso de fondeo.",
    },
  },
  {
    key: "multichain",
    title: { en: "Multichain Integration", es: "Integración Multicadena" },
    body: {
      en: "Worked on ckBTC conversion to solve the minimum-deposit friction — making $5 NFT purchases viable without requiring $80 in SOL.",
      es: "Trabajé en la conversión ckBTC para resolver la fricción de depósito mínimo — haciendo viable comprar NFTs de $5 sin necesitar $80 en SOL.",
    },
  },
  {
    key: "dao",
    title: { en: "DAO on ICP", es: "DAO en ICP" },
    body: {
      en: "Built and shipped features for a live Web3 DAO on Internet Computer Protocol, working directly with the Senior Dev and Founder.",
      es: "Desarrollé y entregué features para una DAO Web3 en vivo sobre Internet Computer Protocol, trabajando directo con el Senior Dev y el Founder.",
    },
  },
] as const;

export default function PlebesProjectGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();
  const isEs = language === "es";

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

  const logoGroup = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
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
    <section className={styles.screen} aria-labelledby="plebes-project-title" data-carousel-scrollable="true">
      <motion.div
        className={styles.deployBadge}
        variants={badgeReveal}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
        style={{ transformOrigin: "left" }}
        aria-label="As seen on ICP"
      >
        <span className={styles.deployLabel}>as seen on</span>
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
        <span>{isEs ? "Desarrollador del" : "Developer for the"}</span>
        <span>
          <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
          {isEs ? " Proyecto" : " Project"}
        </span>
      </motion.h2>

      <div className={styles.inner}>
        <motion.div 
          className={styles.copy}
          variants={container}
          initial="hidden"
          animate={isActive ? "show" : "hidden"}
        >
          <motion.h2 id="plebes-project-title" className={styles.title} variants={item}>
            {isEs ? "desarrollador del proyecto" : "developer for the"}{" "}
            <img className={styles.logoWord} src="/plebeslogo.svg" alt="plebes" />
            {!isEs && " project"}
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
            {isEs
              ? "Como Desarrollador Frontend, rediseñé la homepage de Plebes, construí un flujo de depósito de 4 pasos e integré conversión ckBTC para esta DAO de NFTs en vivo sobre Internet Computer Protocol."
              : "As a Frontend Developer, I redesigned the Plebes homepage, built a 4-step deposit flow, and worked on ckBTC multichain integration for this live NFT DAO on Internet Computer Protocol."}
          </motion.p>
          <motion.a className={styles.cta} href="https://plebes.xyz" target="_blank" rel="noreferrer" variants={item}>
            <span>{isEs ? "Visitar plebes.xyz" : "Visit plebes.xyz"}</span>
            <ExternalLink aria-hidden="true" size={16} strokeWidth={2.4} />
          </motion.a>
        </motion.div>

        <motion.div
          className={styles.contributionGrid}
          variants={grid}
          initial="hidden"
          animate={isActive ? "show" : "hidden"}
          aria-label={isEs ? "Contribuciones en Plebes" : "Plebes contributions"}
        >
          {contributions.map((contribution, index) => (
            <motion.article className={styles.contributionTile} variants={tile} key={contribution.key}>
              <span className={styles.tileIndex}>{String(index + 1).padStart(2, "0")}</span>
              <h3>{isEs ? contribution.title.es : contribution.title.en}</h3>
              <p>{isEs ? contribution.body.es : contribution.body.en}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.ul
          className={styles.techRow}
          variants={logoGroup}
          initial="hidden"
          animate={isActive ? "show" : "hidden"}
          aria-label="Plebes tech stack"
        >
          {techStack.map((tech) => (
            <motion.li key={tech.label} className={styles.techChip} variants={logoItem}>
              <img
                className={styles.techLogo}
                src={tech.logo}
                alt={tech.label}
                title={tech.label}
                loading="lazy"
              />
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
