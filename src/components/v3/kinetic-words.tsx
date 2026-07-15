"use client";

import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import SectionHeader from "./section-header";

export default function KineticWords() {
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const phrase = useMemo(
    () =>
      (language === "zh"
        ? "设计与代码并重 · 我构建快速、清晰且可扩展的网页产品 · 每一个决定都留下痕迹 · 每一次交互都值得用心 · 我编写有温度的软件 · 简单。"
        : language === "es"
        ? "Diseño y código a partes iguales · construyo productos web rápidos, claros y escalables · cada decisión deja una huella · cada interacción merece intención · escribo software que se siente · simple."
        : "Design and code in equal measure · I build web products that are fast, clear and scalable · every decision leaves a trace · every interaction deserves intention · I write software that feels · simple.")
        .split(" "),
    [language]
  );

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <>
      <SectionHeader
        index="02"
        tag={language === "zh" ? "第 02 节 / 动态文字" : language === "es" ? "sección 02 / kinetic text" : "section 02 / kinetic text"}
        title={language === "zh" ? "宣言" : language === "es" ? "MANIFIESTO" : "MANIFESTO"}
        caption={language === "zh" ? "每一个字都来之不易" : language === "es" ? "cada palabra se gana" : "every word is earned"}
      />

      <div ref={ref} style={{ height: "300vh", position: "relative" }}>
        <div
          className="v3-noise"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            padding: "0 clamp(1.5rem, 6vw, 5rem)",
          }}
        >
          <div className="v3-words-bg-num" aria-hidden>
            02
          </div>

          <p
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: "1100px",
              lineHeight: 1.05,
            }}
          >
            {phrase.map((word, i) => (
              <Word
                key={`${word}-${i}`}
                word={word}
                start={i / phrase.length}
                end={(i + 1) / phrase.length}
                progress={scrollYProgress}
                gold={i % 7 === 0}
              />
            ))}
          </p>
        </div>
      </div>
    </>
  );
}

function Word({
  word,
  start,
  end,
  progress,
  gold,
}: {
  word: string;
  start: number;
  end: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  gold: boolean;
}) {
  // map scroll progress to a per-word reveal between 0.2 and 0.85
  const localStart = 0.2 + start * 0.65;
  const localEnd = 0.2 + end * 0.65;
  const opacity = useTransform(progress, [localStart, localEnd], [0.18, 1]);
  const y = useTransform(progress, [localStart, localEnd], [12, 0]);

  return (
    <motion.span
      className={`v3-manifesto-word ${gold ? "gold" : ""}`}
      style={{ opacity, y }}
    >
      {word}
    </motion.span>
  );
}
