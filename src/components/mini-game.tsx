"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";

type Enemy = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
};

type PointerState = {
  isActive: boolean;
  x: number;
};

const BASE_WIDTH = 640;
const BASE_HEIGHT = 360;

export default function MiniGame() {
  const { language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const playerXRef = useRef<number>(BASE_WIDTH / 2);
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  const enemiesRef = useRef<Enemy[]>([]);
  const spawnTimerRef = useRef<number>(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const pointerRef = useRef<PointerState>({ isActive: false, x: BASE_WIDTH / 2 });

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    function resizeCanvas() {
      if (!canvasEl) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvasEl.parentElement;
      const cssWidth = Math.min(parent ? parent.clientWidth : BASE_WIDTH, 900);
      const cssHeight = Math.round((cssWidth / BASE_WIDTH) * BASE_HEIGHT);
      canvasEl.style.width = `${cssWidth}px`;
      canvasEl.style.height = `${cssHeight}px`;
      canvasEl.width = Math.round(cssWidth * pixelRatio);
      canvasEl.height = Math.round(cssHeight * pixelRatio);
      if (!ctx) return;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    resizeCanvas();
    setIsReady(true);

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keysRef.current.right = true;
      if (!isRunning && (e.key === " " || e.key.toLowerCase() === "r")) restart();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keysRef.current.right = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!canvasEl) return;
      pointerRef.current.isActive = true;
      pointerRef.current.x = getLocalX(e);
      canvasEl.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!canvasEl) return;
      if (!pointerRef.current.isActive) return;
      pointerRef.current.x = getLocalX(e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!canvasEl) return;
      pointerRef.current.isActive = false;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch {}
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvasEl.addEventListener("pointerdown", handlePointerDown);
    canvasEl.addEventListener("pointermove", handlePointerMove);
    canvasEl.addEventListener("pointerup", handlePointerUp);
    canvasEl.addEventListener("pointercancel", handlePointerUp);

    startLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvasEl.removeEventListener("pointerdown", handlePointerDown);
      canvasEl.removeEventListener("pointermove", handlePointerMove);
      canvasEl.removeEventListener("pointerup", handlePointerUp);
      canvasEl.removeEventListener("pointercancel", handlePointerUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };

    function getLocalX(e: PointerEvent): number {
      if (!canvasEl) return BASE_WIDTH / 2;
      const rect = canvasEl.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) * (BASE_WIDTH / rect.width);
      return Math.max(16, Math.min(BASE_WIDTH - 16, relativeX));
    }

    function startLoop() {
      rafRef.current = requestAnimationFrame(loop);
    }

    function loop(timestamp: number) {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = timestamp;

      update(dt);
      render(ctx as CanvasRenderingContext2D);

      rafRef.current = requestAnimationFrame(loop);
    }

    function update(dt: number) {
      if (!isRunning) return;

      const moveSpeed = 360; // px/s
      const playerWidth = 56;
      const playerHalf = playerWidth / 2;
      let nextX = playerXRef.current;

      if (keysRef.current.left) nextX -= moveSpeed * dt;
      if (keysRef.current.right) nextX += moveSpeed * dt;
      if (pointerRef.current.isActive) {
        const toward = pointerRef.current.x - nextX;
        const maxStep = moveSpeed * 1.2 * dt;
        if (Math.abs(toward) <= maxStep) nextX = pointerRef.current.x;
        else nextX += Math.sign(toward) * maxStep;
      }

      nextX = Math.max(playerHalf + 4, Math.min(BASE_WIDTH - playerHalf - 4, nextX));
      playerXRef.current = nextX;

      const difficulty = 1 + score * 0.0025; // slowly increase
      spawnTimerRef.current -= dt;
      const spawnInterval = Math.max(0.35, 0.9 / difficulty);
      if (spawnTimerRef.current <= 0) {
        spawnTimerRef.current = spawnInterval;
        const w = 24 + Math.random() * 40;
        const x = 12 + Math.random() * (BASE_WIDTH - 24 - w);
        const vy = 120 * difficulty + Math.random() * 80 * difficulty;
        enemiesRef.current.push({ x, y: -32, width: w, height: 16 + Math.random() * 12, velocityY: vy });
      }

      const enemies = enemiesRef.current;
      for (let i = enemies.length - 1; i >= 0; i -= 1) {
        const e = enemies[i];
        e.y += e.velocityY * dt;
        if (e.y - e.height > BASE_HEIGHT) enemies.splice(i, 1);
      }

      // collision
      const px = playerXRef.current - playerHalf;
      const py = BASE_HEIGHT - 28;
      const pw = playerWidth;
      const ph = 12;
      for (const e of enemies) {
        const overlap =
          px < e.x + e.width &&
          px + pw > e.x &&
          py < e.y + e.height &&
          py + ph > e.y;
        if (overlap) {
          setIsRunning(false);
          setBest((b) => Math.max(b, Math.floor(score)));
          break;
        }
      }

      setScore((s) => s + dt * 60);
    }

    function render(ctx2: CanvasRenderingContext2D) {
      const LABEL_SCORE = t('score', language);
      const LABEL_BEST = t('best', language);
      const LABEL_GAME_OVER = t('gameOver', language);
      const LABEL_RESTART = t('restartHint', language);
      // clear
      ctx2.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

      // background
      const gradient = ctx2.createLinearGradient(0, 0, 0, BASE_HEIGHT);
      gradient.addColorStop(0, "rgba(23,23,23,1)");
      gradient.addColorStop(1, "rgba(10,10,10,1)");
      ctx2.fillStyle = gradient;
      ctx2.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

      // player
      const playerWidth = 56;
      const playerHeight = 12;
      const playerX = playerXRef.current - playerWidth / 2;
      const playerY = BASE_HEIGHT - 28;
      ctx2.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(ctx2, playerX, playerY, playerWidth, playerHeight, 6);
      ctx2.fill();

      // enemies
      for (const e of enemiesRef.current) {
        ctx2.fillStyle = "rgba(180,180,255,0.85)";
        roundRect(ctx2, e.x, e.y, e.width, e.height, 6);
        ctx2.fill();
      }

      // score
      ctx2.fillStyle = "rgba(255,255,255,0.9)";
      ctx2.font = "bold 16px ui-sans-serif, system-ui, -apple-system";
      ctx2.fillText(`${LABEL_SCORE}: ${Math.floor(score)}`, 12, 22);
      ctx2.fillText(`${LABEL_BEST}: ${best}`, 12, 42);

      if (!isRunning) {
        ctx2.fillStyle = "rgba(0,0,0,0.5)";
        ctx2.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx2.fillStyle = "white";
        ctx2.font = "bold 24px ui-sans-serif, system-ui, -apple-system";
        ctx2.textAlign = "center";
        ctx2.fillText(LABEL_GAME_OVER, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 12);
        ctx2.font = "16px ui-sans-serif, system-ui, -apple-system";
        ctx2.fillText(LABEL_RESTART, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 16);
        ctx2.textAlign = "start";
      }
    }

    function roundRect(
      ctx3: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx3.beginPath();
      ctx3.moveTo(x + r, y);
      ctx3.lineTo(x + width - r, y);
      ctx3.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx3.lineTo(x + width, y + height - r);
      ctx3.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx3.lineTo(x + r, y + height);
      ctx3.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx3.lineTo(x, y + r);
      ctx3.quadraticCurveTo(x, y, x + r, y);
      ctx3.closePath();
    }

    function restart() {
      enemiesRef.current = [];
      spawnTimerRef.current = 0;
      lastTimeRef.current = null;
      playerXRef.current = BASE_WIDTH / 2;
      setScore(0);
      setIsRunning(true);
    }

    // restart on tap while overlay is active
    const onTapRestart = () => {
      if (!isRunning) restart();
    };
    const el = canvasEl;
    if (!el) return;
    el!.addEventListener("click", onTapRestart);
    return () => {
      el!.removeEventListener("click", onTapRestart);
    };
  }, [best, isRunning, score, language]);

  return (
    <section
      id="play"
      className="relative z-10 mx-auto mt-24 max-w-6xl px-6"
      aria-label="Mini game section"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            {t('miniGameTitle', language)}
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400 sm:text-base">
          {t('miniGameInstructions', language)}
        </p>
      </div>

      <div
        className="relative mx-auto mt-8 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm shadow-2xl"
        role="group"
        aria-label="Game panel"
      >
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-60" />
        <div className="flex flex-col items-center gap-3">
          <canvas
            ref={canvasRef}
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
            className="mx-auto block select-none rounded-lg bg-black/60 outline-none"
            aria-label="Game canvas"
          />

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400 sm:text-sm">
            <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">←</kbd>
            <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">→</kbd>
            <span className="hidden sm:inline">
              {language === "zh" ? "或" : "o"}
            </span>
            <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">A</kbd>
            <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1">D</kbd>
            <span>{t('tapOrClickToMove', language)}</span>
            <span className="hidden sm:inline">•</span>
            <span>{t('spaceToRestart', language)}</span>
          </div>

          {!isReady && (
            <div className="text-xs text-gray-500">{t('loading', language)}</div>
          )}
        </div>
      </div>
    </section>
  );
}
