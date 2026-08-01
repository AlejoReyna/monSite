type SimulationEvidenceVariant =
  | "normalized-world"
  | "coin-lifecycle"
  | "mug-lifecycle";

interface SimulationEvidenceProps {
  variant: SimulationEvidenceVariant;
}

function EvidenceHeader({
  title,
  subtitle,
  badge,
  tone = "blue",
}: {
  title: string;
  subtitle: string;
  badge: string;
  tone?: "blue" | "gold" | "green";
}) {
  return (
    <header className="blog-sim-evidence__header">
      <span className="blog-sim-evidence__title-group">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </span>
      <span className={`blog-sim-evidence__badge is-${tone}`}>{badge}</span>
    </header>
  );
}

function NormalizedWorldEvidence() {
  return (
    <figure className="blog-sim-evidence blog-sim-evidence--normalized blog-bleed">
      <EvidenceHeader
        title="Un mundo, dos pantallas"
        subtitle="La política siempre observa coordenadas de 0 a 1"
        badge="13 → 2"
      />
      <div className="blog-normalized-world">
        <div className="blog-normalized-world__screen is-desktop">
          <span className="blog-normalized-world__label">Desktop · 1440 × 900</span>
          <span className="blog-normalized-world__axis is-x">x: 0 → 1</span>
          <span className="blog-normalized-world__axis is-y">y: 0 → 1</span>
          <span className="blog-normalized-world__robot" />
          <span className="blog-normalized-world__coin" />
          <span className="blog-normalized-world__coordinate is-robot">
            robot (0.24, 0.68)
          </span>
          <span className="blog-normalized-world__coordinate is-coin">
            moneda (0.76, 0.28)
          </span>
        </div>
        <div className="blog-normalized-world__projection" aria-hidden="true">
          <span>misma observación</span>
          <svg viewBox="0 0 100 24" preserveAspectRatio="none">
            <path d="M 2 12 H 98" />
            <path d="m 89 5 9 7-9 7" />
          </svg>
        </div>
        <div className="blog-normalized-world__screen is-mobile">
          <span className="blog-normalized-world__label">Móvil · 390 × 844</span>
          <span className="blog-normalized-world__axis is-x">x: 0 → 1</span>
          <span className="blog-normalized-world__axis is-y">y: 0 → 1</span>
          <span className="blog-normalized-world__robot" />
          <span className="blog-normalized-world__coin" />
        </div>
      </div>
      <figcaption>
        Cambian los píxeles de salida, no el estado que recibe la red: el robot
        y la moneda conservan exactamente las mismas coordenadas.
      </figcaption>
    </figure>
  );
}

function CoinLifecycleEvidence() {
  return (
    <figure className="blog-sim-evidence blog-sim-evidence--coin blog-bleed">
      <EvidenceHeader
        title="Ciclo de una moneda"
        subtitle="La colisión, no el reloj de una animación, inicia el ciclo"
        badge="5.5 s"
        tone="gold"
      />
      <div className="blog-object-cycle" aria-label="Ciclo visual de una moneda">
        <div className="blog-object-cycle__step is-active">
          <span className="blog-object-cycle__number">01</span>
          <div className="blog-object-cycle__scene">
            <span className="blog-evidence-robot" />
            <span className="blog-evidence-coin" />
          </div>
          <strong>Colisión real</strong>
          <span>distance &lt; pickupRadius</span>
        </div>
        <span className="blog-object-cycle__arrow" aria-hidden="true">→</span>
        <div className="blog-object-cycle__step is-pop">
          <span className="blog-object-cycle__number">02</span>
          <div className="blog-object-cycle__scene">
            <span className="blog-evidence-plus-one">+1</span>
            <span className="blog-evidence-coin is-popping" />
          </div>
          <strong>Pop visual</strong>
          <span>−14 px · 360 ms</span>
        </div>
        <span className="blog-object-cycle__arrow" aria-hidden="true">→</span>
        <div className="blog-object-cycle__step is-respawn">
          <span className="blog-object-cycle__number">03</span>
          <div className="blog-object-cycle__scene">
            <span className="blog-evidence-respawn-ring" />
            <span className="blog-evidence-coin is-respawned" />
          </div>
          <strong>Nueva posición</strong>
          <span>spawnPoint después de 5.5 s</span>
        </div>
      </div>
      <figcaption>
        El objeto cambia de estado: activa, recompensa, espera y reaparece en
        otra coordenada válida.
      </figcaption>
    </figure>
  );
}

function MugLifecycleEvidence() {
  return (
    <figure className="blog-sim-evidence blog-sim-evidence--mug blog-bleed">
      <EvidenceHeader
        title="La taza tiene su propio reloj"
        subtitle="Puede aparecer, expirar o ser atrapada sin depender del crew"
        badge="12–20 s"
        tone="green"
      />
      <div className="blog-mug-evidence">
        <div className="blog-mug-timeline">
          <div className="blog-mug-timeline__segment is-sleeping">
            <span className="blog-mug-timeline__dot" />
            <strong>Dormida</strong>
            <span>6–18 s</span>
          </div>
          <div className="blog-mug-timeline__segment is-live">
            <span className="blog-mug-timeline__dot">
              <i className="blog-evidence-mug" />
            </span>
            <strong>Disponible</strong>
            <span>12–20 s</span>
          </div>
          <div className="blog-mug-timeline__segment is-caught">
            <span className="blog-mug-timeline__dot" />
            <strong>Catch</strong>
            <span>900 ms</span>
          </div>
          <div className="blog-mug-timeline__segment is-boosted">
            <span className="blog-mug-timeline__dot" />
            <strong>Boost</strong>
            <span>6 s</span>
          </div>
        </div>
        <div className="blog-speed-proof">
          <div className="blog-speed-proof__robot is-normal">
            <span className="blog-evidence-robot" />
            <span className="blog-speed-proof__trail" />
            <span>normal · maxSpeed 0.12</span>
          </div>
          <div className="blog-speed-proof__ratio">× 1.4</div>
          <div className="blog-speed-proof__robot is-boosted">
            <span className="blog-evidence-robot" />
            <span className="blog-evidence-shoes" />
            <span className="blog-speed-proof__trail" />
            <span>cafeinado · maxSpeed 0.168</span>
          </div>
        </div>
      </div>
      <figcaption>
        El empuje sigue siendo 0.6; sólo sube 40% el límite de velocidad. Los
        tenis hacen visible exactamente esa ventana de seis segundos.
      </figcaption>
    </figure>
  );
}

export default function SimulationEvidence({
  variant,
}: SimulationEvidenceProps) {
  if (variant === "normalized-world") return <NormalizedWorldEvidence />;
  if (variant === "coin-lifecycle") return <CoinLifecycleEvidence />;
  return <MugLifecycleEvidence />;
}
