/**
 * The two figures for the Deploy section.
 *
 * `pipeline` follows the trained policy from the offline trainer to the
 * browser tab, so the prose claim "the bytes CI verified are the bytes the
 * visitor downloads" has a map the reader can check it against.
 * `release-gate` is the decision the workflow makes after the rollout: the
 * health and visual-contract checks either move `latest` forward or put the
 * previous image back.
 *
 * Both are static SVG on a dark card — hairline strokes over a near-black
 * canvas, the same register as the Evolution Strategies figures.
 */

type Stage = {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
};

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
        className="blog-deploy-diagram__box"
      />
      <text
        x={cx}
        y={stage.sub ? cy - 6 : cy}
        className="blog-deploy-diagram__box-title"
      >
        {stage.title}
      </text>
      {stage.sub && (
        <text x={cx} y={cy + 14} className="blog-deploy-diagram__box-sub">
          {stage.sub}
        </text>
      )}
    </g>
  );
}

function ArrowDefs() {
  return (
    <defs>
      <marker
        id="deploy-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path
          d="M 0 0 L 10 5 L 0 10 z"
          className="blog-deploy-diagram__arrowhead"
        />
      </marker>
    </defs>
  );
}

const PIPELINE_STAGES: Stage[] = [
  { x: 30, y: 60, w: 170, h: 64, title: "train_pixel_crew.mjs", sub: "offline · 300 generaciones" },
  { x: 250, y: 60, w: 180, h: 64, title: "pixelCrewPolicy.js", sub: "258 pesos · ~7 KB · commit" },
  { x: 480, y: 60, w: 170, h: 64, title: "CI gate", sub: "100 seeds · 20/60/120 FPS" },
  { x: 700, y: 60, w: 160, h: 64, title: "docker build", sub: "imagen del Web · OIDC" },
  { x: 700, y: 220, w: 160, h: 64, title: "Container Registry", sub: "tag = SHA del commit" },
  { x: 420, y: 220, w: 180, h: 64, title: "Container Apps", sub: "1–2 réplicas · migraciones EF" },
  { x: 110, y: 220, w: 200, h: 64, title: "Navegador", sub: "hero con la política verificada" },
];

function Pipeline() {
  return (
    <svg
      className="blog-deploy-diagram__svg blog-deploy-diagram__svg--pipeline"
      viewBox="0 0 900 320"
      role="img"
      aria-labelledby="deploy-pipeline-title deploy-pipeline-desc"
    >
      <title id="deploy-pipeline-title">
        Del entrenamiento offline al hero desplegado
      </title>
      <desc id="deploy-pipeline-desc">
        El trainer corre fuera de línea y escribe los pesos como un módulo de
        JavaScript que entra al repositorio con un commit. Un push a main ejecuta
        el gate de CI, que evalúa la política en cien semillas no vistas y a
        tres tasas de refresco. Si pasa, se construye la imagen Docker del Web,
        se publica en Azure Container Registry con el SHA del commit y Azure
        Container Apps actualiza el servicio. El navegador recibe el mismo
        archivo verificado, como un asset estático más de la imagen.
      </desc>

      <ArrowDefs />

      <g className="blog-deploy-diagram__flow" aria-hidden="true">
        {/* fila superior: trainer → pesos → gate → imagen */}
        <path d="M 200 92 H 244" />
        <path d="M 430 92 H 474" />
        <path d="M 650 92 H 694" />
        {/* la imagen baja al registry */}
        <path d="M 780 124 V 214" />
        {/* la fila de abajo corre de derecha a izquierda */}
        <path d="M 700 252 H 606" />
        <path d="M 420 252 H 316" />
      </g>

      {PIPELINE_STAGES.map((stage) => (
        <StageBox key={stage.title} stage={stage} />
      ))}

      <g className="blog-deploy-diagram__note" aria-hidden="true">
        <text x="365" y="238">los mismos bytes que aprobó el gate</text>
        <text x="452" y="112">push a main</text>
      </g>

      <g className="blog-deploy-diagram__tag" aria-hidden="true">
        <rect x="600" y="16" width="260" height="24" rx="4" />
        <text x="730" y="32">sin modelo.bin — el modelo es código</text>
      </g>
    </svg>
  );
}

const GATE_STAGES: Stage[] = [
  { x: 30, y: 110, w: 150, h: 60, title: "nueva revisión", sub: "Container Apps" },
  { x: 250, y: 110, w: 220, h: 60, title: "espera ≤ 150 s", sub: "/health/ready + HTML del hero" },
  { x: 720, y: 55, w: 150, h: 54, title: "mueve latest", sub: "Web y Worker sanos" },
  { x: 720, y: 185, w: 150, h: 54, title: "rollback", sub: "imagen anterior" },
];

function ReleaseGate() {
  return (
    <svg
      className="blog-deploy-diagram__svg blog-deploy-diagram__svg--gate"
      viewBox="0 0 900 270"
      role="img"
      aria-labelledby="deploy-gate-title deploy-gate-desc"
    >
      <title id="deploy-gate-title">
        El contrato de salud que decide si latest avanza
      </title>
      <desc id="deploy-gate-desc">
        Tras actualizar Container Apps, el workflow espera hasta ciento
        cincuenta segundos por el endpoint de salud y por el contrato visual
        del hero en el HTML de la portada. Si la revisión está sana, la
        etiqueta latest se mueve al nuevo SHA; si falla, se restaura la imagen
        anterior.
      </desc>

      <ArrowDefs />

      <g className="blog-deploy-diagram__flow" aria-hidden="true">
        <path d="M 180 140 H 244" />
        <path d="M 470 140 H 499" />
        {/* sí: sale por el vértice superior del rombo */}
        <path d="M 585 95 V 82 H 714" />
        {/* no: sale por el vértice inferior */}
        <path d="M 585 185 V 212 H 714" />
      </g>

      {GATE_STAGES.map((stage) => (
        <StageBox key={stage.title} stage={stage} />
      ))}

      <g aria-hidden="true">
        <polygon
          points="585,95 665,140 585,185 505,140"
          className="blog-deploy-diagram__decision"
        />
        <text x="585" y="140" className="blog-deploy-diagram__decision-text">
          ¿sano?
        </text>
      </g>

      <g className="blog-deploy-diagram__choice" aria-hidden="true">
        <text x="600" y="74" className="blog-deploy-diagram__choice--pass">
          sí
        </text>
        <text x="600" y="204" className="blog-deploy-diagram__choice--fail">
          no
        </text>
      </g>

      <g className="blog-deploy-diagram__note" aria-hidden="true">
        <text x="360" y="200">grep &apos;ph-hero&apos; · grep &apos;ph-scene-root&apos;</text>
      </g>
    </svg>
  );
}

export default function DeployPipeline({
  variant,
  caption,
}: {
  variant: "pipeline" | "release-gate";
  caption?: string;
}) {
  return (
    <figure className="blog-deploy-diagram blog-bleed">
      <div className="blog-deploy-diagram__frame">
        {variant === "pipeline" ? <Pipeline /> : <ReleaseGate />}
      </div>
      {caption && (
        <figcaption>
          <span>{caption}</span>
          <span className="blog-deploy-diagram__scroll-hint" aria-hidden="true">
            Desliza ↔
          </span>
        </figcaption>
      )}
    </figure>
  );
}
