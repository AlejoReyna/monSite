"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { projects, TRAINER } from "@/data/projects";
import {
  INTRO_LINES,
  NPCS,
  SIGNS,
  TUTORIAL_LINES,
  WILD_SKILLS,
  loadBadges,
} from "@/data/game";
import { buildSolids, moveWithCollision } from "./forest-collision";
import {
  drawExclaim,
  drawLabel,
  drawNpc,
  drawSprite,
  getNpcPalette,
  getPalette,
  getSpriteRows,
  inGrass,
  paintPortrait,
  paintTerrain,
  rect,
  type Character,
  type Face,
  type NpcTint,
} from "./forest-render";

interface Pos {
  x: number;
  y: number;
}

interface DialogState {
  speaker: string;
  lines: string[];
  index: number;
  onDone?: () => void;
}

type Phase = "title" | "intro" | "play";

const SOUTH_SPAWN: Pos = { x: 159, y: 248 };

function nearDoor(p: Pos) {
  return projects.findIndex(
    (h) => Math.abs(p.x - h.door) < 10 && Math.abs(p.y - h.dest) < 10,
  );
}

function nearNpc(p: Pos) {
  return NPCS.findIndex(
    (n) => Math.abs(p.x - n.x) < 16 && Math.abs(p.y - n.y) < 16,
  );
}

function nearSign(p: Pos) {
  return SIGNS.findIndex(
    (s) => Math.abs(p.x - s.x) < 16 && Math.abs(p.y - s.y) < 16,
  );
}

interface SpeakerLook {
  char: Character;
  tint?: NpcTint;
}

const SPEAKER_LOOK: Record<string, SpeakerLook> = {
  "PROF. ROBLE": { char: "oak" },
  "RECLUTADORA MAYA": { char: "generic", tint: "maya" },
  "DEV BETO": { char: "generic", tint: "beto" },
};

const PLAYER_LOOK: SpeakerLook = { char: "player" };
const OAK_LOOK: SpeakerLook = { char: "oak" };

/** Retrato pixel del hablante dentro de la caja de diálogo. */
function Portrait({ look, big = false }: { look: SpeakerLook; big?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    paintPortrait(
      canvas,
      look.char,
      "down",
      look.tint ? getNpcPalette(look.tint) : undefined,
    );
  }, [look]);
  return (
    <canvas
      ref={ref}
      className={big ? "portrait portrait-big" : "portrait"}
      aria-hidden="true"
    />
  );
}

function beep(freq = 660, muted = false) {
  if (muted) return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.07);
    o.onended = () => void ctx.close();
  } catch {
    // sin audio, el juego sigue
  }
}

