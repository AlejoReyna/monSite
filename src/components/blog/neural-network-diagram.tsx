const INPUT_COUNT = 13;
const HIDDEN_COUNT = 16;

const inputNodes = Array.from({ length: INPUT_COUNT }, (_, index) => ({
  x: 70,
  y: 76 + index * 19,
}));

const hiddenNodes = Array.from({ length: HIDDEN_COUNT }, (_, index) => ({
  x: 250,
  y: 61 + index * 17,
}));

const outputNodes = [
  { x: 430, y: 154, label: "aₓ" },
  { x: 430, y: 238, label: "aᵧ" },
];

/**
 * Generation 300 checkpoint from ArtisanalBrew/pixelCrewPolicy.js.
 * Connection weights only: 208 input→hidden + 32 hidden→output.
 * The 18 bias values are deliberately excluded from this list.
 */
const TRAINED_CONNECTION_WEIGHTS = [
  -0.34363, 0.12427, 0.17716, -0.11511, 0.20866, 0.28381, -0.04388, -0.37095,
  -0.22562, -0.06634, 0.00079, 0.04024, -0.08385, 0.45111, -0.39193, 0.00223,
  0.02903, 0.2277, 0.25482, -0.19702, -0.00663, 0.20344, 0.27935, 0.36372,
  0.28182, 0.07945, -0.10643, -0.09121, -0.20843, 0.01261, -0.05974,
  -0.29965, 0.2076, 0.18564, -0.16519, -0.00191, -0.02618, -0.22984,
  -0.18386, -0.59259, 0.13166, 0.65156, 0.24601, -0.09902, -0.1078, 0.21004,
  -0.14724, 0.15766, 0.03987, 0.20154, -0.34675, 0.09292, 0.4858, -0.33263,
  0.27199, -0.2844, 0.11379, 0.09009, -0.63781, -0.03512, -0.08104, 0.23852,
  -0.1359, 0.11244, -0.16232, -0.21761, 0.25988, -0.28877, 0.0809, 0.19998,
  0.14599, 0.2082, -0.00019, -0.23121, 0.01884, 0.0658, 0.134, -0.01112,
  -0.08607, 0.35028, -0.06165, -0.06076, -0.33414, -0.27047, 0.08036,
  0.17994, -0.11257, 0.09819, 0.24334, 0.25934, 0.19198, -0.29125, 0.36299,
  -0.04625, 0.09974, -0.30832, -0.03754, 0.18922, 0.00141, -0.34535,
  -0.10391, 0.18342, 0.0082, 0.02984, 0.15634, 0.32104, 0.1383, 0.17402,
  -0.3268, -0.34576, -0.21899, 0.16848, -0.08664, 0.28496, 0.09361, 0.09016,
  -0.01124, 0.73382, 0.51342, 0.35035, -0.22379, -0.34121, -0.08773,
  -0.32811, -0.007, -0.02542, 0.14382, -0.04052, 0.24993, -0.02811, -0.40466,
  0.12995, 0.04, -0.02513, -0.00075, 0.0987, 0.04864, 0.09763, -0.11719,
  -0.08639, -0.01265, 0.26865, -0.02132, 0.43155, 0.4743, -0.37561,
  -0.33735, -0.07882, -0.27028, -0.22051, 0.20179, -0.02259, 0.65128,
  -0.02798, 0.03352, -0.05122, -0.24476, -0.98826, 0.15726, 0.1404, 0.25237,
  -0.15079, 0.36849, -0.25686, 0.07699, 0.00997, -0.34416, -0.13579, 0.12159,
  -0.7706, 0.40363, 0.01637, 0.37731, -0.18021, 0.02463, 0.29099, -0.04895,
  -0.17493, -0.21884, 0.43405, 0.02249, 0.00126, -0.36078, 0.23873, 0.0488,
  0.17783, 0.06637, 0.10483, -0.00976, 0.00428, 0.13081, -0.09345, -0.25127,
  0.06072, -0.10501, -0.09362, -0.35899, -0.11254, 0.43683, 0.02253,
  -0.12836, -0.2047, 0.16189, -0.25541, 0.1008, -0.34116, 0.16417, -0.16243,
  0.11276, 0.35634, 0.04607, -0.32797, 0.22558, 0.05664, -0.09341, -0.12398,
  0.28348, 0.52466, -0.20907, 0.15624, -0.14603, -0.28987, -0.25674,
  -0.24285, -0.00312, -0.1985, 0.04562, 0.05406, -0.18747, 0.1557, 0.16955,
  0.04013, 0.06498, 0.19296, -0.11466, 0.16265, -0.72297, 0.33103, -0.08316,
  0.03866,
] as const;

