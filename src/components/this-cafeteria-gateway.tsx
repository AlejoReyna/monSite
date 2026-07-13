"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./this-cafeteria-gateway.module.css";

const DEPLOYMENT_URL = "https://cafe.alexisreyna.dev";
const DOCS_URL = "https://github.com/AlejoReyna/tcde";

const simpleIcon = (slug: string, color = "f8f5ea") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

const techStack = [
  { label: ".NET", logo: simpleIcon("dotnet") },
  { label: "Blazor", logo: simpleIcon("blazor") },
  { label: "PostgreSQL", logo: simpleIcon("postgresql") },
  {
    label: "Azure",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg",
    tint: true,
  },
  { label: "Ethereum", logo: simpleIcon("ethereum") },
  { label: "Solidity", logo: simpleIcon("solidity") },
  { label: "Docker", logo: simpleIcon("docker") },
  { label: "GitHub", logo: simpleIcon("github") },
] as const;

export default function ThisCafeteriaGateway({ isActive = false }: { isActive?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {
        // Autoplay may be blocked by the browser; the poster/overlay still shows.
      });
    } else {
      video.pause();
    }
  }, [isActive]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const badgeContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0, delayChildren: 1.05 },
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
          className={`${styles.techLogo} ${"tint" in tech && tech.tint ? styles.techLogoTint : ""}`}
          src={tech.logo}
          alt={tech.label}
          title={tech.label}
          loading="lazy"
        />
      </motion.li>
    ));

  return (
    <section className={styles.screen} aria-labelledby="this-cafeteria-title">
      <motion.div
        className={styles.backgroundCol}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.1 }}
      >
        <video
          ref={videoRef}
          className={styles.backgroundVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
        </video>
      </motion.div>

      <motion.div
        className={styles.deployBadge}
        variants={badgeContainer}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <motion.span className={styles.deployLabel} variants={item}>
          Deployed on
        </motion.span>
        <motion.div className={styles.deployNetwork} variants={item} aria-label="Ethereum Sepolia">
          <img
            className={styles.deployLogo}
            src="/eth_logo.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <span className={styles.deployNetworkText}>
            <span className={styles.deployChain}>Ethereum</span>
            <span className={styles.deployName}>Sepolia</span>
          </span>
        </motion.div>

        <motion.ul
          className={`${styles.techRow} ${styles.techRowTop}`}
          variants={logoGroup}
          aria-label="Artisanal Brew tech stack"
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
          <motion.h1 id="this-cafeteria-title" className={styles.wordmark} variants={item}>
            <span className={styles.wordmarkTop}>Artisanal</span>
            {" "}
            <span className={styles.wordmarkBottom}>Brew</span>
          </motion.h1>

          <motion.p className={styles.lead} variants={item}>
            A cloud-ready ASP.NET commerce platform for specialty coffee — Blazor storefronts,
            Identity-protected orders, and Ethereum Sepolia payments, staking, and rewards.
          </motion.p>

          <motion.div className={styles.actions} variants={item}>
            <a
              className={styles.ctaPrimary}
              href={DEPLOYMENT_URL}
              target="_blank"
              rel="noreferrer"
            >
              View deployment <span aria-hidden="true">→</span>
            </a>
            <a
              className={styles.ctaSecondary}
              href={DOCS_URL}
              target="_blank"
              rel="noreferrer"
            >
              Docs <span aria-hidden="true">↗</span>
            </a>
          </motion.div>

          <motion.ul
            className={`${styles.techRow} ${styles.techRowBottom}`}
            variants={logoGroup}
            aria-label="Artisanal Brew tech stack"
          >
            {renderTechItems()}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  );
}
