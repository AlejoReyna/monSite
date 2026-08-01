import Image from "next/image";

interface PixelSceneProps {
  decorative?: boolean;
  showRobot?: boolean;
}

export default function PixelScene({
  decorative = false,
  showRobot = true,
}: PixelSceneProps) {
  const loading = decorative ? "eager" : "lazy";

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
      <Image
        className="blog-scene-andromeda"
        src="/blog/artisanal-brew-assets/pl-andromeda.png"
        alt=""
        width={132}
        height={84}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-planet"
        src="/blog/artisanal-brew-assets/pl-planet.png"
        alt=""
        width={32}
        height={32}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-planet-ringed"
        src="/blog/artisanal-brew-assets/pl-planet-ringed.png"
        alt=""
        width={40}
        height={32}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-chain blog-scene-chain--eth"
        src="/blog/artisanal-brew-assets/pl-chain-ethereum.png"
        alt=""
        width={48}
        height={48}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-chain blog-scene-chain--sol"
        src="/blog/artisanal-brew-assets/pl-chain-solana.png"
        alt=""
        width={48}
        height={48}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-chain blog-scene-chain--bnb"
        src="/blog/artisanal-brew-assets/pl-chain-bnb.png"
        alt=""
        width={48}
        height={48}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-coin blog-scene-coin--one"
        src="/blog/artisanal-brew-assets/coffee-coin-pixel.png"
        alt=""
        width={32}
        height={32}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-coin blog-scene-coin--two"
        src="/blog/artisanal-brew-assets/coffee-coin-pixel.png"
        alt=""
        width={32}
        height={32}
        loading={loading}
        unoptimized
      />
      <Image
        className="blog-scene-mug"
        src="/blog/artisanal-brew-assets/pl-mug-coffee.png"
        alt=""
        width={24}
        height={24}
        loading={loading}
        unoptimized
      />
      {showRobot && <span className="blog-scene-robot" />}
    </div>
  );
}