function WeightList({
  weights,
  startIndex,
}: {
  weights: readonly number[];
  startIndex: number;
}) {
  return (
    <ol className="blog-neural-network__weight-values" start={startIndex + 1}>
      {weights.map((weight, index) => (
        <li key={startIndex + index}>
          <span>w{String(startIndex + index + 1).padStart(3, "0")}</span>
          <code>{weight.toFixed(5)}</code>
        </li>
      ))}
    </ol>
  );
}

export default function NeuralNetworkDiagram() {
  return (
    <figure
      className="blog-neural-network"
      aria-labelledby="robot-policy-svg-title robot-policy-svg-desc"
    >
      <svg
        className="blog-neural-network__graph"
        viewBox="0 0 500 340"
        role="img"
        aria-labelledby="robot-policy-svg-title robot-policy-svg-desc"
      >
        <title id="robot-policy-svg-title">
          Red neuronal de trece entradas, dieciséis neuronas y dos salidas
        </title>
        <desc id="robot-policy-svg-desc">
          Las trece observaciones del robot se conectan con una capa de
          dieciséis neuronas tanh. La red produce dos valores: aceleración
          horizontal y vertical.
        </desc>

        <g className="blog-neural-network__connections" aria-hidden="true">
          {inputNodes.flatMap((input, inputIndex) =>
            hiddenNodes.map((hidden, hiddenIndex) => (
              <line
                key={`input-${inputIndex}-hidden-${hiddenIndex}`}
                x1={input.x}
                y1={input.y}
                x2={hidden.x}
                y2={hidden.y}
              />
            )),
          )}
          {hiddenNodes.flatMap((hidden, hiddenIndex) =>
            outputNodes.map((output, outputIndex) => (
              <line
                key={`hidden-${hiddenIndex}-output-${outputIndex}`}
                x1={hidden.x}
                y1={hidden.y}
                x2={output.x}
                y2={output.y}
              />
            )),
          )}
        </g>

        <g className="blog-neural-network__column-labels" aria-hidden="true">
          <text x="70" y="22">
            ENTRADAS
          </text>
          <text x="70" y="42">
            13 observaciones
          </text>
          <text x="250" y="22">
            CAPA OCULTA
          </text>
          <text x="250" y="42">
            16 × tanh
          </text>
          <text x="430" y="22">
            SALIDAS
          </text>
          <text x="430" y="42">
            aceleración
          </text>
        </g>

        <g className="blog-neural-network__input-nodes" aria-hidden="true">
          {inputNodes.map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r="7" />
          ))}
        </g>

        <g className="blog-neural-network__hidden-nodes" aria-hidden="true">
          {hiddenNodes.map((node, index) => (
            <circle key={index} cx={node.x} cy={node.y} r="7" />
          ))}
        </g>

        <g className="blog-neural-network__output-nodes" aria-hidden="true">
          {outputNodes.map((node) => (
            <g key={node.label}>
              <circle cx={node.x} cy={node.y} r="18" />
              <text x={node.x} y={node.y + 1}>
                {node.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <details className="blog-neural-network__weights">
        <summary>
          <span>Ver los 240 pesos entrenados</span>
          <strong>Generación 300</strong>
        </summary>
        <div className="blog-neural-network__weight-scroll">
          <section>
            <header>
              <span>Entrada → capa oculta</span>
              <strong>208 pesos</strong>
            </header>
            <WeightList
              weights={TRAINED_CONNECTION_WEIGHTS.slice(0, 208)}
              startIndex={0}
            />
          </section>
          <section>
            <header>
              <span>Capa oculta → salida</span>
              <strong>32 pesos</strong>
            </header>
            <WeightList
              weights={TRAINED_CONNECTION_WEIGHTS.slice(208)}
              startIndex={208}
            />
          </section>
        </div>
      </details>
    </figure>
  );
}
