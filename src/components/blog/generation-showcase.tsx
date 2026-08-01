"use client";

import { useEffect, useRef, useState } from "react";

const ASSET_BASE = "/blog/artisanal-brew-assets";

/**
 * The same files GlobalScene ships, so a card shows the real crew against the
 * real sky rather than a diagram of it. Sheets carry their frame count: every
 * one of these is a horizontal strip, and drawing the whole PNG paints all of
 * its frames side by side — which is exactly what used to land in the card as
 * a row of tiny robots.
 */
const ASSET_SOURCES = {
  robot: { src: `${ASSET_BASE}/pl-robot-coincrew.png`, frames: 5 },
  robotFlip: { src: `${ASSET_BASE}/pl-robot-coincrew-flip.png`, frames: 5 },
  robotSip: { src: `${ASSET_BASE}/pl-robot-coincrew-sip.png`, frames: 4 },
  jetFlame: { src: `${ASSET_BASE}/pl-robot-jetflame.png`, frames: 4 },
  shoes: { src: `${ASSET_BASE}/pl-sonic-shoes.png`, frames: 3 },
  coin: { src: `${ASSET_BASE}/coffee-coin-pixel.png`, frames: 1 },
  mug: { src: `${ASSET_BASE}/pl-mug-coffee.png`, frames: 1 },
  andromeda: { src: `${ASSET_BASE}/pl-andromeda.png`, frames: 1 },
  planet: { src: `${ASSET_BASE}/pl-planet.png`, frames: 1 },
  planetRinged: { src: `${ASSET_BASE}/pl-planet-ringed.png`, frames: 1 },
  eth: { src: `${ASSET_BASE}/pl-chain-ethereum.png`, frames: 1 },
  sol: { src: `${ASSET_BASE}/pl-chain-solana.png`, frames: 1 },
  bnb: { src: `${ASSET_BASE}/pl-chain-bnb.png`, frames: 1 },
} as const;

type AssetKey = keyof typeof ASSET_SOURCES;

/** Shared across the three cards on screen — one fetch per sprite, not three. */
const imageCache = new Map<string, HTMLImageElement>();

function loadAssets(onReady: () => void) {
  const images = {} as Record<AssetKey, HTMLImageElement>;

  (Object.keys(ASSET_SOURCES) as AssetKey[]).forEach((key) => {
    const { src } = ASSET_SOURCES[key];
    const cached = imageCache.get(src);

    if (cached) {
      images[key] = cached;
      if (cached.complete) return;
      cached.addEventListener("load", onReady, { once: true });
      return;
    }

    const img = new Image();
    img.src = src;
    img.addEventListener("load", onReady, { once: true });
    imageCache.set(src, img);
    images[key] = img;
  });

  return images;
}

/**
 * The star field from the pixel scene: a plus sign, not a dot, in the four
 * tints the scene uses. Positions are fractions of the frame so they land in
 * the same places whatever size the card ends up.
 */
const STARS = [
  { x: 0.08, y: 0.12, color: "#a7a094", phase: 0 },
  { x: 0.25, y: 0.28, color: "#8fb99b", phase: 0.7 },
  { x: 0.48, y: 0.1, color: "#a7a094", phase: 1.4 },
  { x: 0.88, y: 0.2, color: "#e5c078", phase: 2.1 },
  { x: 0.12, y: 0.52, color: "#a7a094", phase: 1.8 },
  { x: 0.55, y: 0.44, color: "#c89b6a", phase: 0.4 },
  { x: 0.92, y: 0.62, color: "#a7a094", phase: 1.1 },
  { x: 0.18, y: 0.85, color: "#8fb99b", phase: 2.5 },
  { x: 0.47, y: 0.92, color: "#a7a094", phase: 0.9 },
  { x: 0.75, y: 0.76, color: "#e5c078", phase: 1.6 },
  { x: 0.37, y: 0.72, color: "#a7a094", phase: 2.2 },
  { x: 0.64, y: 0.36, color: "#8fb99b", phase: 1.2 },
];

