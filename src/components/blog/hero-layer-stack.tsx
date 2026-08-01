"use client";

import Image from "next/image";
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

/**
 * The nav of the real hero. Both breakpoints ship in the same markup and CSS
 * decides which one is on: on desktop the four links sit centred with the
 * wallet button spelled out, and under 640px the links collapse into the menu
 * icon and the button keeps only its wallet dot — the same swap the real top
 * section does.
 */
function HeroNav() {
  return (
    <div className="blog-hero-layer-nav">
      <span className="blog-hero-layer-brand">Artisanal Brew</span>
      <span className="blog-hero-layer-links">
        <i>SHOP</i>
        <i>YIELD</i>
        <i>LAB</i>
        <i>ABOUT</i>
      </span>
      <span className="blog-hero-layer-nav-actions">
        <b className="blog-hero-layer-login">
          <i>◆</i>
          <em>LOGIN</em>
        </b>
        <b className="blog-hero-layer-menu">☰</b>
      </span>
    </div>
  );
}

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
          <div className="blog-hero-layer-visual blog-hero-layer-content">
            <PixelScene decorative showRobot={false} />
            <div className="blog-hero-layer-interface">
              <HeroNav />
              <div className="blog-hero-layer-copy">
                <Image
                  className="blog-hero-layer-chain"
                  src="/blog/artisanal-brew-assets/pl-chain-solana.png"
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                />
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
