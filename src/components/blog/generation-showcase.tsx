"use client";

import { useEffect, useRef, useState } from "react";

export interface CheckpointInfo {
  checkpoint: string;
  tag?: string;
  reward: string;
  description: string;
  behaviorType: "untrained" | "early" | "trained";
}

interface GenerationShowcaseProps {
  items: CheckpointInfo[];
  title?: string;
}

export default function GenerationShowcase({
  items,
  title = "Qué aprendió el crew (Simulación con Assets Reales)",
}: GenerationShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  return (
    <div className="blog-gen-showcase blog-bleed">
      <div className="blog-gen-showcase-header">
        <div className="blog-gen-showcase-title-wrap">
          <span className="blog-gen-showcase-dot" />
          <h4 className="blog-gen-showcase-title">{title}</h4>
        </div>
        <div className="blog-gen-controls">
          <div className="blog-asset-switcher">
            <button
              type="button"
              className={`blog-asset-tab ${viewMode === "grid" ? "is-active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              Vista Comparativa (3 Cols)
            </button>
            <button
              type="button"
              className={`blog-asset-tab ${viewMode === "single" ? "is-active" : ""}`}
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

      <div
        className={`blog-gen-grid ${
          viewMode === "grid" ? "blog-gen-grid--three" : "blog-gen-grid--single"
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let height = (canvas.height = 200);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 200;
      }
    };
    window.addEventListener("resize", handleResize);

    // Preload Real Pixel Art Image Assets
    const assets: Record<string, HTMLImageElement> = {};
    const assetSources = {
      robot: "/blog/artisanal-brew-assets/pl-robot-coincrew.png",
      robotFlip: "/blog/artisanal-brew-assets/pl-robot-coincrew-flip.png",
      robotSip: "/blog/artisanal-brew-assets/pl-robot-coincrew-sip.png",
      jetFlame: "/blog/artisanal-brew-assets/pl-robot-jetflame.png",
      shoes: "/blog/artisanal-brew-assets/pl-sonic-shoes.png",
      coin: "/blog/artisanal-brew-assets/coffee-coin-pixel.png",
      mug: "/blog/artisanal-brew-assets/pl-mug-coffee.png",
      andromeda: "/blog/artisanal-brew-assets/pl-andromeda.png",
      planet: "/blog/artisanal-brew-assets/pl-planet.png",
      planetRinged: "/blog/artisanal-brew-assets/pl-planet-ringed.png",
      eth: "/blog/artisanal-brew-assets/pl-chain-ethereum.png",
      sol: "/blog/artisanal-brew-assets/pl-chain-solana.png",
    };

    let loadedCount = 0;
    const totalAssets = Object.keys(assetSources).length;

    Object.entries(assetSources).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assets[key] = img;
        loadedCount++;
      };
    });

    // Physics Simulation State per checkpoint
    let x = width * 0.2;
    let y = height * 0.5;
    let vx = 0;
    let vy = 0;
    let angle = 0;
    let trail: { x: number; y: number }[] = [];

    // Target positions
    let targetX = width * 0.75;
    let targetY = height * 0.35;
    let mugX = width * 0.82;
    let mugY = height * 0.75;

    let step = 0;
    let isSipping = false;

    // Stars background static positions
    const stars = Array.from({ length: 18 }, (_, i) => ({
      x: (i * 47 + 13) % width,
      y: (i * 31 + 7) % height,
      size: (i % 3) + 1,
      opacity: 0.3 + (i % 5) * 0.15,
    }));

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Pixel crispness
      ctx.imageSmoothingEnabled = false;

      // Real Sky Background Gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#080911");
      bgGradient.addColorStop(0.5, "#0f101d");
      bgGradient.addColorStop(1, "#181428");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Render Stars
      stars.forEach((star) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Render Real Background celestial assets if loaded
      if (assets.andromeda) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(assets.andromeda, width - 90, 10, 80, 50);
        ctx.globalAlpha = 1.0;
      }
      if (assets.planet) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(assets.planet, 15, 15, 28, 28);
        ctx.globalAlpha = 1.0;
      }
      if (assets.planetRinged) {
        ctx.globalAlpha = 0.45;
        ctx.drawImage(assets.planetRinged, width * 0.45, height * 0.15, 36, 26);
        ctx.globalAlpha = 1.0;
      }
      if (assets.eth) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(assets.eth, 25, height - 35, 16, 20);
        ctx.globalAlpha = 1.0;
      }
      if (assets.sol) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(assets.sol, width - 40, height - 35, 20, 16);
        ctx.globalAlpha = 1.0;
      }

      if (isPlaying) {
        step += 1;

        if (item.behaviorType === "untrained") {
          // Gen 0: Erratic random walk, wall bounces
          angle += (Math.random() - 0.5) * 0.45;
          const speed = 1.8;
          vx += Math.cos(angle) * speed * 0.22;
          vy += Math.sin(angle) * speed * 0.22;
          vx *= 0.94;
          vy *= 0.94;

          if (x < 20 || x > width - 20) {
            vx *= -1;
            angle = Math.PI - angle;
          }
          if (y < 20 || y > height - 20) {
            vy *= -1;
            angle = -angle;
          }
        } else if (item.behaviorType === "early") {
          // Gen 20: Heavy target acceleration & sharp overshoot oscillation
          const dx = targetX - x;
          const dy = targetY - y;
          const dist = Math.hypot(dx, dy);

          if (dist > 18) {
            const accel = 0.58;
            vx += (dx / dist) * accel;
            vy += (dy / dist) * accel;
          } else {
            // Relocate coin on hit
            targetX = 40 + Math.random() * (width - 80);
            targetY = 40 + Math.random() * (height - 80);
          }
          vx *= 0.965;
          vy *= 0.965;
          angle = Math.atan2(vy, vx);

          if (x < 20 || x > width - 20) vx *= -0.8;
          if (y < 20 || y > height - 20) vy *= -0.8;
        } else {
          // Gen 300: Inertia glide, coffee mug evaluation
          const currentTargetX = step % 260 < 130 ? targetX : mugX;
          const currentTargetY = step % 260 < 130 ? targetY : mugY;

          const dx = currentTargetX - x;
          const dy = currentTargetY - y;
          const dist = Math.hypot(dx, dy);

          const desiredAngle = Math.atan2(dy, dx);
          angle += (desiredAngle - angle) * 0.14;

          if (dist > 22) {
            isSipping = false;
            const boost = dist > 60 ? 0.48 : 0.18;
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

        x = Math.max(20, Math.min(width - 20, x + vx));
        y = Math.max(20, Math.min(height - 20, y + vy));

        trail.push({ x, y });
        if (trail.length > 50) trail.shift();
      }

      // Draw Real Coin Asset
      if (assets.coin) {
        ctx.drawImage(assets.coin, targetX - 12, targetY - 12, 24, 24);
      } else {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Real Coffee Mug Asset
      if (assets.mug) {
        ctx.drawImage(assets.mug, mugX - 14, mugY - 14, 28, 28);
      } else {
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(mugX, mugY, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Trajectory Trail Line
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        const trailColor =
          item.behaviorType === "untrained"
            ? "rgba(248, 113, 113, "
            : item.behaviorType === "early"
            ? "rgba(251, 191, 36, "
            : "rgba(52, 211, 153, ";
        ctx.strokeStyle = trailColor + "0.65)";
        ctx.lineWidth = 2.5;
        if (item.behaviorType === "untrained") ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Real Robot Asset
      const movingLeft = Math.cos(angle) < 0;
      const speed = Math.hypot(vx, vy);

      ctx.save();
      ctx.translate(x, y);

      // Jetflame behind robot if thrusting
      if (speed > 0.4 && assets.jetFlame) {
        ctx.save();
        ctx.rotate(angle + Math.PI);
        ctx.drawImage(assets.jetFlame, 12, -8, 16, 16);
        ctx.restore();
      }

      // Sonic shoes for Gen 300 boost
      if (item.behaviorType === "trained" && assets.shoes) {
        ctx.drawImage(assets.shoes, -14, 10, 24, 12);
      }

      // Pick robot asset: sip / flip / normal
      let robotSprite = movingLeft ? assets.robotFlip : assets.robot;
      if (isSipping && assets.robotSip) {
        robotSprite = assets.robotSip;
      }

      if (robotSprite) {
        ctx.drawImage(robotSprite, -20, -20, 40, 40);
      } else {
        // Fallback rectangle if images loading
        ctx.fillStyle =
          item.behaviorType === "untrained"
            ? "#ef4444"
            : item.behaviorType === "early"
            ? "#f59e0b"
            : "#10b981";
        ctx.fillRect(-12, -12, 24, 24);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, item.behaviorType]);

  const colorClass =
    item.behaviorType === "untrained"
      ? "is-untrained"
      : item.behaviorType === "early"
      ? "is-early"
      : "is-trained";

  return (
    <div
      className={`blog-gen-card ${colorClass} ${isActive ? "is-selected" : ""}`}
      onClick={onSelect}
    >
      <div className="blog-gen-card-header">
        <div className="blog-gen-card-title-group">
          <span className="blog-gen-card-title">{item.checkpoint}</span>
          {item.tag && <span className="blog-gen-card-tag">{item.tag}</span>}
        </div>
        <span className="blog-gen-card-badge">{item.reward} mon/ep</span>
      </div>

      <div className="blog-gen-card-viewport">
        <canvas ref={canvasRef} className="blog-gen-canvas" />
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
    </div>
  );
}
