"use client";

import { useEffect, useRef } from "react";

/**
 * The two figures for the Evolution Strategies section.
 *
 * `generation-loop` is the map of one generation of train_pixel_crew.mjs, so
 * the code block after it reads as an implementation of something the reader
 * has already seen. `rank-normalise` exists because the collapse from raw
 * returns to positions is the one step prose keeps failing to make concrete:
 * the disaster run has to visibly lose one place, not eighteen points.
 *
 * Both are static SVG on a dark card — hairline strokes over a near-black
 * canvas, the same register as a rendered README.
 */

type Stage = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
};

const LOOP_STAGES: Stage[] = [
  { x: 30, y: 95, w: 140, h: 60, title: "theta", sub: "258 pesos" },
  { x: 205, y: 95, w: 170, h: 60, title: "gaussianNoise()", sub: "32 vectores ε" },
  { x: 440, y: 45, w: 150, h: 54, title: "θ + σε", sub: "32 individuos" },
  { x: 440, y: 140, w: 150, h: 54, title: "θ − σε", sub: "32 individuos" },
  { x: 660, y: 95, w: 190, h: 60, title: "evaluate()", sub: "3 episodios · promedio" },
  { x: 650, y: 235, w: 200, h: 60, title: "returns[64]", sub: "un retorno por individuo" },
  { x: 390, y: 235, w: 210, h: 60, title: "rankNormalise()", sub: "posición → [-0.5, 0.5]" },
  { x: 110, y: 235, w: 230, h: 60, title: "estimateGradient()", sub: "Σ ε · rango ÷ (n · σ)" },
];

function StageBox({ stage }: { stage: Stage }) {
  const cx = stage.x + stage.w / 2;
  const cy = stage.y + stage.h / 2;

  return (
    <g>
      <rect
        x={stage.x}
        y={stage.y}
        width={stage.w}
        height={stage.h}
        rx="6"
        className="blog-es-diagram__box"
      />
      <text x={cx} y={stage.sub ? cy - 6 : cy} className="blog-es-diagram__box-title">
        {stage.title}
      </text>
      {stage.sub && (
        <text x={cx} y={cy + 14} className="blog-es-diagram__box-sub">
          {stage.sub}
        </text>
      )}
    </g>
  );
}

function GenerationLoop() {
  return (
    <svg
      className="blog-es-diagram__svg blog-es-diagram__svg--loop"
      viewBox="0 0 900 340"
      role="img"
      aria-labelledby="es-loop-title es-loop-desc"
    >
      <title id="es-loop-title">Una generación de Evolution Strategies</title>
      <desc id="es-loop-desc">
        Los pesos theta se combinan con treinta y dos vectores de ruido
        gaussiano, cada uno aplicado en las dos direcciones para formar sesenta
        y cuatro individuos. Cada individuo se evalúa en tres episodios; los
        sesenta y cuatro retornos se convierten en posiciones dentro del grupo,
        se combinan con sus ruidos para estimar un gradiente y el resultado se
        suma a theta. El ciclo se repite trescientas veces.
      </desc>

      <defs>
        <marker
          id="es-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="blog-es-diagram__arrowhead" />
        </marker>
      </defs>

      <g className="blog-es-diagram__flow" aria-hidden="true">
        {/* theta → ruido */}
        <path d="M 170 125 H 200" />
        {/* ruido → par espejeado */}
        <path d="M 375 125 H 405 V 72 H 435" />
        <path d="M 375 125 H 405 V 167 H 435" />
        {/* par espejeado → evaluate */}
        <path d="M 590 72 H 625 V 125 H 655" />
        <path d="M 590 167 H 625 V 125 H 655" />
        {/* evaluate → retornos (baja de fila) */}
        <path d="M 755 155 V 230" />
        {/* la fila de abajo corre de derecha a izquierda */}
        <path d="M 650 265 H 605" />
        <path d="M 390 265 H 345" />
        {/* actualización: vuelve a theta */}
        <path d="M 110 265 H 70 V 160" />
      </g>

      {LOOP_STAGES.map((stage) => (
        <StageBox key={stage.title} stage={stage} />
      ))}

      <g className="blog-es-diagram__note" aria-hidden="true">
        <text x="414" y="128">σ = 0.1</text>
        <text x="770" y="205">64 evaluaciones</text>
        <text x="84" y="200">θ += 0.03 · ĝ</text>
      </g>

      <g className="blog-es-diagram__tag" aria-hidden="true">
        <rect x="655" y="22" width="195" height="24" rx="4" />
        <text x="752" y="38">pixelCrewSim.js — caja negra</text>
      </g>

      <g className="blog-es-diagram__cycle" aria-hidden="true">
        <text x="30" y="325">× 300 generaciones</text>
      </g>
    </svg>
  );
}

/** Eight of the sixty-four individuals, ordered best to worst. */
const SAMPLE_RETURNS = [31.4, 27.9, 27.2, 26.4, 25.8, 24.1, 22.6, 4.3];
const RAW_SCALE = 160 / 32;
const SHAPED_SCALE = 170;
const AXIS_X = 390;
const ROW_TOP = 96;
const ROW_STEP = 32;
const BAR_H = 16;