export default function ForestTown() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<Pos>({ ...SOUTH_SPAWN });
  const routeRef = useRef<Pos[]>([]);
  const pendingPreviewRef = useRef<number | null>(null);
  const pendingDialogRef = useRef<{ kind: "npc" | "sign"; id: number } | null>(
    null,
  );
  const faceRef = useRef<Face>("up");
  const stepRef = useRef(0);
  const movingRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const timeRef = useRef(0);
  const grassStepsRef = useRef(0);
  const cooldownRef = useRef(0);
  const dialogRef = useRef<DialogState | null>(null);
  const phaseRef = useRef<Phase>("title");
  const mutedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("title");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [typed, setTyped] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [badges, setBadges] = useState<string[]>(() => loadBadges());
  const [pendingPreview, setPendingPreview] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);

  const solids = useMemo(() => buildSolids(projects), []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    const refresh = () => setBadges(loadBadges());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const setPreview = useCallback((v: number | null) => {
    pendingPreviewRef.current = v;
    setPendingPreview(v);
  }, []);

  const showDialog = useCallback(
    (speaker: string, lines: string[], onDone?: () => void) => {
      routeRef.current = [];
      movingRef.current = false;
      setTyped("");
      setDialog({ speaker, lines, index: 0, onDone });
    },
    [],
  );

  // Máquina de escribir estilo Pokémon (solo temporizador; el texto se
  // inicializa en showDialog/advanceDialog para no setear estado en el cuerpo).
  useEffect(() => {
    if (!dialog) return;
    const full = dialog.lines[dialog.index] ?? "";
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      const id = window.setTimeout(() => setTyped(full), 0);
      return () => window.clearTimeout(id);
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [dialog]);

  const advanceDialog = useCallback(() => {
    const d = dialogRef.current;
    if (!d) return;
    const full = d.lines[d.index] ?? "";
    const doneTyping = typed.length >= full.length;
    if (!doneTyping) {
      setTyped(full);
      return;
    }
    beep(740, mutedRef.current);
    if (d.index + 1 < d.lines.length) {
      setTyped("");
      setDialog({ ...d, index: d.index + 1 });
    } else {
      const cb = d.onDone;
      setTyped("");
      setDialog(null);
      cb?.();
    }
  }, [typed]);

  const previewDoor = useCallback(
    (i: number) => {
      const h = projects[i];
      const earned = loadBadges().includes(h.slug);
      showDialog(h.title, [
        `${h.short}`,
        `STACK: ${h.stack.join(" · ")}${earned ? " — ¡MEDALLA CONSEGUIDA!" : ""}`,
        "¿Entrar a ver el proyecto? ¡Pulsa E / ENTER para entrar!",
      ]);
      setPreview(i);
    },
    [setPreview, showDialog],
  );

  const enterDoor = useCallback(
    (i: number) => {
      setPreview(null);
      setTyped("");
      setDialog(null);
      beep(880, mutedRef.current);
      router.push(`/project/${projects[i].slug}`);
    },
    [router, setPreview],
  );

  const talkNpc = useCallback(
    (i: number) => {
      const n = NPCS[i];
      faceRef.current = "down";
      beep(520, mutedRef.current);
      showDialog(n.name, n.lines);
    },
    [showDialog],
  );

  const readSign = useCallback(
    (i: number) => {
      const s = SIGNS[i];
      beep(520, mutedRef.current);
      showDialog(s.title, s.lines);
    },
    [showDialog],
  );

  const interact = useCallback(() => {
    if (dialogRef.current) {
      advanceDialog();
      return;
    }
    if (phaseRef.current !== "play") return;
    const p = playerRef.current;
    // Si hay preview abierta de una puerta y sigues cerca, el 2º E entra.
    const preview = pendingPreviewRef.current;
    if (preview !== null) {
      const h = projects[preview];
      if (Math.abs(p.x - h.door) < 14 && Math.abs(p.y - h.dest) < 14) {
        enterDoor(preview);
        return;
      }
      pendingPreviewRef.current = null;
      setPendingPreview(null);
    }
    const d = nearDoor(p);
    if (d >= 0) {
      previewDoor(d);
      return;
    }
    const n = nearNpc(p);
    if (n >= 0) {
      talkNpc(n);
      return;
    }
    const s = nearSign(p);
    if (s >= 0) {
      readSign(s);
      return;
    }
  }, [advanceDialog, enterDoor, previewDoor, readSign, talkNpc]);

  const walkRoute = useCallback((pts: Pos[]) => {
    pendingPreviewRef.current = null;
    setPendingPreview(null);
    pendingDialogRef.current = null;
    setTyped("");
    setDialog(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      playerRef.current = { ...pts[pts.length - 1] };
      routeRef.current = [];
      movingRef.current = false;
    } else {
      routeRef.current = pts;
      movingRef.current = true;
    }
  }, []);

  const walkToDoor = useCallback(
    (i: number) => {
      const h = projects[i];
      setTrainerOpen(false);
      setHelpOpen(false);
      pendingDialogRef.current = null;
      walkRoute([
        { x: 159, y: playerRef.current.y },
        { x: 159, y: h.dest },
        { x: h.door, y: h.dest },
      ]);
      pendingPreviewRef.current = -1; // marca: mostrar preview al llegar
      setPendingPreview(-1);
      pendingDialogRef.current = { kind: "npc", id: -100 - i }; // hack: puerta i
    },
    [walkRoute],
  );

  const walkToNpcOrSign = useCallback(
    (kind: "npc" | "sign", id: number) => {
      const t = kind === "npc" ? NPCS[id] : SIGNS[id];
      walkRoute([
        { x: 159, y: playerRef.current.y },
        { x: 159, y: t.y + 12 },
        { x: t.x, y: t.y + 12 },
      ]);
      pendingDialogRef.current = { kind, id };
    },
    [walkRoute],
  );

  const startGame = useCallback(() => {
    beep(660, mutedRef.current);
    setPhase("intro");
    showDialog("PROF. ROBLE", INTRO_LINES, () => {
      setPhase("play");
      playerRef.current = { ...SOUTH_SPAWN };
      faceRef.current = "up";
      showDialog("¡PUEBLO MONTERREY!", TUTORIAL_LINES);
    });
  }, [showDialog]);

  // Dibujo principal
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bg = bgRef.current;
    if (!canvas || !bg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0);

    // Etiquetas de edificios (para que el recruiter sepa qué es cada casa)
    const labels: [number, string][] = [0, 1, 2].map((i) => {
      const h = projects[i];
      return [i, `${h.navLabel}`] as [number, string];
    });
    for (const [i, text] of labels) {
      const h = projects[i];
      drawLabel(ctx, text, h.x + h.w / 2, h.y - 15);
    }
    drawLabel(ctx, "¡HIERBA ALTA = SKILLS!", 71, 176);
    drawLabel(ctx, "¡HIERBA ALTA = SKILLS!", 220, 228);

    // NPCs con sus sprites propios (Oak tiene el suyo estilo original)
    const t = timeRef.current;
    NPCS.forEach((n, k) => {
      drawNpc(ctx, n.x, n.y, n.face, n.tint, stepRef.current + k, n.sprite);
      void t;
    });

    // Jugador: ALEXIS, el prota de gorra roja
    const p = playerRef.current;
    rect(ctx, p.x - 8, p.y - 2, 16, 3, "#73b89a");
    const bob = movingRef.current && stepRef.current % 2 ? 1 : 0;
    drawSprite(
      ctx,
      getSpriteRows(faceRef.current, "player"),
      p.x - 8,
      p.y - 18 - bob,
      getPalette(),
    );

    // "!" si hay algo con qué interactuar
    if (
      phaseRef.current === "play" &&
      !dialogRef.current &&
      routeRef.current.length === 0 &&
      (nearDoor(p) >= 0 || nearNpc(p) >= 0 || nearSign(p) >= 0)
    ) {
      drawExclaim(ctx, p.x, p.y - 16, timeRef.current);
    }
  }, []);

  // Loop principal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    paintTerrain(ctx, projects);
    const bg = document.createElement("canvas");
    bg.width = 320;
    bg.height = 276;
    bg.getContext("2d")?.drawImage(canvas, 0, 0);
    bgRef.current = bg;
    draw();

    const tick = (time: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (time - lastRef.current < 40) return;
      lastRef.current = time;
      timeRef.current = time;
      if (cooldownRef.current > 0) cooldownRef.current--;

      const blocked = phaseRef.current !== "play" || dialogRef.current;
      // 1) ruta automática (click en edificio / NPC)
      const target = routeRef.current[0];
      if (target && !blocked) {
        movingRef.current = true;
        stepRef.current++;
        const p = playerRef.current;
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        if (dx !== 0) {
          faceRef.current = dx > 0 ? "right" : "left";
          p.x += Math.sign(dx) * Math.min(2, Math.abs(dx));
        } else if (dy !== 0) {
          faceRef.current = dy > 0 ? "down" : "up";
          p.y += Math.sign(dy) * Math.min(2, Math.abs(dy));
        }
        if (p.x === target.x && p.y === target.y)
          routeRef.current.shift();
        if (routeRef.current.length === 0) {
          movingRef.current = false;
          faceRef.current = "down";
          const pd = pendingDialogRef.current;
          pendingDialogRef.current = null;
          const pp = pendingPreviewRef.current;
          setPreview(null);
          draw();
          if (pd && pd.id <= -100) {
            previewDoor(-100 - pd.id);
          } else if (pd && pd.kind === "npc") {
            talkNpc(pd.id);
          } else if (pd && pd.kind === "sign") {
            readSign(pd.id);
          } else if (pp === -1) {
            // llegó por quick-travel: re-detecta puerta
            const d = nearDoor(playerRef.current);
            if (d >= 0) previewDoor(d);
          } else if (typeof pp === "number" && pp >= 0) {
            previewDoor(pp);
          }
          return;
        }
        draw();
        return;
      }
      if (blocked) {
        if (movingRef.current) {
          movingRef.current = false;
          draw();
        } else {
          draw();
        }
        return;
      }

      // 2) movimiento libre WASD / flechas / D-pad
      const keys = keysRef.current;
      const left = keys.has("arrowleft") || keys.has("a");
      const right = keys.has("arrowright") || keys.has("d");
      const up = keys.has("arrowup") || keys.has("w");
      const down = keys.has("arrowdown") || keys.has("s");
      if (!left && !right && !up && !down) {
        if (movingRef.current) {
          movingRef.current = false;
          draw();
        } else {
          draw();
        }
        return;
      }
      movingRef.current = true;
      stepRef.current++;
      const p = playerRef.current;
      const speed = 2;
      let dx = 0;
      let dy = 0;
      if (left) {
        faceRef.current = "left";
        dx = -speed;
      } else if (right) {
        faceRef.current = "right";
        dx = speed;
      } else if (up) {
        faceRef.current = "up";
        dy = -speed;
      } else if (down) {
        faceRef.current = "down";
        dy = speed;
      }
      const next = moveWithCollision(p.x, p.y, dx, dy, solids);
      p.x = Math.max(10, Math.min(310, next.x));
      p.y = Math.max(30, Math.min(266, next.y));

      // 3) encuentro salvaje en hierba alta
      if (inGrass(p.x, p.y) && cooldownRef.current === 0) {
        grassStepsRef.current++;
        if (grassStepsRef.current > 24 && Math.random() < 0.06) {
          grassStepsRef.current = 0;
          cooldownRef.current = 250;
          const wild =
            WILD_SKILLS[Math.floor(Math.random() * WILD_SKILLS.length)];
          movingRef.current = false;
          beep(980, mutedRef.current);
          showDialog("¡SKILL SALVAJE!", [
            `¡Un ${wild.name} salvaje apareció!`,
            `ALEXIS ${wild.text}`,
            "Sigue caminando: hay 8 skills escondidos en la hierba.",
          ]);
          draw();
          return;
        }
      } else if (!inGrass(p.x, p.y)) {
        grassStepsRef.current = 0;
      }
      draw();
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, previewDoor, readSign, setPreview, showDialog, solids, talkNpc]);

  // Teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
      if (k === "m") {
        setMuted((v) => !v);
        return;
      }
      if (phaseRef.current === "title") {
        if (k === "enter" || k === "e" || k === " ") startGame();
        if (k === "t") setTrainerOpen(true);
        return;
      }
      if (k === "t") {
        setTrainerOpen((v) => !v);
        return;
      }
      if (k === "h" || k === "?") {
        setHelpOpen((v) => !v);
        return;
      }
      if (k === "escape") {
        if (dialogRef.current) {
          setTyped("");
          setDialog(null);
          setPreview(null);
          pendingDialogRef.current = null;
        }
        setTrainerOpen(false);
        setHelpOpen(false);
        routeRef.current = [];
        return;
      }
      if (k === "enter" || k === "e" || k === " ") {
        // Si hay preview de puerta y el diálogo ya terminó, entrar.
        const d = dialogRef.current;
        if (!d && pendingPreviewRef.current !== null && pendingPreviewRef.current >= 0) {
          enterDoor(pendingPreviewRef.current);
          return;
        }
        interact();
        return;
      }
      keysRef.current.add(k);
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enterDoor, interact, setPreview, startGame]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current === "title") {
      startGame();
      return;
    }
    if (dialogRef.current) {
      advanceDialog();
      return;
    }
    if (phaseRef.current !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const b = canvas.getBoundingClientRect();
    const x = ((e.clientX - b.left) * 320) / b.width;
    const y = ((e.clientY - b.top) * 276) / b.height;

    const ni = NPCS.findIndex(
      (n) => Math.abs(x - n.x) < 14 && Math.abs(y - n.y) < 20,
    );
    if (ni >= 0) {
      const p = playerRef.current;
      if (Math.abs(p.x - NPCS[ni].x) < 20 && Math.abs(p.y - NPCS[ni].y) < 20) {
        talkNpc(ni);
      } else {
        walkToNpcOrSign("npc", ni);
      }
      return;
    }
    const si = SIGNS.findIndex(
      (s) => Math.abs(x - s.x) < 12 && Math.abs(y - s.y) < 14,
    );
    if (si >= 0) {
      const p = playerRef.current;
      if (Math.abs(p.x - SIGNS[si].x) < 20 && Math.abs(p.y - SIGNS[si].y) < 20) {
        readSign(si);
      } else {
        walkToNpcOrSign("sign", si);
      }
      return;
    }
    const i = projects.findIndex(
      (h) => x >= h.x - 3 && x <= h.x + h.w + 3 && y >= h.y && y <= h.y + h.h,
    );
    if (i >= 0) walkToDoor(i);
  };

  const pressKey = (k: string) => {
    keysRef.current.add(k);
    window.setTimeout(() => keysRef.current.delete(k), 120);
  };

  const fullLines = dialog?.lines ?? [];
  const currentLine = dialog ? (fullLines[dialog.index] ?? "") : "";
  const isTyping = typed.length < currentLine.length;
  const dialogLook: SpeakerLook | undefined = dialog
    ? SPEAKER_LOOK[dialog.speaker]
    : phase === "play"
      ? PLAYER_LOOK
      : OAK_LOOK;

  return (
    <section id="forest-folio" aria-label="PokeFolio: pueblo Monterrey jugable">
      <header>
        <span>◉ PUEBLO MONTERREY</span>
        <span aria-live="polite">
          MEDALLAS {badges.length}/3{" "}
          {projects.map((p) => (badges.includes(p.slug) ? "◆" : "◇")).join("")}
        </span>
        <span className="hud-buttons">
          <button type="button" onClick={() => setTrainerOpen(true)}>
            ENTRENADOR [T]
          </button>
          <button type="button" onClick={() => setHelpOpen(true)}>
            AYUDA [H]
          </button>
          <button type="button" onClick={() => setMuted((v) => !v)}>
            {muted ? "SILENCIO [M]" : "SONIDO [M]"}
          </button>
        </span>
      </header>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={320}
          height={276}
          role="img"
          tabIndex={0}
          onClick={onCanvasClick}
          aria-label="Mapa jugable del pueblo. Camina con WASD o flechas, pulsa E para hablar y entrar."
        />
        {phase === "play" && (
          <div className="dpad" aria-label="Controles táctiles">
            <div className="dpad-move">
              <button type="button" aria-label="Arriba" onClick={() => pressKey("w")}>
                ▲
              </button>
              <div>
                <button type="button" aria-label="Izquierda" onClick={() => pressKey("a")}>
                  ◀
                </button>
                <button type="button" aria-label="Abajo" onClick={() => pressKey("s")}>
                  ▼
                </button>
                <button type="button" aria-label="Derecha" onClick={() => pressKey("d")}>
                  ▶
                </button>
              </div>
            </div>
            <button
              type="button"
              className="dpad-a"
              onClick={() => {
                if (!dialog && pendingPreviewRef.current !== null && pendingPreviewRef.current >= 0) {
                  enterDoor(pendingPreviewRef.current);
                } else {
                  interact();
                }
              }}
            >
              A
            </button>
          </div>
        )}
      </div>

      <nav aria-label="Viaje rápido">
        {projects.map((p) => (
          <button
            key={p.slug}
            type="button"
            aria-pressed="false"
            onClick={() => phase === "play" && walkToDoor(p.index)}
            title={p.short}
          >
            {badges.includes(p.slug) ? "◆" : "▶"} {p.navLabel}
          </button>
        ))}
      </nav>

      <div className="dialog" aria-live="polite">
        {dialog ? (
          <>
            <span className="speaker-tab">{dialog.speaker}</span>
            <span className="page-count">
              {dialog.index + 1}/{dialog.lines.length}
            </span>
            <div className="dialog-body">
              {dialogLook && <Portrait look={dialogLook} />}
              <div className="dialog-main">
                <p className="dialog-text">
                  {typed}
                  {!isTyping && <span className="poke-arrow">▼</span>}
                </p>
                <button type="button" className="enter" onClick={advanceDialog}>
                  {isTyping ? "SALTAR ▼" : dialog.index + 1 < dialog.lines.length ? "SIGUIENTE ▼ [E]" : pendingPreview !== null && pendingPreview >= 0 ? "¡ENTRAR! [E]" : "CERRAR ▼ [E]"}
                </button>
              </div>
            </div>
          </>
        ) : phase === "play" ? (
          <>
            <span className="speaker-tab">GUÍA DEL PUEBLO</span>
            <div className="dialog-body">
              {dialogLook && <Portrait look={dialogLook} />}
              <div className="dialog-main">
                <p className="dialog-text">
                  Camina con WASD / flechas. Habla con “!” usando E. Toca una
                  casa para ir hasta su puerta. Hierba alta = skills. T =
                  tarjeta.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="speaker-tab">PROF. ROBLE</span>
            <div className="dialog-body">
              {dialogLook && <Portrait look={dialogLook} />}
              <div className="dialog-main">
                <p className="dialog-text">
                  Pulsa ENTER para empezar… te espera en la pantalla del pueblo.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <p className="hint">
        ENTER / E / ESPACIO = hablar · avanzar · entrar · T = entrenador · H =
        ayuda · M = sonido · ESC = cerrar
      </p>

      {phase === "title" && (
        <div className="title-overlay" role="dialog" aria-modal="true" aria-label="Pantalla de título">
          <div className="title-card">
            <p className="kicker">UN PORTAFOLIO JUGABLE</p>
            <h2>
              POKÉFOLIO
              <br />
              PUEBLO MONTERREY
            </h2>
            <div className="title-sprites" aria-hidden="true">
              <Portrait look={OAK_LOOK} big />
              <span className="title-vs">¡TE PRESENTA A…!</span>
              <Portrait look={PLAYER_LOOK} big />
            </div>
            <p>
              Soy <strong>ALEXIS</strong>, full-stack en Monterrey. Este pueblo
              son mis proyectos: <strong>INVERATER</strong> (backend),{" "}
              <strong>MONETTA</strong> (commerce) y{" "}
              <strong>ARTISANALBREW</strong> (café .NET).
            </p>
            <ul>
              <li>▶ Habla con 3 vecinos</li>
              <li>▶ Lee las 2 señales</li>
              <li>▶ Entra a las 3 casas y gana 3 MEDALLAS</li>
            </ul>
            <button type="button" onClick={startGame}>
              ▶ PULSA ENTER O TOCA AQUÍ PARA EMPEZAR
            </button>
            <button type="button" className="ghost" onClick={() => setTrainerOpen(true)}>
              Ver tarjeta de entrenador primero [T]
            </button>
          </div>
        </div>
      )}

      {helpOpen && (
        <div className="trainer-overlay" role="dialog" aria-modal="true" aria-label="Ayuda" onClick={() => setHelpOpen(false)}>
          <div className="trainer-card" onClick={(e) => e.stopPropagation()}>
            <h3>GUÍA DEL RECLUTADOR</h3>
            <p className="role">Controles como en Game Boy</p>
            <ul>
              <li>▶ WASD / flechas o D-pad: caminar</li>
              <li>▶ E / ENTER / ESPACIO / botón A: hablar, avanzar, entrar</li>
              <li>▶ Click en casa, vecino o señal: caminar hasta ahí</li>
              <li>▶ T: tarjeta de entrenador (CV rápido)</li>
              <li>▶ H: esta ayuda · M: sonido · ESC: cerrar</li>
              <li>▶ Hierba alta: encuentros de skills salvajes</li>
            </ul>
            <button type="button" onClick={() => setHelpOpen(false)}>
              ¡ENTENDIDO! [ESC]
            </button>
          </div>
        </div>
      )}

      {trainerOpen && (
        <div
          className="trainer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Trainer card"
          onClick={() => setTrainerOpen(false)}
        >
          <div className="trainer-card" onClick={(e) => e.stopPropagation()}>
            <h3>TRAINER: {TRAINER.name}</h3>
            <p className="role">{TRAINER.role}</p>
            <p>{TRAINER.bio}</p>
            <ul>
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/project/${p.slug}`}>
                    {badges.includes(p.slug) ? "◆" : "▶"} {p.title}
                  </Link>
                  <span> — {p.stack.join(" · ")}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setTrainerOpen(false)}>
              CLOSE [T]
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