export interface CheckpointInfo {
  checkpoint: string;
  tag?: string;
  reward: string;
  description: string;
  behaviorType: "untrained" | "early" | "trained";
}

interface GenerationShowcaseProps {
  items: CheckpointInfo[];
  /** The section's heading, rendered on the same row as the view controls. */
  title?: string;
  titleId?: string;
}

export default function GenerationShowcase({
  items,
  title,
  titleId,
}: GenerationShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  return (
    <div className="blog-gen-showcase blog-bleed">
      <div className="blog-gen-showcase-header">
        {title && (
          <h3 id={titleId} className="blog-gen-showcase-title">
            {title}
          </h3>
        )}
        <div className="blog-gen-controls">
          <div
            className="blog-asset-switcher"
            role="group"
            aria-label="Modo de visualización"
          >
            <button
              type="button"
              className={`blog-asset-tab ${viewMode === "grid" ? "is-active" : ""}`}
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              Vista Comparativa (3 Cols)
            </button>
            <button
              type="button"
              className={`blog-asset-tab ${viewMode === "single" ? "is-active" : ""}`}
              aria-pressed={viewMode === "single"}
              onClick={() => setViewMode("single")}
            >
              Foco Detallado
            </button>
          </div>
          <button
            type="button"
            className="blog-gen-play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pausar animación" : "Reproducir animación"}
            aria-pressed={!isPlaying}
          >
            {isPlaying ? "⏸ Pausar" : "▶ Reanudar"}
          </button>
        </div>
      </div>

      {viewMode === "single" && (
        <div className="blog-gen-tabs">
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`blog-gen-tab ${selectedIndex === idx ? "is-active" : ""}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <span className="blog-gen-tab-name">{item.checkpoint}</span>
              <span className="blog-gen-tab-score">{item.reward} mon/ep</span>
            </button>
          ))}
        </div>
      )}

      {/* The frame carries no padding of its own: the gutters between the
          cards are the only spacing, so the outer two start and end at the
          section's edges and every card is as tall as the row. */}
      <div className="blog-gen-frame">
        <div
          className={`blog-gen-grid ${
            viewMode === "grid"
              ? "blog-gen-grid--three"
              : "blog-gen-grid--single"
          }`}
        >
          {items.map((item, idx) => {
            if (viewMode === "single" && idx !== selectedIndex) return null;
            return (
              <CheckpointCard
                key={idx}
                item={item}
                isPlaying={isPlaying}
                isActive={selectedIndex === idx}
                onSelect={() => setSelectedIndex(idx)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckpointCard({
  item,
  isPlaying,
  isActive,
  onSelect,
}: {
  item: CheckpointInfo;
  isPlaying: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /**
   * Pausing must not restart the run: the render loop reads the flag through
   * a ref so toggling it leaves the simulation — and the sprite decoding —
   * exactly where they were.
   */
  const playingRef = useRef(isPlaying);
  const animationControlRef = useRef<(playing: boolean) => void>(() => {});

  useEffect(() => {
    playingRef.current = isPlaying;
    animationControlRef.current(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let isNearViewport = false;
    let pageVisible = !document.hidden;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let motionAllowed = !motionQuery.matches;
    let width = 320;
    let height = 240;
    let queueFrame = () => {};
    const shouldAnimate = () =>
      playingRef.current && isNearViewport && pageVisible && motionAllowed;
    /**
     * Sprites are drawn at whole multiples of their source size — a pixel
     * sprite at 1.37× is a smear. One step up once the frame is tall enough
     * to carry it, so the crew reads at a glance in the single-card view
     * without turning into blocks in the three-column grid.
     */
    let unit = 1;

    const assets = loadAssets(() => {
      // A sprite that arrives after the first frames still has to appear.
      if (!isNearViewport) return;
      if (shouldAnimate()) queueFrame();
      else draw(performance.now());
    });

    /** Backing store in device pixels, drawing in CSS pixels. */
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      unit = height >= 330 ? 2 : 1;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Everything below is placed in fractions of the frame, so a resize
      // only has to put the actors back inside the new one.
      x = Math.min(x, width - 20);
      y = Math.min(y, height - 20);
      targetX = width * 0.72;
      targetY = height * 0.3;
      mugX = width * 0.8;
      mugY = height * 0.78;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Physics Simulation State per checkpoint
    let x = width * 0.2;
    let y = height * 0.5;
    let vx = 0;
    let vy = 0;
    let angle = 0;
    const trail: { x: number; y: number }[] = [];

    // Target positions
    let targetX = width * 0.72;
    let targetY = height * 0.3;
    let mugX = width * 0.8;
    let mugY = height * 0.78;

    let step = 0;
    let isSipping = false;

    resize();

    /** One frame out of a horizontal sprite strip, centred on (0, 0). */
    const drawSprite = (
      key: AssetKey,
      frame: number,
      drawWidth: number,
      drawHeight: number,
      offsetX = 0,
      offsetY = 0,
      /** Fraction of the sprite's bottom to cut off, top-anchored. */
      cropBottom = 0,
    ) => {
      const image = assets[key];
      if (!image?.complete || !image.naturalWidth) return;

      const { frames } = ASSET_SOURCES[key];
      const frameWidth = image.naturalWidth / frames;
      const keep = 1 - cropBottom;

      ctx.drawImage(
        image,
        frameWidth * (frame % frames),
        0,
        frameWidth,
        image.naturalHeight * keep,
        offsetX - drawWidth / 2,
        offsetY - drawHeight / 2,
        drawWidth,
        drawHeight * keep,
      );
    };

    const drawBackdrop = (time: number) => {
      // The scene's own sky: a warm base with an amber glow top-left and a
      // green one bottom-right (see .blog-scene-preview__canvas).
      ctx.fillStyle = "#100d0b";
      ctx.fillRect(0, 0, width, height);

      const glow = (
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        color: string,
      ) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx, ry);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(16, 13, 11, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      };

      glow(width * 0.18, height * 0.14, width * 0.62, height * 0.52, "rgba(200, 155, 106, 0.15)");
      glow(width * 0.82, height * 0.72, width * 0.55, height * 0.48, "rgba(143, 185, 155, 0.1)");

      // Plus-shaped stars, blinking on their own offsets.
      const arm = 3 * unit;
      const bar = unit;
      STARS.forEach((star) => {
        const blink = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time / 900 + star.phase * 2));
        const sx = Math.round(star.x * width);
        const sy = Math.round(star.y * height);

        ctx.globalAlpha = blink;
        ctx.fillStyle = star.color;
        ctx.fillRect(sx - arm, sy - bar / 2, arm * 2, bar);
        ctx.fillRect(sx - bar / 2, sy - arm, bar, arm * 2);
      });
      ctx.globalAlpha = 1;

      // Celestial layer, in the scene's arrangement: planet top-left, ringed
      // planet top-right, Andromeda low on the right, chains scattered.
      ctx.globalAlpha = 0.75;
      drawSprite("planet", 0, 22 * unit, 22 * unit, width * 0.1, height * 0.16);
      drawSprite("planetRinged", 0, 30 * unit, 24 * unit, width * 0.86, height * 0.14);
      ctx.globalAlpha = 0.5;
      drawSprite("andromeda", 0, 66 * unit, 42 * unit, width * 0.78, height * 0.9);
      ctx.globalAlpha = 0.7;
      // Kept clear of the two hot spots: the status badge in the bottom-left
      // corner and the coin the robot is chasing.
      drawSprite("eth", 0, 14 * unit, 14 * unit, width * 0.07, height * 0.62);
      drawSprite("sol", 0, 16 * unit, 16 * unit, width * 0.2, height * 0.34);
      drawSprite("bnb", 0, 14 * unit, 14 * unit, width * 0.92, height * 0.44);
      ctx.globalAlpha = 1;
    };

    const draw = (time: number) => {
      animationFrameId = 0;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;

      drawBackdrop(time);

      if (playingRef.current) {
        step += 1;

        // Forces scale with the frame so the run reads the same whether the
        // card is a narrow column or the full measure.
        const force = unit;
        const margin = 14 * unit;

        if (item.behaviorType === "untrained") {
          // Gen 0: Erratic random walk, wall bounces
          angle += (Math.random() - 0.5) * 0.45;
          const speed = 1.8 * force;
          vx += Math.cos(angle) * speed * 0.22;
          vy += Math.sin(angle) * speed * 0.22;
          vx *= 0.94;
          vy *= 0.94;

          if (x < margin || x > width - margin) {
            vx *= -1;
            angle = Math.PI - angle;
          }
          if (y < margin || y > height - margin) {
            vy *= -1;
            angle = -angle;
          }
        } else if (item.behaviorType === "early") {
          // Gen 20: Heavy target acceleration & sharp overshoot oscillation
          const dx = targetX - x;
          const dy = targetY - y;
          const dist = Math.hypot(dx, dy);

          if (dist > 18 * unit) {
            const accel = 0.58 * force;
            vx += (dx / dist) * accel;
            vy += (dy / dist) * accel;
          } else {
            // Relocate coin on hit
            targetX = margin * 2 + Math.random() * (width - margin * 4);
            targetY = margin * 2 + Math.random() * (height - margin * 4);
          }
          vx *= 0.965;
          vy *= 0.965;
          angle = Math.atan2(vy, vx);

          if (x < margin || x > width - margin) vx *= -0.8;
          if (y < margin || y > height - margin) vy *= -0.8;
        } else {
          // Gen 300: Inertia glide, coffee mug evaluation
          const currentTargetX = step % 260 < 130 ? targetX : mugX;
          const currentTargetY = step % 260 < 130 ? targetY : mugY;

          const dx = currentTargetX - x;
          const dy = currentTargetY - y;
          const dist = Math.hypot(dx, dy);

          const desiredAngle = Math.atan2(dy, dx);
          angle += (desiredAngle - angle) * 0.14;

          if (dist > 22 * unit) {
            isSipping = false;
            const boost = (dist > 60 * unit ? 0.48 : 0.18) * force;
            vx += Math.cos(angle) * boost;
            vy += Math.sin(angle) * boost;
          } else {
            // Scoop / sip action near coffee mug
            if (currentTargetX === mugX) isSipping = true;
            vx *= 0.82;
            vy *= 0.82;
          }
          vx *= 0.95;
          vy *= 0.95;
        }

        x = Math.max(margin, Math.min(width - margin, x + vx));
        y = Math.max(margin, Math.min(height - margin, y + vy));

        trail.push({ x, y });
        if (trail.length > 60) trail.shift();
      }

      const behaviourColor =
        item.behaviorType === "untrained"
          ? "248, 113, 113"
          : item.behaviorType === "early"
          ? "251, 191, 36"
          : "52, 211, 153";

      // What the policy is actually being paid for. A ring around the coin
      // says "this is the target" without a caption, which is the whole
      // reason the erratic run reads as failure and the last one as skill.
      ctx.save();
      ctx.strokeStyle = `rgba(${behaviourColor}, 0.45)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(targetX, targetY, 14 * unit, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Coin and mug: the two things worth flying to.
      ctx.save();
      ctx.shadowColor = "rgba(236, 178, 66, 0.55)";
      ctx.shadowBlur = 8 * unit;
      drawSprite("coin", 0, 16 * unit, 16 * unit, targetX, targetY);
      ctx.restore();
      drawSprite("mug", 0, 16 * unit, 16 * unit, mugX, mugY);

      // Trajectory: the record of the decisions made to get here.
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = `rgba(${behaviourColor}, 0.65)`;
        ctx.lineWidth = 1.5 * unit;
        if (item.behaviorType === "untrained") ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const movingLeft = Math.cos(angle) < 0;
      const speed = Math.hypot(vx, vy);
      const robotSize = 26 * unit;
      // Sprite sheets run at a steady cadence rather than per animation
      // frame, which would be a blur on a 120Hz display.
      const spriteFrame = Math.floor(time / 140);

      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));

      // Thrust, opposite the direction of travel.
      if (speed > 0.4 * unit) {
        ctx.save();
        ctx.rotate(angle + Math.PI);
        drawSprite(
          "jetFlame",
          spriteFrame,
          7 * unit,
          12 * unit,
          robotSize * 0.5,
          0,
        );
        ctx.restore();
      }

      // The sneakers only make sense on the checkpoint that earned them —
      // they are the visible half of the caffeine boost.
      const wearsShoes = item.behaviorType === "trained";
      if (wearsShoes) {
        drawSprite(
          "shoes",
          spriteFrame,
          14 * unit,
          14 * unit,
          0,
          robotSize * 0.42,
        );
      }

      const robotKey: AssetKey = isSipping
        ? "robotSip"
        : movingLeft
        ? "robotFlip"
        : "robot";
      // Same trim GlobalScene applies with clip-path: without it the robot's
      // own feet poke out under the sneakers and you get two pairs.
      drawSprite(
        robotKey,
        spriteFrame,
        robotSize,
        robotSize,
        0,
        0,
        wearsShoes ? 0.125 : 0,
      );

      ctx.restore();

      queueFrame();
    };

    queueFrame = () => {
      if (!animationFrameId && shouldAnimate()) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const stopFrame = () => {
      if (!animationFrameId) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    };

    const renderRestingFrame = () => {
      stopFrame();
      if (isNearViewport) draw(performance.now());
    };

    animationControlRef.current = (playing) => {
      playingRef.current = playing;
      if (playing) queueFrame();
      else renderRestingFrame();
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting;
        if (!isNearViewport) {
          stopFrame();
          return;
        }

        if (shouldAnimate()) queueFrame();
        else draw(performance.now());
      },
      { rootMargin: "160px 0px", threshold: 0 },
    );

    const onDocumentVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) queueFrame();
      else stopFrame();
    };

    const onMotionPreference = () => {
      motionAllowed = !motionQuery.matches;
      if (motionAllowed) queueFrame();
      else renderRestingFrame();
    };

    visibilityObserver.observe(canvas);
    document.addEventListener("visibilitychange", onDocumentVisibility);
    motionQuery.addEventListener("change", onMotionPreference);

    return () => {
      observer.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onDocumentVisibility);
      motionQuery.removeEventListener("change", onMotionPreference);
      animationControlRef.current = () => {};
      stopFrame();
    };
  }, [item.behaviorType]);

  const colorClass =
    item.behaviorType === "untrained"
      ? "is-untrained"
      : item.behaviorType === "early"
      ? "is-early"
      : "is-trained";

  return (
    <button
      type="button"
      className={`blog-gen-card ${colorClass} ${isActive ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`${item.checkpoint}: ${item.reward} monedas por episodio`}
    >
      <div className="blog-gen-card-header">
        <div className="blog-gen-card-title-group">
          <span className="blog-gen-card-title">{item.checkpoint}</span>
          {item.tag && <span className="blog-gen-card-tag">{item.tag}</span>}
        </div>
        <span className="blog-gen-card-badge">{item.reward} mon/ep</span>
      </div>

      <div className="blog-gen-card-viewport">
        <canvas
          ref={canvasRef}
          className="blog-gen-canvas"
          role="img"
          aria-label={`Simulación visual: ${item.description}`}
        />
        <div className="blog-gen-canvas-overlay">
          <span className="blog-gen-sim-status">
            {item.behaviorType === "untrained" && "⚠ Deriva sin control"}
            {item.behaviorType === "early" && "⚡ Sobrepasa objetivo"}
            {item.behaviorType === "trained" && "★ Deslizamiento inercial óptimo"}
          </span>
        </div>
      </div>

      <div className="blog-gen-card-body">
        <p className="blog-gen-card-desc">{item.description}</p>
      </div>
    </button>
  );
}
