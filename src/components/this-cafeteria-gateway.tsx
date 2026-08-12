"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./this-cafeteria-gateway.module.css";

/**
 * The Artisanal Brew gateway, carrying the real hero.
 *
 * Ported from ThisCafeteria.Web — Components/Home/PixelHome.razor for the
 * copy and headline extrusion, and Components/Layout/NavMenu.razor for the
 * top section, including its own breakpoints. This used to be a screen
 * recording of the hero behind a separate wordmark card; now it's the hero
 * itself, so what shows up here tracks what's actually live.
 *
 * The deploy badge and tech-stack row are this portfolio's own addition —
 * the real hero doesn't advertise its own stack — restyled in the hero's
 * monospace/copper palette instead of the old card's serif/Inter look.
 */

const DEPLOYMENT_URL = "https://cafe.alexisreyna.dev";
const REPO_URL = "https://github.com/AlejoReyna/tcde";

const TITLE_LINES = ["ARTISANAL", "BREW"] as const;

const STARS = Array.from({ length: 12 }, (_, index) => index + 1);

const simpleIcon = (slug: string, color = "f4efe6") =>
  `https://cdn.simpleicons.org/${slug}/${color}`;

// The real deployment is multichain (see deployments/ in the repo: Ethereum
// Sepolia, BSC testnet, Solana devnet), so the badge reveals all three in
// turn — one every 1.5s — settling into a permanent row rather than
// replacing one with the next.
const NETWORKS = [
  { chain: "ETH", name: "Sepolia", logo: "/eth_logo.png" },
  { chain: "BSC", name: "Testnet", logo: simpleIcon("binance", "f0b90b") },
  { chain: "Solana", name: "Devnet", logo: simpleIcon("solana", "9945FF") },
] as const;

const NETWORK_INTERVAL_MS = 1500;

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
  let letterIndex = 0;

  // `step` walks 0 → NETWORKS.length + 1, one tick every 1.5s. Network `i`
  // is visible once step > i, and it's the one "announcing" its full name
  // for exactly one tick (step === i + 1) before collapsing to an icon —
  // including the last one, which gets its own extra tick to collapse in.
  // A ref (not state) marks it done so a later isActive toggle can't
  // restart the sequence and flicker icons that already settled in.
  const [step, setStep] = useState(0);
  const hasSettledRef = useRef(false);

  useEffect(() => {
    if (!isActive || hasSettledRef.current) return;

    const totalSteps = NETWORKS.length + 1;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setStep(current);
      if (current >= totalSteps) {
        hasSettledRef.current = true;
        clearInterval(id);
      }
    }, NETWORK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActive]);

  // Once every network has announced and collapsed, the row settles under a
  // single summary caption instead of staying blank.
  const settled = step > NETWORKS.length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const badgeContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0, delayChildren: 1.05 },
    },
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
        className={styles.scene}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.1 }}
      >
        {STARS.map((n) => (
          <span key={n} className={`${styles.star} ${styles[`star${n}`]}`} />
        ))}
        <Image className={styles.andromeda} src="/blog/artisanal-brew-assets/pl-andromeda.png" alt="" width={132} height={84} unoptimized />
        <Image className={styles.planet} src="/blog/artisanal-brew-assets/pl-planet.png" alt="" width={32} height={32} unoptimized />
        <Image className={styles.planetRinged} src="/blog/artisanal-brew-assets/pl-planet-ringed.png" alt="" width={40} height={32} unoptimized />
        <Image className={`${styles.chain} ${styles.chainEth}`} src="/blog/artisanal-brew-assets/pl-chain-ethereum.png" alt="" width={48} height={48} unoptimized />
        <Image className={`${styles.chain} ${styles.chainSol}`} src="/blog/artisanal-brew-assets/pl-chain-solana.png" alt="" width={48} height={48} unoptimized />
        <Image className={`${styles.chain} ${styles.chainBnb}`} src="/blog/artisanal-brew-assets/pl-chain-bnb.png" alt="" width={48} height={48} unoptimized />
        <Image className={`${styles.coin} ${styles.coinOne}`} src="/blog/artisanal-brew-assets/coffee-coin-pixel.png" alt="" width={32} height={32} unoptimized />
        <Image className={`${styles.coin} ${styles.coinTwo}`} src="/blog/artisanal-brew-assets/coffee-coin-pixel.png" alt="" width={32} height={32} unoptimized />
        <Image className={styles.mug} src="/blog/artisanal-brew-assets/pl-mug-coffee.png" alt="" width={24} height={24} unoptimized />

        <span className={`${styles.crew} ${styles.crewOne}`} />
        <span className={`${styles.crew} ${styles.crewTwo}`} />
        <span className={`${styles.crew} ${styles.crewThree}`} />
        <span className={`${styles.crew} ${styles.crewFour}`} />
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
        <div
          className={styles.deployNetworkRow}
          aria-label={NETWORKS.map((n) => `${n.chain} ${n.name}`).join(", ")}
        >
          {NETWORKS.map((n, index) => {
            const visible = step > index;
            if (!visible) return null;
            const announcing = step === index + 1;

            return (
              <motion.div
                key={n.chain}
                layout
                className={styles.deployNetworkIcon}
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              >
                <Image
                  className={styles.deployLogo}
                  src={n.logo}
                  alt={`${n.chain} ${n.name}`}
                  title={`${n.chain} ${n.name}`}
                  width={27}
                  height={27}
                  loading="lazy"
                  unoptimized
                />
                <AnimatePresence>
                  {announcing && (
                    <motion.span
                      className={styles.deployNetworkLabel}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                    >
                      {n.chain} {n.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {settled && (
            <motion.span
              className={styles.deploySummary}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Three testnets
            </motion.span>
          )}
        </AnimatePresence>

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
          <motion.h2 id="this-cafeteria-title" className={styles.title} variants={item} aria-label="Artisanal Brew">
            {TITLE_LINES.map((line) => (
              <span className={styles.line} key={line}>
                {line.split(" ").map((word) => (
                  <span className={styles.word} key={word}>
                    {Array.from(word, (letter, index) => (
                      <span
                        className={styles.letter}
                        key={index}
                        style={{ "--i": letterIndex++ } as CSSProperties}
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            ))}
          </motion.h2>

          <motion.p className={styles.lede} variants={item}>
            Stake CAFE while it roasts, and watch a friendly pixel crew run
            wallet-signed test missions on-chain.
          </motion.p>

          <motion.div className={styles.ctas} variants={item}>
            <a className={styles.cta} href={DEPLOYMENT_URL} target="_blank" rel="noreferrer">
              Visit
            </a>
            <a className={`${styles.cta} ${styles.ctaGhost}`} href={REPO_URL} target="_blank" rel="noreferrer">
              GitHub
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
