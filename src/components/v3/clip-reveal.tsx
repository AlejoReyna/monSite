"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import SectionHeader from "./section-header";

export default function ClipReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // clip-path: from a sliver in center to fully open
  const clip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(50% 50% 50% 50%)", "inset(0% 0% 0% 0%)"]
  );
  const pct = useTransform(scrollYProgress, (v) => `${Math.round(v * 100)}%`);

  return (
    <>
      <SectionHeader
        index="01"
        tag={language === "zh" ? "第 01 节 / 裁剪揭示" : language === "es" ? "sección 01 / clip-path reveal" : "section 01 / clip-path reveal"}
        title={language === "zh" ? "开篇" : language === "es" ? "APERTURA" : "OPENING"}
        caption={language === "zh" ? "滚动展开隐藏之物" : language === "es" ? "el scroll expande lo oculto" : "scroll expands the hidden"}
      />

      <div ref={ref} style={{ height: "260vh", position: "relative" }}>
        <div
          className="v3-noise"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* background placeholder */}
          <div className="v3-clip-bg">
            <span className="v3-clip-bg-hint">
              {language === "zh" ? "向下滚动以揭示" : language === "es" ? "desplaza para revelar" : "scroll to reveal"}
            </span>
          </div>

          {/* clipped reveal */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--v3-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(1.5rem, 6vw, 5rem)",
              clipPath: clip,
              WebkitClipPath: clip,
            }}
          >
            <blockquote className="v3-clip-quote">
              {language === "zh" ? (
                <>
                  一切尚未被看见之物<br />
                  已然<strong>存在</strong>。<br />
                  只待那个姿态<br />
                  来<strong>召唤</strong>它。
                </>
              ) : language === "es" ? (
                <>
                  Todo lo que aún no se ve<br />
                  ya <strong>existe</strong>.<br />
                  Solo espera el gesto<br />
                  que lo <strong>invoque</strong>.
                </>
              ) : (
                <>
                  Everything not yet seen<br />
                  already <strong>exists</strong>.<br />
                  It only awaits the gesture<br />
                  that <strong>summons</strong> it.
                </>
              )}
            </blockquote>

            <motion.span
              style={{
                position: "absolute",
                bottom: "1.5rem",
                right: "1.5rem",
                fontSize: "0.6rem",
                letterSpacing: "0.3em",
                color: "var(--v3-gold)",
                textTransform: "uppercase",
              }}
            >
              <motion.span>{pct}</motion.span>
            </motion.span>
          </motion.div>
        </div>
      </div>
    </>
  );
}
