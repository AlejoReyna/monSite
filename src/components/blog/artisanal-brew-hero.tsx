import Image from "next/image";
import type { CSSProperties } from "react";
import PixelScene from "./pixel-scene";

/**
 * The Artisanal Brew hero, rebuilt from the real one.
 *
 * Ported from ThisCafeteria.Web — Components/Home/PixelHome.razor for the
 * copy and Components/Layout/NavMenu.razor for the top section, with the
 * measurements and the breakpoints carried over in blog.css. It keeps the
 * real thing's two faces: wordmark + links + wallet pill on desktop, and
 * wordmark + burger once the viewport drops under 760px.
 *
 * Decorative throughout — the links and buttons are spans, since this is a
 * picture of an interface and not the interface.
 */

const TITLE_LINES = ["YOUR NEXT", "COFFEE,", "ON-CHAIN"] as const;

const NAV_LINKS = ["Shop", "Yield", "Lab", "About"] as const;

export default function ArtisanalBrewHero({ className }: { className?: string }) {
  // The bob is staggered across the whole headline rather than per line, so
  // the ripple runs through the three of them once.
  let letterIndex = 0;

  return (
    <div className={`ab-hero${className ? ` ${className}` : ""}`} aria-hidden="true">
      <PixelScene decorative showRobot={false} />
      <span className="ab-hero__crew ab-hero__crew--one" />
      <span className="ab-hero__crew ab-hero__crew--two" />
      <span className="ab-hero__crew ab-hero__crew--three" />
      <span className="ab-hero__crew ab-hero__crew--four" />

      <div className="ab-hero__nav">
        <span className="ab-hero__brand">Artisanal Brew</span>
        <span className="ab-hero__links">
          {NAV_LINKS.map((link) => (
            <i key={link}>{link}</i>
          ))}
        </span>
        <span className="ab-hero__utils">
          <span className="ab-hero__login">
            <Image
              className="ab-hero__mark"
              src="/eth_logo.png"
              alt=""
              width={27}
              height={27}
            />
            <span>Login</span>
          </span>
          <span className="ab-hero__burger">
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>

      <div className="ab-hero__copy">
        <p className="ab-hero__title">
          {TITLE_LINES.map((line) => (
            <span className="ab-hero__line" key={line}>
              {line.split(" ").map((word) => (
                <span className="ab-hero__word" key={word}>
                  {Array.from(word, (letter, index) => (
                    <span
                      className="ab-hero__letter"
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
        </p>

        <p className="ab-hero__lede">
          Stake CAFE while it roasts, and watch a friendly pixel crew run
          wallet-signed test missions on-chain.
        </p>

        <div className="ab-hero__ctas">
          <span className="ab-hero__cta">Stake coffee</span>
          <span className="ab-hero__cta ab-hero__cta--ghost">Read my blog</span>
        </div>
      </div>
    </div>
  );
}
