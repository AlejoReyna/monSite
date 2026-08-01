"use client";

import { useState } from "react";
import ArtisanalBrewHero from "./artisanal-brew-hero";
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

  return (
    <div className="blog-hero-layer-stack blog-bleed">
      {/* Above the frame, not floating over it: the hero being explained is
          the thing to look at, and a control panel dropped on its nav covers
          exactly the part of the composition the layer is about. */}
      <div className="blog-hero-layer-controls">
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

        <p className="blog-hero-layer-label">
          <span>{layer.number}</span> {layer.title}
        </p>
      </div>

      <section
        className="blog-hero-layer"
        id="hero-layer-panel"
        role="tabpanel"
        aria-labelledby={`hero-layer-tab-${layer.id}`}
      >
        {activeLayer === "z1" && (
          <div className="blog-hero-layer-visual">
            <PixelScene decorative showRobot={false} />
          </div>
        )}

        {activeLayer === "z2" && (
          <div className="blog-hero-layer-visual blog-hero-layer-crew">
            <PixelScene decorative showRobot={false} />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--one" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--two" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--three" />
            <span className="blog-hero-layer-robot blog-hero-layer-robot--four" />
          </div>
        )}

        {activeLayer === "z3" && (
          <div className="blog-hero-layer-visual">
            <ArtisanalBrewHero />
          </div>
        )}
      </section>
    </div>
  );
}
