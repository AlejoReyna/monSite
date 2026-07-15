"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useLanguage } from "@/components/lang-context";
import SectionHeader from "./section-header";

export default function ParallaxDepth() {
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });

  // distintas velocidades por capa
  const midY = useTransform(smooth, [0, 1], ["-25%", "25%"]);
  const fgY = useTransform(smooth, [0, 1], ["-45%", "45%"]);
  const numScale = useTransform(smooth, [0, 1], [0.85, 1.15]);

  const services =
    language === "zh"
      ? [
          { tag: "01", title: "Web", body: "Next.js · React · Vue · TypeScript" },
          { tag: "02", title: "设计", body: "UX · UI · 系统 · 原型" },
          { tag: "03", title: "云", body: "AWS · Docker · CI/CD · 数据" },
        ]
      : language === "es"
      ? [
          { tag: "01", title: "Web", body: "Next.js · React · Vue · TypeScript" },
          { tag: "02", title: "Diseño", body: "UX · UI · sistemas · prototipos" },
          { tag: "03", title: "Cloud", body: "AWS · Docker · CI/CD · datos" },
        ]
      : [
          { tag: "01", title: "Web", body: "Next.js · React · Vue · TypeScript" },
          { tag: "02", title: "Design", body: "UX · UI · systems · prototypes" },
          { tag: "03", title: "Cloud", body: "AWS · Docker · CI/CD · data" },
        ];

  return (
    <>
      <SectionHeader
        index="03"
        tag={language === "zh" ? "第 03 节 / 视差层" : language === "es" ? "sección 03 / parallax layers" : "section 03 / parallax layers"}
        title={language === "zh" ? "深度" : language === "es" ? "PROFUNDIDAD" : "DEPTH"}
        caption={language === "zh" ? "每一层都有自己的速度" : language === "es" ? "cada capa a su propia velocidad" : "each layer at its own pace"}
      />

      <div ref={ref} style={{ height: "200vh", position: "relative" }}>
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
          {/* capa media: contenido */}
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              padding: "clamp(1.5rem, 6vw, 5rem)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              y: midY,
            }}
          >
            <span className="v3-depth-eyebrow" style={{ marginBottom: "1.5rem" }}>
              {language === "zh" ? "服务 / 层" : language === "es" ? "servicios / capas" : "services / layers"}
            </span>
            <h2 className="v3-depth-heading" style={{ marginBottom: "1.5rem", maxWidth: "16ch" }}>
              {language === "zh" ? (
                <>
                  层与层<br />
                  并不占据<br />
                  <em>同一时间</em>
                </>
              ) : language === "es" ? (
                <>
                  Las capas<br />
                  no ocupan el<br />
                  <em>mismo tiempo</em>
                </>
              ) : (
                <>
                  Layers don&apos;t<br />
                  occupy the<br />
                  <em>same time</em>
                </>
              )}
            </h2>
            <p className="v3-depth-body">
              {language === "zh"
                ? "设计、工程与基础设施以不同速度运转。平面之间的差异赋予产品深度。"
                : language === "es"
                ? "Diseño, ingeniería e infraestructura se mueven a velocidades distintas. La diferencia entre planos es lo que da profundidad al producto."
                : "Design, engineering and infrastructure move at different speeds. The difference between layers is what gives the product its depth."}
            </p>

            {/* mini grid de servicios */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.5rem",
                marginTop: "2.5rem",
                maxWidth: "780px",
              }}
            >
              {services.map((s) => (
                <div
                  key={s.tag}
                  style={{
                    borderTop: "1px solid var(--v3-line)",
                    paddingTop: "1rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.55rem",
                      letterSpacing: "0.3em",
                      color: "var(--v3-gold)",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.tag}
                  </span>
                  <h3
                    className="v3-display"
                    style={{
                      fontSize: "1.6rem",
                      lineHeight: 1,
                      marginTop: "0.5rem",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="v3-serif"
                    style={{
                      fontStyle: "italic",
                      color: "var(--v3-muted)",
                      fontSize: "0.85rem",
                      marginTop: "0.5rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* capa frente: número grande */}
          <motion.div
            style={{
              position: "absolute",
              right: "clamp(1rem, 4vw, 4rem)",
              bottom: "0",
              y: fgY,
              scale: numScale,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.55rem",
                letterSpacing: "0.4em",
                color: "var(--v3-ember)",
                textTransform: "uppercase",
                textAlign: "right",
                marginBottom: "0.5rem",
              }}
            >
              {language === "zh" ? "前景" : language === "es" ? "primer plano" : "foreground"}
            </span>
            <div className="v3-depth-big-num">03</div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
