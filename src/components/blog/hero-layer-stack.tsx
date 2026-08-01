"use client";

import { useState } from "react";
import PixelScene from "./pixel-scene";

const LAYERS = [
  { id: "z1", number: "01", title: "Fondo ambiental", shortTitle: "Fondo" },
  { id: "z2", number: "02", title: "Crew en movimiento", shortTitle: "Crew" },
  {
    id: "z3",
    number: "03",
    title: "Contenido siempre legible",
    shortTitle: "Contenido",
  },
] as const;

type LayerId = (typeof LAYERS)[number]["id"];

export default function HeroLayerStack() {
  const [activeLayer, setActiveLayer] = useState<LayerId>("z1");
  const layer = LAYERS.find(({ id }) => id === activeLayer) ?? LAYERS[0];

  const layerSelector = (
    <div
      className="blog-hero-layer-selector"
      role="tablist"
      aria-label="Capas del hero"
    >
      {LAYERS.map((item, index) => (
        <button
          key={item.id}
          id={`hero-layer-tab-${item.id}`}
          type="button"
          role="tab"
          aria-selected={activeLayer === item.id}
          aria-controls="hero-layer-panel"
          tabIndex={activeLayer === item.id ? 0 : -1}
          className={`blog-hero-layer-tab ${activeLayer === item.id ? "is-active" : ""}`}
          onClick={() => setActiveLayer(item.id)}
        >
          <span>Z {index + 1}</span>
          <small>{item.shortTitle}</small>
        </button>
      ))}
    </div>
  );

  const layerLabel = (
    <p className="blog-hero-layer-label">
      <span>{layer.number}</span> {layer.title}
    </p>
  );

  return (
    <div className="blog-hero-layer-stack blog-bleed">
      <section
        className="blog-hero-layer"
        id="hero-layer-panel"
        role="tabpanel"
        aria-labelledby={`hero-layer-tab-${layer.id}`}
      >
        {activeLayer === "z1" && (
          <div className="blog-hero-layer-visual">
            {layerSelector}
            {layerLabel}
            <PixelScene decorative showRobot={false} />
          </div>
        )}

        {activeLayer === "z2" && (
          <div
            className="blog-hero-layer-visual blog-hero-layer-crew"
          >
            {layerSelector}
            {layerLabel}
            <PixelScene decorative showRobot={false} />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--one" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--two" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--three" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--four" />
          </div>
        )}

        {activeLayer === "z3" && (
          <div className="blog-hero-layer-visual blog-hero-layer-content">
            {layerSelector}
            {layerLabel}
            <PixelScene decorative showRobot={false} />
            <div className="blog-hero-layer-interface">
              <div className="blog-hero-layer-nav">
                <span className="blog-hero-layer-brand">Artisanal Brew</span>
                <span className="blog-hero-layer-links">
                  SHOP&nbsp;&nbsp; YIELD&nbsp;&nbsp; LAB&nbsp;&nbsp; ABOUT
                </span>
                <span className="blog-hero-layer-nav-actions">
                  <b className="blog-hero-layer-login">
                    <i>◆</i> LOGIN
                  </b>
                  <b className="blog-hero-layer-menu">☰</b>
                </span>
              </div>
              <div className="blog-hero-layer-copy">
                <strong>
                  YOUR NEXT
                  <br />
                  COFFEE,
                  <br />
                  ON-CHAIN
                </strong>
                <p>
                  Stake CAFE while it roasts, and watch a friendly pixel crew run
                  wallet-signed test missions on-chain.
                </p>
                <div>
                  <b>STAKE COFFEE</b>
                  <b>READ MY BLOG</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
