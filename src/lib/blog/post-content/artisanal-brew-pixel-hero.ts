import type { Post } from "../types";

export const artisanalBrewPixelHero: Post = {
  slug: "red-neuronal-javascript-robots-pixel-art",
  title: "Cómo entrené robots pixel art con una red neuronal en JavaScript",
  seoTitle: "Red neuronal en JavaScript y robots pixel art | Alexis Reyna",
  summary: "Una historia de assets pixeleados, evolution strategies, y mucho café.",
  date: "2026-08-01",
  locale: "es-MX",
  keywords: [
    "red neuronal en JavaScript",
    "Evolution Strategies",
    "robots pixel art",
    "machine learning en el navegador",
    "frontend interactivo",
    "Artisanal Brew",
  ],
  ogImage: "/blog/red-neuronal-javascript-og.png",
  readingMinutes: 5,
  tags: [],
  titleAsset: {
    src: "/blog/artisanal-brew-robot.png",
    alt: "Dos robots pixel de Artisanal Brew sobre la línea divisoria: uno salta sin parar y el otro baila a su izquierda",
    frames: 5,
    frameWidth: 64,
    frameHeight: 64,
  },
  blocks: [

    {
      kind: "paragraph",
      content: [
        "Durante estos últimos días me he encontrado trabajando en el frontend de Artisanal Brew como parte del desarrollo de mi portafolio personal. Pensé en implementar algunas de las últimas propuestas que se han venido desarrollando en Ethereum, como lo son los ",
        { kind: "strong", text: "ERC-4337" },
        ", ",
        { kind: "strong", text: "ERC-8004" },
        ", ",
        { kind: "strong", text: "ERC-7683" },
        " y ",
        { kind: "strong", text: "ERC-8183" },
        ".",
      ],
    },
    {
      kind: "table",
      head: ["Estándar", "Qué habilita", "Por qué importa aquí"],
      rows: [
        [
          "ERC-4337",
          "Cuentas inteligentes: wallets con lógica propia en vez de una clave simple",
          "Permite que un agente firme transacciones de forma automática sin aprobación humana en cada una",
        ],
        [
          "ERC-8004",
          "Registro de identidad y reputación para agentes en la blockchain",
          "Permite verificar qué agente ejecutó una compra o staking y consultar su historial",
        ],
        [
          "ERC-7683",
          "Órdenes entre redes (cross-chain): defines el resultado deseado, no la ruta",
          "El checkout encuentra automáticamente la red con menor comisión o mejor liquidez",
        ],
        [
          "ERC-8183",
          "Depósito de garantía seguro (escrow): retiene los fondos hasta verificar la entrega",
          "Asegura que el pago automático solo se libere cuando la compra o pedido se complete con éxito",
        ],
      ],
    },

    { kind: "heading", text: "Por qué pagos agénticos, y por qué robots" },
    {
      kind: "paragraph",
      content: [
        "Estos protocolos tienen algo en común: habilitan pagos agénticos, es decir, transacciones que la propia wallet firma sin que un humano intervenga en cada una, y que además patrocinan (sponsorship) los fees de gas. Eso me hizo preguntarme de qué otra forma podía representar ese tipo de interacción en el home actual.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Al inicio el proyecto era simplemente un storefront: comprabas artículos con Sepolia Tokens, recibías tu voucher por correo, y también podías hacer staking de tokens que viven en esa misma testnet. Pero conforme fui avanzando e implementando más funcionalidad, empecé a querer algo que se adaptara mejor a lo que el proyecto se estaba convirtiendo.",
      ],
    },

    { kind: "subheading", text: "De cabeza de monitor a un crew con más carácter" },
    {
      kind: "sideBySide",
      content: [
        "La versión 1 del crew ya existía, pero no se parecía en nada a la de ahora: la cabeza era prácticamente un monitor CRT (pantalla verde fosforescente y cuerpo color crema), más cercano a una vieja computadora de escritorio con patas que a un personaje con personalidad. Funcionaba para probar las animaciones básicas en loop, pero se sentía plano y le faltaba esa vibra retro-futurista que buscaba para la experiencia del hero.",
      ],
      asset: {
        title: "pl-robot-scout.png (versión 1)",
        src: "/blog/artisanal-brew-assets/pl-robot-scout-v1.png",
        alt: "Versión 1 del robot scout, con cabeza de monitor CRT",
        width: 256,
        height: 64,
      },
    },
    {
      kind: "sideBySide",
      reverse: true,
      content: [
        "Para transformar esa versión inicial, le pedí un concepto 3D pixelado al modelo GPT 5.6 Sol. El resultado superó mis expectativas: una cabeza esférica pulida, proporciones metálicas mejor definidas y una expresión simpática. Usé este diseño como plano maestro de referencia para rediseñar desde cero todo el crew en 2D, logrando que los robots tuvieran identidad propia y lucieran vivos en la interfaz.",
      ],
      asset: {
        title: "Concepto 3D (GPT 5.6 Sol)",
        src: "/blog/artisanal-brew-assets/kimi-robot-concept.webp",
        alt: "Concepto 3D pixelado del robot, generado con GPT 5.6 Sol, usado como referencia para el rediseño",
        width: 1254,
        height: 1254,
      },
    },

    { kind: "subheading", text: "¿Y si los hiciera recogerlas?" },
    {
      kind: "sideBySide",
      content: [
        "Originalmente los cuatro robots se ubicaban en las cuatro esquinas de la pantalla y flotaban ahí, estáticos, para siempre. Había monedas repartidas por el fondo, y me pregunté: ¿y si hiciera que las recogieran? Lo primero que se me ocurrió fue programar cinco escenarios distintos, cada uno con las monedas repartidas de forma diferente, y rotar el escenario en cada refresh. No me convenció: seguía siendo una coreografía fija, no una decisión. Fue ahí cuando le pregunté a mi mejor amigo Claudio (mi alias para la familia de modelos de lenguaje de Anthropic) qué método de entrenamiento le convenía más a este proyecto:",
      ],
      asset: {
        title: "Conversación con Claude",
        src: "/claude_conv.png",
        alt: "Conversación con Claude sobre cómo entrenar a los robots para recolectar monedas",
        width: 1098,
        height: 1118,
        imageStyle: "smooth",
      },
    },

    { kind: "heading", text: "El entrenamiento" },
    {
      kind: "table",
      head: ["Hiperparámetro", "Valor", "Para qué sirve"],
      rows: [
        ["Población", "64", "Prueba 32 pares de variaciones opuestas"],
        ["Sigma", "0.1", "Define cuánto cambian los pesos en cada prueba"],
        ["Learning rate", "0.03", "Controla el tamaño de cada actualización"],
        ["Evaluación", "3 episodios", "Promedia resultados para reducir el factor suerte"],
        ["Generaciones", "300", "Guarda checkpoints desde la generación 20"],
      ],
    },
    {
      kind: "neuralNetworkOverview",
      content: [
        "El cerebro de cada robot es una red pequeña de ",
        { kind: "strong", text: "13 → 16 → 2" },
        " con ",
        { kind: "code", text: "tanh" },
        " en la capa oculta y en la salida. Una entrada es simplemente un número que describe el estado del robot en ese frame; la red no recibe imágenes. Sus trece entradas resumen la posición y distancia de la moneda que persigue, su velocidad, la distancia a cada una de las cuatro paredes, la taza más cercana y la cafeína que todavía le queda. Esos valores llegan a dieciséis neuronas y cada conexión tiene un peso que el entrenamiento va ajustando. Al final salen sólo dos números: la aceleración horizontal y la vertical. En total son 258 parámetros, así que evaluarla cuatro veces por frame cuesta muy poco. Incluso los pesos entrenados caben en unos 7 KB y viajan como números dentro de un módulo ES, sin necesidad de cargar un archivo de modelo.",
      ],
    },

    { kind: "subheading", text: "Cómo implementé Evolution Strategies" },
    {
      kind: "paragraph",
      content: [
        "Evolution Strategies cabe en una frase: en cada generación pruebo variaciones aleatorias de los pesos, puntúo cada una y muevo los pesos originales hacia las que salieron mejor. Lo que me gustó fue lo poco que hace falta para implementarlo.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "El trainer es un script de Node sin dependencias de machine learning. Los 258 parámetros viven en un ",
        { kind: "code", text: "Float64Array" },
        " llamado ",
        { kind: "code", text: "theta" },
        ", el simulador es una función que recibe ese arreglo y devuelve un número, y el entrenamiento completo es un ",
        { kind: "code", text: "for" },
        " de 300 generaciones alrededor de este ciclo:",
      ],
    },
    {
      kind: "esTrainingDiagram",
      variant: "generation-loop",
      caption:
        "Una generación completa de train_pixel_crew.mjs — 32 ruidos, 64 individuos, una sola actualización de theta",
    },
    {
      kind: "paragraph",
      content: [
        "Traducido a código, ese ciclo son ocho líneas:",
      ],
    },
    {
      kind: "code",
      language: "javascript",
      caption: "train_pixel_crew.mjs — muestreo espejeado",
      code: `for (let k = 0; k < population / 2; k++) {
  const eps = gaussianNoise(parameterCount);

  returns[k] = evaluate(theta + sigma * eps);
  returns[k + population / 2] =
    evaluate(theta - sigma * eps);
}

const shaped = rankNormalise(returns);
theta += learningRate * estimateGradient(shaped);`,
    },
    {
      kind: "paragraph",
      content: [
        "Con una población de 64, el bucle sólo da 32 vueltas: cada una genera un vector de ruido gaussiano ",
        { kind: "code", text: "eps" },
        " del mismo tamaño que theta y lo usa dos veces, en ambas direcciones. Eso es el ",
        { kind: "strong", text: "muestreo espejeado" },
        ", y en código me salió gratis, un solo ",
        { kind: "code", text: "gaussianNoise()" },
        " por par, escalado por un sigma de 0.1, que es cuánto se le permite moverse a cada peso en la prueba.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Comparar cada versión contra su opuesta es lo que me deja distinguir si el cambio ayudó de verdad o si sólo tuvo suerte. Del otro lado, ",
        { kind: "code", text: "evaluate()" },
        " es toda la interfaz con el simulador: le paso los pesos, corre tres episodios completos y me devuelve el promedio. El trainer no sabe nada de monedas, tazas ni colisiones.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Las dos últimas líneas son la actualización. ",
        { kind: "code", text: "rankNormalise" },
        " tira las magnitudes y se queda sólo con el orden: reemplaza los 64 retornos por su posición dentro del grupo, repartida de forma pareja entre ",
        { kind: "code", text: "-0.5" },
        " y ",
        { kind: "code", text: "0.5" },
        ".",
      ],
    },
    {
      kind: "esTrainingDiagram",
      variant: "rank-normalise",
      caption:
        "8 de los 64 individuos — a la izquierda lo que puntuaron, a la derecha lo que pesan en la actualización",
      content: [
        "Sin ese paso, una sola partida afortunada se adueña de la actualización y arrastra los pesos hacia un ruido que no tenía nada de especial. Con él, lo único que importa es qué versiones quedaron arriba de las demás.",
      ],
    },
    { kind: "subheading", text: "La actualización final" },
    {
      kind: "paragraph",
      content: [
        "Después ",
        { kind: "code", text: "estimateGradient" },
        " multiplica cada ruido por la puntuación ya normalizada, suma los 64 vectores y divide entre población por sigma. El resultado tiene la misma forma que theta, se escala por el learning rate de 0.03 y se suma. No hay gradientes reales ni tensores en ningún punto: son sumas y multiplicaciones sobre arreglos planos.",
      ],
    },
    { kind: "subheading", text: "Dos detalles de implementación" },
    {
      kind: "list",
      items: [
        [
          { kind: "strong", text: "El tablero cambia en cada generación." },
          " Vuelvo a sortear la posición de los objetos, así que ningún individuo se evalúa sobre el mismo tablero que el anterior. La red no puede memorizar un acomodo específico de monedas y tiene que aprender una estrategia que funcione en escenarios distintos.",
        ],
        [
          { kind: "strong", text: "Trainer y navegador importan el mismo pixelCrewSim.js." },
          " La física, las observaciones, las recompensas y el cálculo de la red están definidos en un solo lugar. Así evito que ambos entornos se comporten de manera ligeramente distinta, un error difícil de notar porque los pesos cargan y los robots se mueven, pero no tan bien como durante las pruebas.",
        ],
      ],
    },

    { kind: "subheading", text: "La economía de las tazas" },
    {
      kind: "paragraph",
      content: [
        "Las monedas siempre están en el campo; las tazas no. Esa asimetría es lo que convierte al café en una decisión y no en otro objeto que recoger: una taza sólo vale la pena si el desvío cuesta menos de lo que devuelve el boost, y puede expirar antes de que el robot llegue. La primera versión pagaba 0.4 por taza y las dejaba visibles 7–12 segundos, y el crew las ignoraba olímpicamente: 46% de captura.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Mi primera reacción fue que la recompensa era muy baja. Estaba a medias: el problema de fondo era geométrico. El crew cruza la pantalla completa en unos 10.6 segundos, así que una taza que aparecía del otro lado ",
        { kind: "em", text: "no se podía alcanzar" },
        " dentro de una ventana de 7 segundos. La política tenía razón en ignorarla (la recompensa era inalcanzable, no estaba subvaluada). Corrí un barrido de 120 generaciones por configuración:",
      ],
    },
    {
      kind: "table",
      head: ["Recompensa", "Ventana", "Monedas · tazas · captura"],
      rows: [
        ["0.4", "7–20 s", "28.5 · 5.3 de 10.8 · 48%"],
        ["0.9", "7–12 s", "27.6 · 6.3 de 10.6 · 59%"],
        ["0.9", "12–20 s", "26.5 · 5.9 de 9.5 · 62%"],
        ["1.5", "12–20 s", "26.7 · 6.4 de 9.9 · 65%"],
      ],
    },


    {
      kind: "generationShowcase",
      title: "Qué aprendió el crew",
      items: [
        {
          checkpoint: "Generación 0",
          tag: "Baseline Sin Entrenar",
          reward: "1.8",
          description: "Deriva sin control, se atasca contra las paredes y recoge objetos únicamente por accidente.",
          behaviorType: "untrained",
        },
        {
          checkpoint: "Generación 20",
          tag: "Aceleración Temprana",
          reward: "25.2",
          description: "Apunta bien y acelera con fuerza hacia el objetivo, pero sobrepasa el punto objetivo y debe regresar.",
          behaviorType: "early",
        },
        {
          checkpoint: "Generación 300",
          tag: "Política Optimizada",
          reward: "27.0",
          description: "Acelera pronto, aprovecha la inercia para deslizarse limpiamente y evalúa la conveniencia de las tazas de café.",
          behaviorType: "trained",
        },
      ],
    },
    {
      kind: "textAndCode",
      paragraphs: [
        [
          "El entrenamiento completo tardó 275 segundos en un núcleo de CPU. La mayor parte de la competencia apareció entre las generaciones 20 y 30; el resto compró una mejora menor y ruidosa. Con la política reentrenada, la captura de tazas subió de 46% a 67% sin sacrificar de forma material la recolección de monedas.",
        ],
      ],
      code: {
        language: "javascript",
        caption: "pixelCrewPolicy.js — los 258 pesos exportados como literales (~7 KB)",
        source: `export const SHAPE = [13, 16, 2];
export const GENERATIONS = 300;

export const WEIGHTS = {
  untrained: [-0.0314, 0.0821, -0.0105, 0.0442, ...], // Baseline azaroso
  early:     [0.1284, -0.4501, 0.3892, -0.1042, ...], // Gen 20
  trained:   [0.4812, -0.8910, 0.7321, -0.3129, ...]  # Gen 300 final
};`,
      },
    },
    {
      kind: "terminal",
      caption: "Suite de validación ciega en 100 semillas y 3 tasas de refresco (verify_pixel_crew.mjs)",
      lines: [
        { kind: "cmd", text: "node tools/verify_pixel_crew.mjs" },
        { kind: "out", text: "untrained   mean=1.82  min=0  max=4   zero_runs=14" },
        { kind: "out", text: "early       mean=25.24 min=18 max=31  zero_runs=0" },
        { kind: "out", text: "trained     mean=27.38 min=21 max=33  zero_runs=0" },
        { kind: "out", text: "" },
        { kind: "out", text: "frame rates  20fps=27.12  60fps=27.38  120fps=27.44" },
        { kind: "out", text: "✔ release gate passed (258 parameters, generation 300)" },
      ],
    },
    { kind: "heading", text: "La composición del Hero" },
    {
      kind: "paragraph",
      content: [
        "La página separa la experiencia en tres planos. Esa decisión evita el problema habitual de los fondos animados: que una partícula o un personaje pase por encima del título y lo vuelva ilegible.",
      ],
    },
    {
      kind: "heroLayerStack",
    },
    {
      kind: "paragraph",
      content: [
        "GlobalScene conserva ambos planos con ",
        { kind: "code", text: "data-permanent" },
        " durante la navegación mejorada. El cielo no se reinicia, la paleta aleatoria no cambia al entrar a staking y las animaciones no vuelven al fotograma cero. Lo único que cambia es la capa visible, seleccionada mediante ",
        { kind: "code", text: "data-scene-route" },
        " en el elemento ",
        { kind: "code", text: "<html>" },
        ".",
      ],
    },

    { kind: "subheading", text: "El background y sus cinco cielos" },
    {
      kind: "paragraph",
      content: [
        "La base visual no es una imagen gigante. Parte de un negro café ",
        { kind: "code", text: "#100D0B" },
        " y combina dos gradientes radiales muy tenues. Al iniciar una visita se elige una de cinco variantes; cada una cambia los brillos, la formación inicial del crew y la distribución de las monedas ambientales.",
      ],
    },
    {
      kind: "scenePreview",
      label: "GlobalScene — el background recompuesto con sus assets reales",
    },
    {
      kind: "code",
      language: "css",
      caption: "GlobalScene.razor.css — profundidad sin un wallpaper",
      code: `.gs-scene {
  --hero-glow-a: rgba(200, 155, 106, 0.11);
  --hero-glow-b: rgba(143, 185, 155, 0.08);
  background:
    radial-gradient(ellipse 62% 52% at 18% 14%,
      var(--hero-glow-a), transparent 70%),
    radial-gradient(ellipse 55% 48% at 82% 72%,
      var(--hero-glow-b), transparent 70%);
}

.ph-star {
  width: 11px;
  height: 3px;
  background: var(--star-color);
}

.ph-star::after {
  width: 3px;
  height: 11px;
  content: "";
}`,
    },
    {
      kind: "paragraph",
      content: [
        "Las dieciséis estrellas son cruces hechas con CSS y un pseudo-elemento; parpadean con duraciones y retrasos diferentes. Andrómeda queda al fondo con baja opacidad y un desplazamiento de 74 segundos. Los planetas y los badges de Ethereum, Solana y BNB usan movimiento escalonado y ",
        { kind: "code", text: "image-rendering: pixelated" },
        " para conservar bordes duros.",
      ],
    },



    { kind: "heading", text: "De coreografía a simulación" },
    {
      kind: "paragraph",
      content: [
        "La primera versión movía cada robot con un keyframe de 90 segundos. Su moneda estaba colocada exactamente en el destino de esa animación y desaparecía cuando el reloj decía que el robot había llegado. Parecía una recolección, pero ningún objeto percibía al otro.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Ese truco se rompía al arrastrar un robot: había que mover también su moneda para que la coreografía siguiera coincidiendo. La simulación eliminó ese acoplamiento. Ahora soltar un robot es simplemente cambiar su posición; la política vuelve a observar y continúa desde ahí.",
      ],
    },
    { kind: "choreographyComparison" },

    { kind: "subheading", text: "Un mundo normalizado para desktop y móvil" },
    {
      kind: "paragraph",
      content: [
        "La física vive en un cuadrado normalizado de 0 a 1. El runtime transforma esas coordenadas a píxeles al renderizar. Por eso la misma política funciona en un teléfono y en un monitor ancho sin entrenar dos modelos.",
      ],
    },
    { kind: "simulationEvidence", variant: "normalized-world" },
    {
      kind: "table",
      head: ["Parte", "Tamaño", "Qué representa"],
      rows: [
        [
          "Observación",
          "13 valores",
          "Objetivo, velocidad, paredes, taza cercana y cafeína restante",
        ],
        [
          "Acción",
          "2 valores",
          "Aceleración horizontal y vertical, limitadas con tanh",
        ],
        [
          "Episodio",
          "1,800 pasos",
          "Treinta segundos simulados a 60 Hz",
        ],
        [
          "Dinámica",
          "Continua",
          "Aceleración, drag, velocidad máxima y paredes absorbentes",
        ],
      ],
    },
    {
      kind: "code",
      language: "javascript",
      caption: "pixelCrewSim.js — la interfaz del mundo",
      code: `export const OBS_SIZE = 13;
export const ACT_SIZE = 2;
export const EPISODE_STEPS = 1800;

export const PARAMS = {
  accel: 0.6,
  drag: 0.7,
  maxSpeed: 0.12,
  respawnSeconds: 5.5,
  bagBoost: 1.4,
  bagBoostSeconds: 6,
  bagReward: 0.9,
};`,
    },
    {
      kind: "paragraph",
      content: [
        "Cada robot reclama su propia moneda. La asignación se mantiene hasta que esa moneda desaparece, evitando que cuatro agentes se amontonen sobre el mismo objetivo. Las tazas aparecen durante ventanas aleatorias de 12 a 20 segundos y dan un aumento de 40% a la velocidad máxima durante seis segundos. La política debe decidir si el desvío compensa.",
      ],
    },

    { kind: "subheading", text: "Cómo aparecen las monedas" },
    {
      kind: "paragraph",
      content: [
        "El mundo inicia con siete monedas activas en puntos aleatorios. ",
        { kind: "code", text: "spawnPoint" },
        " rechaza cualquier coordenada dentro del rectángulo ocupado por el copy, así que una moneda puede cruzar detrás del título cuando la lleva un robot, pero nunca aparece estacionada sobre el texto.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Al tocarla, la moneda deja de estar viva, suma una unidad a la recompensa y recibe ",
        { kind: "code", text: ".is-collected" },
        ". Su imagen sube 14 píxeles, se reduce y desaparece durante 360 ms. Permanece oculta 5.5 segundos; después reaparece en una nueva posición válida y el runtime retira la clase.",
      ],
    },
    { kind: "simulationEvidence", variant: "coin-lifecycle" },
    {
      kind: "code",
      language: "javascript",
      caption: "pixelCrewSim.js — recoger, esperar y reaparecer",
      code: `if (distance(robot, coin) < PARAMS.pickupRadius) {
  coin.alive = false;
  coin.respawnAt = world.time + 5.5;
  world.collected++;
  reward += 1;
}

if (!coin.alive && world.time >= coin.respawnAt) {
  const point = spawnPoint(world);
  coin.x = point.x;
  coin.y = point.y;
  coin.alive = true;
}`,
    },
    {
      kind: "code",
      language: "css",
      caption: "GlobalScene.razor.css — el pop visual de la moneda",
      code: `.ph-coinbit.is-collected img {
  animation: coin-pop 360ms ease-out 1 forwards;
}

@keyframes coin-pop {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate3d(0, -14px, 0) scale(0.3);
  }
}`,
    },

    { kind: "subheading", text: "Cómo funcionan las tazas de café" },
    {
      kind: "paragraph",
      content: [
        "Las monedas son el trabajo; las tazas son la capa de dificultad. La diferencia es que las seis tazas ",
        { kind: "em", text: "no existen permanentemente" },
        ". Cada slot arranca dormido con un tiempo de aparición distinto (escalonado a propósito, para que no aparezcan todas juntas en el primer segundo de la página). Cuando ese reloj vence, el simulador elige una posición nueva fuera del copy, activa la taza y le da una vida aleatoria de 12 a 20 segundos. Si nadie llega, expira y vuelve a dormir entre 6 y 18 segundos.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Nada de ese calendario está atado al crew, y ahí está justo la dificultad: un robot no puede planear alrededor de la taza, sólo puede reaccionar. Cuando alcanza una, gana un ",
        { kind: "strong", text: "40% de velocidad máxima durante seis segundos" },
        ". El detalle que más me gustó al implementarlo es que el boost sube el ",
        { kind: "em", text: "techo" },
        ", no el empuje: un robot cafeinado conserva la misma aceleración ingrávida y simplemente alcanza a planear más rápido. Así el café se lee como inercia y no como un tirón.",
      ],
    },
    {
      kind: "code",
      language: "javascript",
      caption: "pixelCrewSim.js — ciclo independiente de cada taza",
      code: `if (mug.alive && world.time >= mug.expiresAt) {
  mug.alive = false;
  mug.appearAt = world.time + randomBetween(6, 18);
}

if (!mug.alive && world.time >= mug.appearAt) {
  const point = spawnPoint(world);
  mug.x = point.x;
  mug.y = point.y;
  mug.alive = true;
  mug.expiresAt = world.time + randomBetween(12, 20);
}`,
    },
    {
      kind: "paragraph",
      content: [
        "El runtime traduce ",
        { kind: "code", text: "alive" },
        " a la clase ",
        { kind: "code", text: ".is-live" },
        " y CSS hace un fade de 220 ms. Si un robot la alcanza, añade ",
        { kind: "code", text: ".is-caught" },
        " durante 900 ms, cambia al sprite de beber y activa ",
        { kind: "code", text: ".is-boosted" },
        " durante seis segundos. Los zapatos sónicos muestran visualmente el aumento de 40% en la velocidad máxima.",
      ],
    },
    { kind: "simulationEvidence", variant: "mug-lifecycle" },
    {
      kind: "code",
      language: "css",
      caption: "GlobalScene.razor.css — de dormida a catchable",
      code: `.ph-scene--sim .ph-bag {
  opacity: 0;
  transition: opacity 220ms ease;
}

.ph-scene--sim .ph-bag.is-live {
  opacity: 0.92;
}

.ph-scene--sim .ph-bag.is-caught {
  opacity: 0;
}`,
    },

    { kind: "subheading", text: "Los tenis de Sonic" },
    {
      kind: "paragraph",
      content: [
        "Un boost invisible es un boost que nadie cree. Necesitaba que se notara que ese robot va más rápido ",
        { kind: "em", text: "porque" },
        " se tomó un café, así que le puse tenis: unos sneakers pixelados que el robot usa exactamente mientras dura la cafeína. Y lo bonito es que no tienen temporizador propio. El runtime ya mantiene ",
        { kind: "code", text: ".is-boosted" },
        " durante toda la ventana de seis segundos, así que los tenis se cuelgan directo de esa clase: no hay dos relojes que se puedan desincronizar, hay uno solo y CSS lo obedece.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Los dos detalles que no eran obvios hasta que lo vi roto en pantalla: el ",
        { kind: "code", text: "clip-path" },
        " y el sprite espejeado. Sin el recorte, los pies originales del robot se asoman por debajo de los tenis y quedan dos siluetas encimadas; con él, el sprite reemplaza limpiamente las últimas dos filas de pierna. Y como las puntas de los tenis son largas y apuntan hacia adelante, un robot que viaja a la izquierda necesita la variante ",
        { kind: "code", text: "-flip" },
        " o parece que camina de reversa. Mientras nadie tiene café, los tenis están en ",
        { kind: "code", text: "display: none" },
        " y no cuestan nada.",
      ],
    },
    {
      kind: "code",
      language: "css",
      caption: "GlobalScene.razor.css — los tenis viven de .is-boosted",
      easterEgg: "sanic",
      code: `.ph-scene__shoes {
  display: none;
  background: url("images/pl-sonic-shoes.png")
    center bottom / contain no-repeat;
  image-rendering: pixelated;
}

.ph-scene__roam.is-boosted .ph-scene__shoes {
  animation: ph-sonic-shoes-dash 0.5s steps(2, end) infinite;
  display: block;
}

/* Sin este recorte, los pies originales del robot
   asoman por debajo y las dos siluetas chocan. */
.ph-scene__roam.is-boosted .ph-scene__actor {
  clip-path: inset(0 0 12.5% 0);
}`,
    },
    {
      kind: "assetGallery",
      variant: "sonic-shoes",
      assets: [
        {
          title: "pl-sonic-shoes.png",
          src: "/blog/artisanal-brew-assets/pl-sonic-shoes.png",
          alt: "Sprite de los tenis sónicos apuntando a la derecha",
          width: 87,
          height: 36,
        },
        {
          title: "pl-sonic-shoes-flip.png",
          src: "/blog/artisanal-brew-assets/pl-sonic-shoes-flip.png",
          alt: "Sprite espejeado de los tenis sónicos",
          width: 87,
          height: 36,
        },
      ],
    },

    { kind: "heading", text: "Inventario completo de assets" },
    {
      kind: "paragraph",
      content: [
        "Este es el inventario del primer viewport y de la simulación del crew. La segunda pantalla de descubrimiento de producto es un componente independiente y no forma parte de esta lista.",
      ],
    },
    {
      kind: "assetGallery",
      assets: [
        {
          title: "pl-andromeda.png",
          src: "/blog/artisanal-brew-assets/pl-andromeda.png",
          alt: "Galaxia de Andrómeda en pixel art",
          width: 132,
          height: 84,
          format: "132×84 RGBA",
          usage: "Generado con generate_andromeda.py mediante densidad estocástica por píxel",
          codeLanguage: "python",
          code: `import math, random
from PIL import Image

W, H = 132, 84
MAJOR, MINOR = 58.0, 18.5
TILT = math.radians(-24.0)

def disc_coords(x, y):
    dx, dy = x - W / 2, y - H / 2
    cos_t, sin_t = math.cos(TILT), math.sin(TILT)
    u = dx * cos_t + dy * sin_t
    v = -dx * sin_t + dy * cos_t
    return math.hypot(u / MAJOR, v / MINOR), u / MAJOR, v / MINOR

# Densidad estocástica por píxel para conservar estética retro
for y in range(H):
    for x in range(W):
        r, u, v = disc_coords(x, y)
        if r > 1.42: continue
        value = math.exp(-r * 2.45) + 1.5 * math.exp(-((r / 0.17) ** 2))
        # dibujar píxeles con paleta cálida a fría...`,
        },
        {
          title: "pl-planet.png",
          src: "/blog/artisanal-brew-assets/pl-planet.png",
          alt: "Planeta pixel sin anillos",
          width: 32,
          height: 32,
          format: "32×32 RGBA",
          usage: "Sprite base del sistema visual pixel; deriva lentamente en el fondo",
          codeLanguage: "css",
          code: `/* GlobalScene.razor.css — Deriva ambiental del planeta base */
.ph-planet {
  width: 32px;
  height: 32px;
  background: url("images/pl-planet.png") center / contain no-repeat;
  image-rendering: pixelated;
  animation: ph-planet-drift 48s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes ph-planet-drift {
  0% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(18px, -12px, 0) rotate(4deg); }
  100% { transform: translate3d(-14px, 16px, 0) rotate(-3deg); }
}`,
        },
        {
          title: "pl-planet-ringed.png",
          src: "/blog/artisanal-brew-assets/pl-planet-ringed.png",
          alt: "Planeta pixel con anillos",
          width: 40,
          height: 32,
          format: "40×32 RGBA",
          usage: "Variante con anillo del kit visual; se muestra con rotación y menor opacidad",
          codeLanguage: "css",
          code: `/* GlobalScene.razor.css — Planeta con anillo en rotación orbital */
.ph-planet--ringed {
  width: 40px;
  height: 32px;
  background: url("images/pl-planet-ringed.png") center / contain no-repeat;
  opacity: 0.72;
  image-rendering: pixelated;
  transform: rotate(-14deg);
  animation: ph-ringed-float 64s linear infinite alternate;
}`,
        },
        {
          title: "pl-chain-ethereum.png",
          src: "/blog/artisanal-brew-assets/pl-chain-ethereum.png",
          alt: "Badge pixel de Ethereum",
          width: 48,
          height: 48,
          format: "48×48 RGBA",
          usage: "Generado por generate_chain_pixel_badges.py como cristal facetado",
          codeLanguage: "python",
          code: `# generate_chain_pixel_badges.py — Badge Ethereum
def ethereum(draw):
    # Cristal facetado con corte asimétrico central
    ETH_BLUE = (76, 138, 226, 255)
    draw.polygon([(12, 0), (12, 10), (5, 14)], fill=ETH_BLUE)
    draw.polygon([(12, 0), (19, 14), (12, 10)], fill=ETH_BLUE)
    draw.polygon([(5, 14), (12, 10), (12, 16)], fill=ETH_BLUE)
    draw.polygon([(19, 14), (12, 10), (12, 16)], fill=ETH_BLUE)
    # Chevron inferior separado por muesca transparente
    draw.polygon([(5, 17), (12, 20), (12, 23)], fill=ETH_BLUE)
    draw.polygon([(19, 17), (12, 20), (12, 23)], fill=ETH_BLUE)`,
        },
        {
          title: "pl-chain-solana.png",
          src: "/blog/artisanal-brew-assets/pl-chain-solana.png",
          alt: "Badge pixel de Solana",
          width: 48,
          height: 48,
          format: "48×48 RGBA",
          usage: "Generado por el mismo script con tres bandas diagonales",
          codeLanguage: "python",
          code: `# generate_chain_pixel_badges.py — Badge Solana
SOL_PURPLE = (153, 69, 255)
SOL_GREEN = (20, 241, 149)

def gradient_bar(img, polygon):
    # Tres paralelogramos alternados con degradado violeta a menta
    for y in range(GRID):
        for x in range(GRID):
            t = x / (GRID - 1)
            r = round(SOL_PURPLE[0] + (SOL_GREEN[0] - SOL_PURPLE[0]) * t)
            g = round(SOL_PURPLE[1] + (SOL_GREEN[1] - SOL_PURPLE[1]) * t)
            b = round(SOL_PURPLE[2] + (SOL_GREEN[2] - SOL_PURPLE[2]) * t)
            # dibujar pixel interpolado...`,
        },
        {
          title: "pl-chain-bnb.png",
          src: "/blog/artisanal-brew-assets/pl-chain-bnb.png",
          alt: "Badge pixel de BNB",
          width: 48,
          height: 48,
          format: "48×48 RGBA",
          usage: "Generado por el mismo script como construcción de cubo y anillo",
          codeLanguage: "python",
          code: `# generate_chain_pixel_badges.py — Badge BNB
BNB_HI = (255, 210, 66, 255)
BNB = (247, 178, 20, 255)

def bnb(draw):
    # Rombo central superior
    draw.polygon([(12, 3), (17, 8), (12, 13), (7, 8)], fill=BNB_HI)
    # Anillo exterior en perspectiva isométrica
    draw.polygon([(12, 0), (23, 11), (12, 22), (1, 11)], fill=BNB)
    # Calado interior de anillo
    draw.polygon([(12, 5), (18, 11), (12, 17), (6, 11)], fill=(0, 0, 0, 0))`,
        },
        {
          title: "pl-mug-coffee.png",
          src: "/blog/artisanal-brew-assets/pl-mug-coffee.png",
          alt: "Taza de café pixel",
          width: 24,
          height: 24,
          format: "24×24 RGBA",
          usage: "Generado con generate_pixel_mug.py; seis instancias funcionan como power-ups",
          codeLanguage: "python",
          code: `# generate_pixel_mug.py — Taza de café retro sin plato
def draw_mug():
    image = Image.new("RGBA", (24, 24), CLEAR)
    draw = ImageDraw.Draw(image)
    # Vapor tenue flotando
    rect(draw, (7, 1, 8, 2), STEAM)
    rect(draw, (14, 0, 15, 1), STEAM)
    # Asa cuadrada detrás de la taza
    rect(draw, (16, 10, 22, 17), INK)
    # Cuerpo cerámico crema y líquido café caliente
    rect(draw, (4, 9, 16, 17), CERAMIC)
    rect(draw, (4, 9, 16, 11), COFFEE)
    return image`,
        },
        {
          title: "coffee-coin-pixel.png",
          src: "/blog/artisanal-brew-assets/coffee-coin-pixel.png",
          alt: "Moneda de café pixel",
          width: 32,
          height: 32,
          format: "32×32 RGBA",
          usage: "Asset de token reutilizado; siete instancias son objetivos físicos de la simulación",
          codeLanguage: "javascript",
          code: `// pixelCrewSim.js — Objetivo físico de recolección
export function spawnCoin(world) {
  return {
    id: \`coin-\${Math.random().toString(36).substr(2, 9)}\`,
    x: randomBetween(0.12, 0.88),
    y: randomBetween(0.18, 0.82),
    alive: true,
    collected: false,
    respawnTimer: 0
  };
}`,
        },
        {
          title: "pl-robot-coincrew.png",
          src: "/blog/artisanal-brew-assets/pl-robot-coincrew.png",
          alt: "Sprite sheet del robot pixel mirando a la derecha",
          width: 320,
          height: 64,
          format: "320×64 RGBA",
          usage: "Sprite sheet de cinco frames generado por generate_procurement_sprites.py",
          codeLanguage: "python",
          code: `# generate_procurement_sprites.py — Sprite sheet del robot crew (5 frames 64x64)
def draw_scout_sheet():
    sheet = Image.new("RGBA", (320, 64), (0, 0, 0, 0))
    for i in range(5):
        frame = draw_scout_frame(i) # animación de flotación e inercia
        sheet.paste(frame, (i * 64, 0))
    return sheet`,
        },
        {
          title: "pl-robot-coincrew-flip.png",
          src: "/blog/artisanal-brew-assets/pl-robot-coincrew-flip.png",
          alt: "Sprite sheet espejeado del robot pixel",
          width: 320,
          height: 64,
          format: "320×64 RGBA",
          usage: "El mismo sheet espejeado para los robots que miran a la izquierda",
          codeLanguage: "python",
          code: `# Espejeado horizontal del sprite sheet original
def flip_sprite_sheet(image_path):
    img = Image.open(image_path)
    flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
    return flipped`,
        },
        {
          title: "pl-robot-coincrew-sip.png",
          src: "/blog/artisanal-brew-assets/pl-robot-coincrew-sip.png",
          alt: "Sprite sheet del robot bebiendo café",
          width: 256,
          height: 64,
          format: "256×64 RGBA",
          usage: "Cuatro frames para alcanzar, levantar, beber y bajar la taza",
          codeLanguage: "python",
          code: `# generate_procurement_sprites.py — Secuencia de trago de café (4 frames)
def draw_sip_animation():
    # Frame 0: Detectar taza
    # Frame 1: Levantar taza cerámica a la visera del robot
    # Frame 2: Inclinación + animación de sorbo (glitch verde en pantalla)
    # Frame 3: Bajar taza y activar modo boost sónico`,
        },
        {
          title: "pl-robot-coincrew-sip-flip.png",
          src: "/blog/artisanal-brew-assets/pl-robot-coincrew-sip-flip.png",
          alt: "Sprite sheet espejeado del robot bebiendo café",
          width: 256,
          height: 64,
          format: "256×64 RGBA",
          usage: "Variante espejeada de la animación de café",
          codeLanguage: "python",
          code: `# Espejeado horizontal de animación sip
def flip_sip_sheet(image_path):
    img = Image.open(image_path)
    return img.transpose(Image.FLIP_LEFT_RIGHT)`,
        },
        {
          title: "pl-robot-jetflame.png",
          src: "/blog/artisanal-brew-assets/pl-robot-jetflame.png",
          alt: "Sprite sheet de la llama del propulsor",
          width: 28,
          height: 12,
          format: "28×12 RGBA",
          usage: "Cuatro frames de 7×12 generados para el ciclo de propulsión",
          codeLanguage: "python",
          code: `# generate_procurement_sprites.py — Llama de propulsor jet
def draw_jetflame_sheet():
    sheet = Image.new("RGBA", (28, 12), (0, 0, 0, 0))
    colors = [(255, 120, 0), (255, 200, 40), (255, 80, 0), (255, 240, 100)]
    for f in range(4):
        draw_flame_frame(sheet, f, colors[f])
    return sheet`,
        },
        {
          title: "pl-plus-one.png",
          src: "/blog/artisanal-brew-assets/pl-plus-one.png",
          alt: "Indicador pixel más uno",
          width: 9,
          height: 6,
          format: "9×6 RGBA",
          usage: "Indicador +1 generado junto con el crew; aparece al recoger una moneda",
          codeLanguage: "css",
          code: `/* GlobalScene.razor.css — Animación flotante de +1 al colectar */
.ph-plus-one {
  width: 9px;
  height: 6px;
  background: url("images/pl-plus-one.png") no-repeat;
  image-rendering: pixelated;
  animation: ph-pop-plus-one 500ms ease-out forwards;
}`,
        },
        {
          title: "pl-sonic-shoes.png",
          src: "/blog/artisanal-brew-assets/pl-sonic-shoes.png",
          alt: "Sprite de zapatos sónicos",
          width: 87,
          height: 36,
          format: "87×36 RGBA",
          usage: "Sprite de zapatos sónicos generado con generate_sonic_shoes.py",
          codeLanguage: "python",
          code: `# generate_sonic_shoes.py — Tenis sónicos de velocidad (+40% speed)
def generate_sonic_shoes():
    img = Image.new("RGBA", (87, 36), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Silueta de tenis rojos con hebilla dorada y franja blanca
    return img`,
        },
        {
          title: "pl-sonic-shoes-flip.png",
          src: "/blog/artisanal-brew-assets/pl-sonic-shoes-flip.png",
          alt: "Sprite espejeado de zapatos sónicos",
          width: 87,
          height: 36,
          format: "87×36 RGBA",
          usage: "Sprite espejeado de zapatos sónicos",
          codeLanguage: "python",
          code: `# Espejeado de zapatos sónicos
def flip_shoes(img_path):
    img = Image.open(img_path)
    return img.transpose(Image.FLIP_LEFT_RIGHT)`,
        },
      ],
    },


    { kind: "heading", text: "Del modelo al navegador" },
    {
      kind: "paragraph",
      content: [
        "El trainer escribe tres juegos de pesos (sin entrenar, temprano y final) en ",
        { kind: "code", text: "pixelCrewPolicy.js" },
        ". El runtime importa ese archivo y la simulación compartida. En cada frame observa el mundo, ejecuta la red, integra la física y escribe posiciones con ",
        { kind: "code", text: "translate3d" },
        ".",
      ],
    },

    { kind: "heading", text: "Deploy" },
    {
      kind: "paragraph",
      content: [
        "Me faltaba la última pieza, y es la que más me interesaba resolver bien: qué pasa cuando todo esto se sube. Un hero con una red neuronal adentro tiene una forma nueva de romperse, los pesos pueden truncarse, alguien (yo) puede tocar la física y olvidar reentrenar, y nada de eso falla ruidosamente. Los robots se siguen moviendo; simplemente son peores de lo que dicen los números del post.",
      ],
    },

    { kind: "subheading", text: "El modelo viaja dentro de la imagen" },
    {
      kind: "paragraph",
      content: [
        "El hero no descarga un modelo de ningún lado. Cuando el entrenamiento termina, ",
        { kind: "code", text: "train_pixel_crew.mjs" },
        " escribe los 258 pesos de cada checkpoint como literales en ",
        { kind: "code", text: "pixelCrewPolicy.js" },
        ", y ese archivo entra al repositorio con un commit: el modelo entrenado es código fuente, se revisa en el pull request y se compara con diff como cualquier otro cambio. No hay ",
        { kind: "code", text: "modelo.bin" },
        ", ni bucket de artefactos, ni servidor de inferencia. Después ",
        { kind: "code", text: "docker build" },
        " lo copia dentro de la imagen del Web igual que copia los ",
        { kind: "code", text: ".css" },
        " y los ",
        { kind: "code", text: ".png" },
        ", y ahí está la propiedad que me importa: los bytes que el gate de CI verificó son exactamente los que el navegador termina descargando.",
      ],
    },
    {
      kind: "paragraph",
      content: [
        "Así que lo que se ve al abrir la portada no es una grabación del entrenamiento ni una coreografía que lo imita. El navegador importa esos mismos pesos, el runtime ejecuta la red en cada frame sobre el mismo ",
        { kind: "code", text: "pixelCrewSim.js" },
        " que usó el gate, y los robots que recogen monedas son los 258 números multiplicándose en vivo, en la máquina de quien visita. Si CI aprobó la política, la política aprobada es (literalmente, byte a byte) la que está moviendo al crew en pantalla.",
      ],
    },
    {
      kind: "deployPipeline",
      variant: "pipeline",
      caption:
        "El recorrido completo: el archivo que verifica CI es el mismo que la imagen sirve al navegador",
    },

    { kind: "subheading", text: "Entrenamiento y deploy forman un solo contrato" },
    {
      kind: "paragraph",
      content: [
        "La política no se entrena durante el deploy. Se entrena offline y sus pesos se versionan como código. A partir de ahí CI trata ese archivo como cualquier otro artefacto de producción: comprueba su forma, sus valores y su desempeño antes de construir la imagen.",
      ],
    },
    {
      kind: "list",
      ordered: true,
      items: [
        [
          "Un push a ",
          { kind: "code", text: "main" },
          " ejecuta restore, build, tests .NET y ",
          { kind: "code", text: "node tools/verify_pixel_crew.mjs" },
          ".",
        ],
        [
          "El gate evalúa 100 seeds no vistas, exige al menos 300 generaciones, valida los 258 pesos de cada checkpoint y prueba la política a 20, 60 y 120 FPS.",
        ],
        [
          "GitHub Actions autentica con Azure mediante OIDC, sin credenciales estáticas, y construye la imagen Docker del Web en el runner.",
        ],
        [
          "La imagen se publica en Azure Container Registry con el SHA del commit; después se aplican migraciones EF Core usando un secreto leído de Key Vault.",
        ],
        [
          "Azure Container Apps actualiza el Web con una a dos réplicas y espera hasta 150 segundos por salud y por el contrato visual del Hero.",
        ],
        [
          "Si falla, el workflow restaura la imagen anterior. La etiqueta ",
          { kind: "code", text: "latest" },
          " sólo se mueve después de que Web y Worker están sanos.",
        ],
      ],
    },
    {
      kind: "code",
      language: "yaml",
      caption: "ci.yml — el Hero también tiene un release contract",
      code: `- name: Verify trained homepage policy
  run: node tools/verify_pixel_crew.mjs

- name: Wait for Web app health
  run: |
    curl --fail "https://$WEB_FQDN/health/ready"
    HOME_HTML=$(curl --fail --silent "https://$WEB_FQDN/")
    grep -q 'class="ph-hero' <<< "$HOME_HTML"
    grep -q 'id="ph-scene-root"' <<< "$HOME_HTML"`,
    },
    {
      kind: "paragraph",
      content: [
        "Comprobar sólo ",
        { kind: "code", text: "/health/ready" },
        " demostraría que ASP.NET arrancó, no que la portada correcta fue desplegada. El segundo check busca el Hero y el contenedor de la escena en el HTML real. Es una verificación pequeña, pero conecta el release con la experiencia que el usuario debe recibir.",
      ],
    },
    {
      kind: "deployPipeline",
      variant: "release-gate",
      caption:
        "La decisión del workflow después de actualizar Container Apps — latest sólo avanza si el hero responde",
    },
  ],
};
