"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import SectionHeader from "./section-header";

interface Stat {
  target: number;
  suffix: string;
  label: string;
  desc: string;
}

export default function RollingCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const stats: Stat[] =
    language === "zh"
      ? [
          { target: 47, suffix: "+", label: "项目", desc: "不同的方式解决同一个问题" },
          { target: 6, suffix: "", label: "年编码", desc: "迭代、打破、重写、学习" },
          { target: 12, suffix: "k", label: "提交", desc: "构成系统的微小痕迹" },
          { target: 1, suffix: "", label: "姿态", desc: "一个足以改变形式与意义关系的姿态" },
        ]
      : language === "es"
      ? [
          { target: 47, suffix: "+", label: "proyectos", desc: "formas distintas de resolver el mismo problema" },
          { target: 6, suffix: "", label: "años codeando", desc: "iterando, rompiendo, reescribiendo, aprendiendo" },
          { target: 12, suffix: "k", label: "commits", desc: "huellas pequeñas que componen un sistema" },
          { target: 1, suffix: "", label: "gesto", desc: "uno basta para cambiar la relación entre forma y sentido" },
        ]
      : [
          { target: 47, suffix: "+", label: "projects", desc: "different ways to solve the same problem" },
          { target: 6, suffix: "", label: "years coding", desc: "iterating, breaking, rewriting, learning" },
          { target: 12, suffix: "k", label: "commits", desc: "tiny traces that compose a system" },
          { target: 1, suffix: "", label: "gesture", desc: "one is enough to change the relation of form and sense" },
        ];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  return (
    <>
      <SectionHeader
        index="05"
        tag={language === "zh" ? "第 05 节 / 滚动计数器" : language === "es" ? "sección 05 / rolling counter" : "section 05 / rolling counter"}
        title={language === "zh" ? "计数器" : language === "es" ? "CONTADOR" : "COUNTER"}
        caption={language === "zh" ? "数字来之不易" : language === "es" ? "los números se ganan" : "numbers are earned"}
      />

      <div ref={ref} style={{ position: "relative" }}>
        <div
          className="v3-noise"
          style={{
            padding: "clamp(3rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem)",
            background: "var(--v3-bg)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            className="v3-count-label"
            style={{ display: "block", marginBottom: "3rem" }}
          >
            {language === "zh" ? "指标 / 数据 / 数字" : language === "es" ? "métricas / datos / cifras" : "metrics / data / figures"}
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "3rem 2rem",
            }}
          >
            {stats.map((s, i) => (
              <Stat key={s.label} stat={s} progress={smooth} idx={i} total={stats.length} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({
  stat,
  progress,
  idx,
  total,
}: {
  stat: Stat;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  idx: number;
  total: number;
}) {
  const start = 0.2 + (idx / total) * 0.4;
  const end = 0.45 + (idx / total) * 0.4;
  const value = useTransform(progress, [start, end], [0, stat.target]);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(value, "change", (v) => {
    setDisplay(Math.floor(v));
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: idx * 0.08 }}
      style={{ borderTop: "1px solid var(--v3-line)", paddingTop: "1.25rem" }}
    >
      <span className="v3-count-label">{stat.label}</span>
      <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
        <span className="v3-count-num">{display}</span>
        <span className="v3-count-suffix">{stat.suffix}</span>
      </div>
      <p className="v3-count-desc">{stat.desc}</p>
    </motion.div>
  );
}
