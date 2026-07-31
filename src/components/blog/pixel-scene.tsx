interface PixelSceneProps {
  decorative?: boolean;
}

export default function PixelScene({
  decorative = false,
}: PixelSceneProps) {
  return (
    <div
      className="blog-scene-preview__canvas"
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "img",
            "aria-label":
              "Cielo pixel de Artisanal Brew con estrellas, planetas, Andrómeda, redes, monedas, café y un robot",
          })}
    >
      {Array.from({ length: 12 }, (_, index) => (
        <span
          className={`blog-scene-star blog-scene-star--${index + 1}`}
          key={index}
        />
      ))}
      <img
        className="blog-scene-andromeda"
        src="/blog/artisanal-brew-assets/pl-andromeda.png"
        alt=""
      />
      <img
        className="blog-scene-planet"
        src="/blog/artisanal-brew-assets/pl-planet.png"
        alt=""
      />
      <img
        className="blog-scene-planet-ringed"
        src="/blog/artisanal-brew-assets/pl-planet-ringed.png"
        alt=""
      />
      <img
        className="blog-scene-chain blog-scene-chain--eth"
        src="/blog/artisanal-brew-assets/pl-chain-ethereum.png"
        alt=""
      />
      <img
        className="blog-scene-chain blog-scene-chain--sol"
        src="/blog/artisanal-brew-assets/pl-chain-solana.png"
        alt=""
      />
      <img
        className="blog-scene-chain blog-scene-chain--bnb"
        src="/blog/artisanal-brew-assets/pl-chain-bnb.png"
        alt=""
      />
      <img
        className="blog-scene-coin blog-scene-coin--one"
        src="/blog/artisanal-brew-assets/coffee-coin-pixel.png"
        alt=""
      />
      <img
        className="blog-scene-coin blog-scene-coin--two"
        src="/blog/artisanal-brew-assets/coffee-coin-pixel.png"
        alt=""
      />
      <img
        className="blog-scene-mug"
        src="/blog/artisanal-brew-assets/pl-mug-coffee.png"
        alt=""
      />
      <span className="blog-scene-robot" />
    </div>
  );
}
