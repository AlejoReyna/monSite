"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

type Point = { x: number; y: number };

const initialRobot = { x: 17, y: 67 };
const coin = { x: 76, y: 27 };

export default function ChoreographyComparison() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [robot, setRobot] = useState<Point>(initialRobot);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "pursuing" | "collected">("idle");

  useEffect(() => {
    if (phase !== "pursuing") return;

    let frame = 0;
    const advance = () => {
      setRobot((position) => {
        const dx = coin.x - position.x;
        const dy = coin.y - position.y;

        if (Math.hypot(dx, dy) < 2.2) {
          setPhase("collected");
          return coin;
        }

        return { x: position.x + dx * 0.045, y: position.y + dy * 0.045 };
      });
      frame = requestAnimationFrame(advance);
    };

    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const placeRobot = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const bounds = stage.getBoundingClientRect();
    setRobot({
      x: Math.max(6, Math.min(94, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(12, Math.min(88, ((event.clientY - bounds.top) / bounds.height) * 100)),
    });
  };

  const reset = () => {
    setRobot(initialRobot);
    setPhase("idle");
  };

  return (
    <figure className="blog-choreography-comparison blog-bleed">
      <div className="blog-choreography-comparison__grid">
        <section className="blog-choreography-panel blog-choreography-panel--fixed" aria-label="Coreografía fija">
          <header>
            <span className="blog-choreography-panel__title-group">
              <strong>Coreografía 0</strong>
              <span>Ruta predefinida</span>
            </span>
            <span className="blog-choreography-panel__badge">90 s</span>
          </header>
          <div className="blog-choreography-stage blog-choreography-stage--fixed" aria-hidden="true">
            <svg
              className="blog-choreography-path blog-choreography-path--fixed"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M 17 67 C 38 65, 64 47, 76 27" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="blog-choreography-coin blog-choreography-coin--fixed" />
            <span className="blog-choreography-robot blog-choreography-robot--fixed" />
            <span className="blog-choreography-clock">reloj: 90 s</span>
          </div>
          <p>La ruta y el momento de desaparecer ya están escritos.</p>
        </section>

        <section className="blog-choreography-panel blog-choreography-panel--sim" aria-label="Simulación reactiva">
          <header>
            <span className="blog-choreography-panel__title-group">
              <strong>Simulación</strong>
              <span>Observa y reacciona</span>
            </span>
            <span className="blog-choreography-panel__badge">en vivo</span>
          </header>
          <div
            ref={stageRef}
            className="blog-choreography-stage blog-choreography-stage--sim"
            onPointerDown={(event) => {
              setDragging(true);
              setPhase("idle");
              event.currentTarget.setPointerCapture(event.pointerId);
              placeRobot(event);
            }}
            onPointerMove={(event) => dragging && placeRobot(event)}
            onPointerUp={(event) => {
              setDragging(false);
              event.currentTarget.releasePointerCapture(event.pointerId);
              setPhase("pursuing");
            }}
            onPointerCancel={() => setDragging(false)}
          >
            <svg
              className="blog-choreography-path blog-choreography-path--sim"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={`M ${robot.x} ${robot.y} C ${(robot.x + coin.x) / 2} ${robot.y}, ${(robot.x + coin.x) / 2} ${coin.y}, ${coin.x} ${coin.y}`}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className={`blog-choreography-coin ${phase === "collected" ? "is-collected" : ""}`} />
            <span
              className={`blog-choreography-robot ${dragging ? "is-dragging" : ""}`}
              style={{ left: `${robot.x}%`, top: `${robot.y}%` }}
              aria-hidden="true"
            />
            <span className="blog-choreography-hint" aria-hidden="true">
              {dragging ? "suelta aquí" : phase === "pursuing" ? "la política reacciona" : phase === "collected" ? "moneda recogida" : "arrastra al robot"}
            </span>
          </div>
          <div className="blog-choreography-panel__footer">
            <p>Arrástralo y suéltalo: la política observa desde esa nueva posición.</p>
            <button type="button" onClick={reset}>Reiniciar</button>
          </div>
        </section>
      </div>
      <figcaption>
        La diferencia visible: antes el reloj decidía el resultado; ahora la posición soltada cambia la siguiente decisión.
      </figcaption>
    </figure>
  );
}
