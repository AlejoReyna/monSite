"use client";

import { useRef, useMemo, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import SectionHeader from "./section-header";

export default function MosaicWave() {
  const ref = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const [progress, setProgress] = useState(0);

  // 12 cols * 6 rows = 72 cells. Tech labels overlay on specific cells.
  const COLS = 12;
  const ROWS = 6;
  const TOTAL = COLS * ROWS;

  const techLabels = useMemo(
    () => [
      { idx: 14, label: "Next" },
      { idx: 18, label: "React" },
      { idx: 22, label: "Vue" },
      { idx: 27, label: "TS" },
      { idx: 33, label: "Tailwind" },
      { idx: 39, label: "Node" },
      { idx: 44, label: "Postgres" },
      { idx: 49, label: "AWS" },
      { idx: 54, label: "Docker" },
      { idx: 58, label: "Figma" },
      { idx: 62, label: "Solidity" },
      { idx: 67, label: "Rust" },
    ],
    []
  );
  const techMap = useMemo(() => {
    const map = new Map<number, string>();
    techLabels.forEach((t) => map.set(t.idx, t.label));
    return map;
  }, [techLabels]);

  const order = useMemo(() => {
    // diagonal wave order based on (row + col)
    const idxs = Array.from({ length: TOTAL }, (_, i) => i);
    return idxs.sort((a, b) => {
      const ra = Math.floor(a / COLS), ca = a % COLS;
      const rb = Math.floor(b / COLS), cb = b % COLS;
      return (ra + ca) - (rb + cb);
    });
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // active range: 0.15 → 0.7
    const local = Math.min(1, Math.max(0, (v - 0.15) / 0.55));
    setProgress(local);
  });

  const activeCount = Math.floor(progress * TOTAL);

  return (
    <>
      <SectionHeader
        index="06"
        tag={language === "zh" ? "第 06 节 / 网格波浪 / 技术栈" : language === "es" ? "sección 06 / grid wave / stack" : "section 06 / grid wave / stack"}
        title={language === "zh" ? "马赛克" : language === "es" ? "MOSAICO" : "MOSAIC"}
        caption={language === "zh" ? "技术栈如波浪" : language === "es" ? "el stack como ola" : "the stack as a wave"}
      />

      <div ref={ref} style={{ height: "180vh", position: "relative" }}>
        <div
          className="v3-noise"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            padding: "clamp(2rem, 5vw, 4rem) clamp(1.5rem, 6vw, 5rem)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: "var(--v3-bg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "1.5rem",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--v3-muted)",
            }}
          >
            <span>{language === "zh" ? "向下滚动揭示技术栈" : language === "es" ? "desplaza para revelar el stack" : "scroll to reveal the stack"}</span>
            <span style={{ color: "var(--v3-gold)" }}>
              {Math.round(progress * 100)}%
            </span>
          </div>

          <div ref={gridRef} className="v3-mosaic-grid">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const sortedIndex = order.indexOf(i);
              const on = sortedIndex < activeCount;
              const isTech = techMap.has(i);
              return (
                <motion.div
                  key={i}
                  className={`v3-mosaic-cell ${on ? "on" : ""} ${on && isTech ? "tech" : ""}`}
                  style={{ transitionDelay: `${(sortedIndex % 6) * 25}ms` }}
                >
                  {on && isTech ? techMap.get(i) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