function RankNormalise() {
  const rows = SAMPLE_RETURNS.map((value, index) => ({
    value,
    // rankNormalise: best = +0.5, worst = -0.5, evenly spaced in between.
    shaped: 0.5 - index / (SAMPLE_RETURNS.length - 1),
    y: ROW_TOP + index * ROW_STEP,
    delay: `${index * 70}ms`,
    worst: index === SAMPLE_RETURNS.length - 1,
  }));

  return (
    <svg
      className="blog-es-diagram__svg blog-es-diagram__svg--rank"
      viewBox="0 0 560 390"
      role="img"
      aria-labelledby="es-rank-title es-rank-desc"
    >
      <title id="es-rank-title">
        Retornos crudos convertidos en posiciones dentro de la generación
      </title>
      <desc id="es-rank-desc">
        Ocho de los sesenta y cuatro individuos. A la izquierda, el retorno
        promedio de cada uno: siete quedan entre 22 y 32 puntos, y el último se
        hunde en 4.3. A la derecha, el peso que cada uno recibe tras
        rankNormalise: valores repartidos de forma pareja entre más 0.5 y menos
        0.5, así que el peor individuo pierde un puesto y no dieciocho puntos.
      </desc>

      <g className="blog-es-diagram__panel-label" aria-hidden="true">
        <text x="20" y="52">returns[k]</text>
        <text x="20" y="68" className="blog-es-diagram__panel-sub">
          promedio de 3 episodios
        </text>
        <text x="300" y="52">shaped[k]</text>
        <text x="300" y="68" className="blog-es-diagram__panel-sub">
          posición dentro de la generación
        </text>
      </g>

      <line
        x1={AXIS_X}
        y1="80"
        x2={AXIS_X}
        y2="348"
        className="blog-es-diagram__axis"
        aria-hidden="true"
      />

      <g aria-hidden="true">
        {rows.map((row) => (
          <g
            key={row.value}
            className={
              row.worst
                ? "blog-es-diagram__row blog-es-diagram__row--worst"
                : "blog-es-diagram__row"
            }
          >
            <rect
              x="20"
              y={row.y}
              width={Math.max(row.value * RAW_SCALE, 2)}
              height={BAR_H}
              style={{ transitionDelay: row.delay }}
              className="blog-es-diagram__bar-raw"
            />
            <text
              x={20 + row.value * RAW_SCALE + 8}
              y={row.y + BAR_H / 2 + 1}
              style={{ transitionDelay: row.delay }}
              className="blog-es-diagram__value"
            >
              {row.value.toFixed(1)}
            </text>

            <rect
              x={row.shaped >= 0 ? AXIS_X : AXIS_X + row.shaped * SHAPED_SCALE}
              y={row.y}
              width={Math.abs(row.shaped * SHAPED_SCALE)}
              height={BAR_H}
              style={{ transitionDelay: row.delay }}
              className={
                row.shaped >= 0
                  ? "blog-es-diagram__bar-shaped blog-es-diagram__bar-shaped--up"
                  : "blog-es-diagram__bar-shaped blog-es-diagram__bar-shaped--down"
              }
            />
            <text
              x={
                row.shaped >= 0
                  ? AXIS_X + row.shaped * SHAPED_SCALE + 8
                  : AXIS_X + row.shaped * SHAPED_SCALE - 8
              }
              y={row.y + BAR_H / 2 + 1}
              style={{ transitionDelay: row.delay }}
              className={
                row.shaped >= 0
                  ? "blog-es-diagram__value"
                  : "blog-es-diagram__value blog-es-diagram__value--end"
              }
            >
              {row.shaped > 0 ? `+${row.shaped.toFixed(2)}` : row.shaped.toFixed(2)}
            </text>
          </g>
        ))}
      </g>

      <g className="blog-es-diagram__note" aria-hidden="true">
        <text x="20" y="368">
          el peor de la generación pierde un puesto, no 18 puntos
        </text>
      </g>
    </svg>
  );
}

export default function EsTrainingDiagram({
  variant,
  caption,
  bleed = true,
}: {
  variant: "generation-loop" | "rank-normalise";
  caption?: string;
  /** Off when the figure sits inside a row that already carries the bleed. */
  bleed?: boolean;
}) {
  const figureRef = useRef<HTMLElement>(null);

  /**
   * Two-step so the bars are never stuck at zero: the collapsed state is
   * armed on the DOM only after mount, and released once the figure is on
   * screen. Server output — and a reader with scripting off — sees them full.
   */
  useEffect(() => {
    if (variant !== "rank-normalise") return;

    const node = figureRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chart = node.querySelector(".blog-es-diagram__svg--rank");
    chart?.classList.add("is-armed");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.classList.add("is-grown");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [variant]);

  return (
    <figure
      ref={figureRef}
      className={`blog-es-diagram${bleed ? " blog-bleed" : ""}`}
    >
      <div className="blog-es-diagram__frame">
        {variant === "generation-loop" ? <GenerationLoop /> : <RankNormalise />}
      </div>
      {caption && (
        <figcaption>
          <span>{caption}</span>
          <span className="blog-es-diagram__scroll-hint" aria-hidden="true">
            Desliza ↔
          </span>
        </figcaption>
      )}
    </figure>
  );
}
