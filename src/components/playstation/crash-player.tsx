"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { useLanguage } from "@/components/lang-context";
import { GAME_ACCEPT, HOSTED_CRASH, identifyGame, validateBios, validateGame, type Ps1Assets } from "@/lib/playstation/assets";
import { createGameFullscreen, type GameFullscreenMode } from "@/lib/gameboy/presentation";
import styles from "./crash-player.module.css";

type Phase = "setup" | "preparing" | "loading" | "ready" | "error" | "stopping";
type Run = { assets: Ps1Assets; session: string; card?: Uint8Array };
const KEYS: Record<string, string> = { ArrowUp: "ArrowUp", ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", KeyX: "x", KeyZ: "z", KeyC: "c", KeyV: "v", KeyW: "ArrowUp", KeyS: "ArrowDown", KeyA: "ArrowLeft", KeyD: "ArrowRight", KeyQ: "a", KeyE: "s", Digit1: "q", Digit3: "w", Enter: "Enter", ShiftLeft: "Shift", ShiftRight: "Shift" };
const COPY = {
  es: {
    secret: "Secreto desbloqueado", subtitle: "Un pequeño regreso a 1996.", close: "Cerrar", start: "Iniciar Crash", game: "Archivo del juego", bios: "BIOS de PlayStation", formats: "PBP o BIN de una sola pista · máximo 768 MB", biosHelp: "BIOS de 512 KB con su nombre original, por ejemplo scph5501.bin.", local: "Tus archivos se usan en este dispositivo; no se suben al sitio.", preparing: "Preparando el juego", loading: "Cargando PlayStation…", error: "No se pudo iniciar. Revisa los archivos e inténtalo de nuevo.", gameError: "Selecciona un juego PBP o BIN de entre 512 KB y 768 MB.", biosError: "Selecciona una BIOS de 512 KB con un nombre compatible (scph5501.bin, por ejemplo).", missing: "Selecciona el juego y la BIOS para continuar.", retry: "Volver a intentar", pause: "Pausar", resume: "Continuar", sound: "Activar sonido", mute: "Silenciar", fullscreen: "Pantalla completa", save: "Guardar tarjeta", export: "Exportar tarjeta", import: "Importar tarjeta (opcional)", saved: "Tarjeta guardada en este navegador.", saveError: "No se pudo guardar en el navegador. Exporta la tarjeta antes de salir.", cardError: "La tarjeta debe ser un archivo MCR o SRM de 128 KB con formato de PlayStation.", cardLoaded: "La tarjeta seleccionada reemplazará la de este juego al iniciar.", stopping: "Guardando antes de salir…", stopError: "No se pudo confirmar el guardado. Exporta la tarjeta o cierra sin guardar.", force: "Cerrar sin guardar", controls: "Flechas/WASD: mover · X: ✕ · Z: □ · C: ○ · V: △ · Enter: Start · Esc: pausa", paused: "Juego en pausa", select: "Select", up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha", unavailable: "La pantalla completa no está disponible en este navegador.", memory: "Guarda desde el propio juego; la tarjeta conserva esas partidas.",
  },
  en: {
    secret: "Secret unlocked", subtitle: "A little trip back to 1996.", close: "Close", start: "Start Crash", game: "Game file", bios: "PlayStation BIOS", formats: "PBP or single-track BIN · up to 768 MB", biosHelp: "512 KB BIOS with its original name, such as scph5501.bin.", local: "Your files stay on this device; they are not uploaded.", preparing: "Preparing game", loading: "Loading PlayStation…", error: "Could not start. Check your files and try again.", gameError: "Choose a PBP or BIN game between 512 KB and 768 MB.", biosError: "Choose a 512 KB BIOS with a supported name, such as scph5501.bin.", missing: "Select the game and BIOS to continue.", retry: "Try again", pause: "Pause", resume: "Resume", sound: "Enable sound", mute: "Mute", fullscreen: "Fullscreen", save: "Save card", export: "Export card", import: "Import card (optional)", saved: "Memory card saved in this browser.", saveError: "Browser save failed. Export your card before leaving.", cardError: "Use a 128 KB MCR or SRM card in PlayStation format.", cardLoaded: "The selected card will replace this game's card when you start.", stopping: "Saving before leaving…", stopError: "Could not confirm the save. Export your card or close without saving.", force: "Close without saving", controls: "Arrows/WASD: move · X: ✕ · Z: □ · C: ○ · V: △ · Enter: Start · Esc: pause", paused: "Game paused", select: "Select", up: "Up", down: "Down", left: "Left", right: "Right", unavailable: "Fullscreen is unavailable in this browser.", memory: "Save inside the game; the memory card preserves those saves.",
  },
};

export default function CrashPlayer({ onExit }: { onExit: () => void }) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const frame = useRef<HTMLIFrameElement>(null);
  const surface = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  const urls = useRef<string[]>([]);
  const phaseRef = useRef<Phase>("setup");
  const runRef = useRef<Run | null>(null);
  const exitRef = useRef(onExit);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullscreenController = useRef<ReturnType<typeof createGameFullscreen> | null>(null);
  const held = useRef(new Map<string, Set<string>>());
  const [phase, setPhaseState] = useState<Phase>("setup");
  const [run, setRun] = useState<Run | null>(null);
  const [game, setGame] = useState<File | null>(null);
  const [bios, setBios] = useState<File | null>(null);
  const [card, setCard] = useState<Uint8Array | undefined>();
  const [cardName, setCardName] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [loadActivity, setLoadActivity] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [notice, setNotice] = useState<keyof typeof COPY.es | null>(null);
  const [stopFailed, setStopFailed] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<GameFullscreenMode>("none");
  const setPhase = useCallback((value: Phase) => { phaseRef.current = value; setPhaseState(value); }, []);
  const send = useCallback((message: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ channel: "ps1-host", session: runRef.current?.session, ...message }, location.origin);
  }, []);
  const pressKey = useCallback((key: string, source: string) => {
    const sources = held.current.get(key) ?? new Set<string>();
    if (sources.has(source)) return;
    const wasDown = sources.size > 0;
    sources.add(source); held.current.set(key, sources);
    if (!wasDown) send({ type: "key", key, down: true });
  }, [send]);
  const liftKey = useCallback((key: string, source: string) => {
    const sources = held.current.get(key);
    if (!sources?.delete(source)) return;
    if (!sources.size) { held.current.delete(key); send({ type: "key", key, down: false }); }
  }, [send]);
  const release = useCallback(() => { held.current.clear(); send({ type: "release" }); }, [send]);
  const disposeUrls = useCallback(() => { urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current = []; }, []);
  const finish = useCallback(() => {
    controller.current?.abort();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // Navigate away before revoking files; React owns removal of the iframe.
    if (frame.current) frame.current.src = "about:blank";
    runRef.current = null; disposeUrls();
    exitRef.current();
  }, [disposeUrls]);
  const requestClose = useCallback(() => {
    if (phaseRef.current === "stopping") return;
    if (phaseRef.current !== "ready") { finish(); return; }
    setStopFailed(false); setPhase("stopping"); release(); send({ type: "stop" });
    closeTimer.current = setTimeout(() => {
      send({ type: "cancel-stop" });
      setStopFailed(true); setPhase("ready"); setNotice("stopError");
    }, 8000);
  }, [finish, release, send, setPhase]);

  useEffect(() => { exitRef.current = onExit; }, [onExit]);
  useEffect(() => {
    const controls = createGameFullscreen(document, mode => {
      setFullscreenMode(mode);
      // Dialog elements cannot request fullscreen. Raise the existing modal
      // above the fullscreen document without remounting the running iframe.
      const dialog = surface.current?.closest("dialog");
      if (mode === "native" && dialog?.open) { dialog.close(); dialog.showModal(); surface.current?.focus({ preventScroll: true }); }
    });
    fullscreenController.current = controls;
    return () => { controls.dispose(); fullscreenController.current = null; };
  }, []);
  useEffect(() => () => {
    controller.current?.abort();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    disposeUrls();
  }, [disposeUrls]);

  useEffect(() => {
    const onEscape = () => {
      if (phaseRef.current === "ready") send({ type: "pause", value: !surface.current?.hasAttribute("data-paused") });
      else if (phaseRef.current !== "stopping") requestClose();
    };
    const down = (event: KeyboardEvent) => {
      if ((event.target as Element | null)?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
      if ((event.target as Element | null)?.closest?.('button') && event.code === "Enter") return;
      const key = KEYS[event.code];
      if (key && phaseRef.current === "ready") {
        event.preventDefault(); event.stopPropagation();
        if (!event.repeat) pressKey(key, `keyboard:${event.code}`);
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = KEYS[event.code];
      if (key) liftKey(key, `keyboard:${event.code}`);
    };
    const hidden = () => {
      if (document.hidden) { release(); send({ type: "pause", value: true }); send({ type: "save" }); }
    };
    window.addEventListener("crash:escape", onEscape);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      release(); window.removeEventListener("crash:escape", onEscape);
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release); document.removeEventListener("visibilitychange", hidden);
    };
  }, [send, release, requestClose, pressKey, liftKey]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!runRef.current || event.source !== frame.current?.contentWindow || event.origin !== location.origin || event.data?.channel !== "ps1-player" || event.data.session !== runRef.current.session) return;
      const data = event.data;
      if (data.type === "frame-ready") send({ type: "configure", assets: runRef.current.assets, card: runRef.current.card });
      if (data.type === "loading-progress" && phaseRef.current === "loading" && (data.value === null || (typeof data.value === "number" && data.value >= 0 && data.value <= 100))) {
        setLoadActivity(value => value + 1);
        if (data.stage === "game") setDownloadProgress(data.value);
      }
      if (data.type === "ready" && phaseRef.current === "loading") {
        setPhase("ready"); setCard(undefined); setCardName(""); surface.current?.focus({ preventScroll: true });
      }
      if (data.type === "paused") setPaused(data.value === true);
      if (data.type === "sound") setSound(data.value === true);
      if (data.type === "focus-host") closeButton.current?.focus();
      if (data.type === "saved") setNotice("saved");
      if (data.type === "save-failed") setNotice("saveError");
      if (data.type === "error") {
        if (phaseRef.current === "stopping") {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          send({ type: "cancel-stop" }); setStopFailed(true); setPhase("ready"); setNotice("stopError");
        } else if (phaseRef.current === "ready") {
          release(); send({ type: "pause", value: true }); setNotice("error");
        } else { setPhase("error"); setNotice("error"); }
      }
      if (data.type === "stop-failed") {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setStopFailed(true); setPhase("ready"); setNotice("stopError");
      }
      if (data.type === "stopped" && (phaseRef.current === "stopping" || stopFailed)) finish();
      if (data.type === "card" && data.bytes instanceof Uint8Array && data.bytes.length === 128 * 1024 && data.bytes[0] === 0x4d && data.bytes[1] === 0x43) {
        const url = URL.createObjectURL(new Blob([new Uint8Array(data.bytes)], { type: "application/octet-stream" }));
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = `crash-${runRef.current.assets.id.slice(0, 12)}.mcr`;
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [send, release, setPhase, finish, stopFailed]);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => { setPhase("error"); setNotice("error"); }, 180000);
    return () => clearTimeout(timer);
  }, [phase, loadActivity, setPhase]);

  async function start() {
    if (!["setup", "error"].includes(phaseRef.current)) return;
    setNotice(null); setStopFailed(false); setPaused(false); setSound(false); setDownloadProgress(null);
    const abort = new AbortController(); controller.current = abort;
    try {
      let assets: Ps1Assets;
      if (HOSTED_CRASH && !game && !bios) assets = HOSTED_CRASH;
      else {
        if (!game || !bios) { setNotice("missing"); return; }
        const extension = validateGame(game); validateBios(bios);
        setPhase("preparing"); setProgress(0);
        const id = await identifyGame(game, abort.signal, setProgress);
        disposeUrls();
        const gameUrl = URL.createObjectURL(game), biosUrl = URL.createObjectURL(bios);
        urls.current = [gameUrl, biosUrl];
        assets = { id, extension, gameUrl, biosUrl, biosName: bios.name };
      }
      abort.signal.throwIfAborted();
      const next = { assets, session: crypto.randomUUID(), card };
      runRef.current = next; setRun(next); setPhase("loading");
    } catch (error) {
      if (abort.signal.aborted) return;
      setNotice(error instanceof Error && error.message === "game-file" ? "gameError" : error instanceof Error && error.message === "bios-file" ? "biosError" : "error");
      setPhase("error");
    }
  }

  async function importCard(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try {
      if (!/\.(mcr|srm)$/i.test(file.name) || file.size !== 128 * 1024) throw new Error();
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes[0] !== 0x4d || bytes[1] !== 0x43) throw new Error();
      setCard(bytes); setCardName(file.name); setNotice("cardLoaded");
    } catch { setNotice("cardError"); }
  }

  function fullscreen() {
    if (fullscreenMode === "none") void fullscreenController.current?.enter();
    else void fullscreenController.current?.leave();
  }
  const press = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    pressKey(key, `pointer:${event.pointerId}`);
  };
  const control = (key: string, label: string, name: string) => <button type="button" key={key} aria-label={name} data-key={key} disabled={phase !== "ready" || paused}
    onPointerDown={event => press(event, key)} onPointerUp={event => liftKey(key, `pointer:${event.pointerId}`)}
    onPointerCancel={event => liftKey(key, `pointer:${event.pointerId}`)} onLostPointerCapture={event => liftKey(key, `pointer:${event.pointerId}`)}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); pressKey(key, `button:${key}`); } }}
    onKeyUp={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); liftKey(key, `button:${key}`); } }}
    onBlur={() => liftKey(key, `button:${key}`)} onContextMenu={event => event.preventDefault()}>{label}</button>;
  const setup = phase === "setup" || phase === "error";

  return <section ref={surface} className={styles.player} tabIndex={-1} data-paused={paused || undefined} data-fullscreen={fullscreenMode !== "none" || undefined}>
    <header className={styles.header}>
      <div><p>{copy.secret}</p><h2 id="crash-title">Crash Bandicoot</h2><span>{copy.subtitle}</span></div>
      <button ref={closeButton} type="button" onClick={requestClose} disabled={phase === "stopping"} aria-label={copy.close}>×</button>
    </header>
    {setup ? <div className={styles.setup}>
      <p className={styles.kicker}>↑ ↑ ↓ ↓ ← → ← → B A</p>
      <label>{copy.game}<input type="file" accept={GAME_ACCEPT} onChange={event => { setGame(event.target.files?.[0] ?? null); setNotice(null); }} /><small>{copy.formats}</small></label>
      <label>{copy.bios}<input type="file" accept=".bin" onChange={event => { setBios(event.target.files?.[0] ?? null); setNotice(null); }} /><small>{copy.biosHelp}</small></label>
      <label>{copy.import}<input type="file" accept=".mcr,.srm" onChange={importCard} />{cardName && <small>{cardName}</small>}</label>
      <p className={styles.hint}>{copy.local}</p>
      <button type="button" className={styles.start} onClick={start}>{phase === "error" ? copy.retry : copy.start} <span aria-hidden="true">▶</span></button>
    </div> : <>
      <div className={styles.screen}>
        {run && <iframe key={run.session} ref={frame} src={`/playstation/frame.html?session=${run.session}`} title="Crash Bandicoot" allow="autoplay; fullscreen" onLoad={() => send({ type: "configure", assets: run.assets, card: run.card })} />}
        {phase !== "ready" && <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <p>{phase === "preparing" ? `${copy.preparing} · ${Math.round(progress * 100)}%` : phase === "stopping" ? copy.stopping : `${copy.loading}${downloadProgress === null ? "" : ` ${downloadProgress}%`}`}</p>
          {phase === "preparing" && <progress max={1} value={progress} />}
          {phase === "loading" && downloadProgress !== null && <progress max={100} value={downloadProgress} />}
        </div>}
        {phase === "ready" && paused && <div className={styles.paused}><span>{copy.paused}</span><button type="button" onClick={() => send({ type: "pause", value: false })}>{copy.resume}</button></div>}
      </div>
      <div className={styles.toolbar}>
        <button type="button" disabled={phase !== "ready"} onClick={() => { release(); send({ type: "pause", value: !paused }); }}>{paused ? copy.resume : copy.pause}</button>
        <button type="button" disabled={phase !== "ready"} onClick={() => send({ type: "sound", value: !sound })}>{sound ? copy.mute : copy.sound}</button>
        <button type="button" aria-pressed={fullscreenMode !== "none"} onClick={fullscreen}>{copy.fullscreen}</button>
        <button type="button" disabled={phase !== "ready"} onClick={() => send({ type: "save" })}>{copy.save}</button>
        <button type="button" disabled={phase !== "ready"} onClick={() => send({ type: "export" })}>{copy.export}</button>
      </div>
      <div className={styles.touchControls} aria-label={language === "es" ? "Controles de PlayStation" : "PlayStation controls"}>
        <div className={styles.dpad}>{control("ArrowUp", "↑", copy.up)}{control("ArrowLeft", "←", copy.left)}{control("ArrowDown", "↓", copy.down)}{control("ArrowRight", "→", copy.right)}</div>
        <div className={styles.middle}>{control("Shift", "Select", copy.select)}{control("Enter", "Start", "Start")}</div>
        <div className={styles.buttons}>{control("v", "△", "Triangle")}{control("z", "□", "Square")}{control("x", "✕", "Cross")}{control("c", "○", "Circle")}</div>
      </div>
      <p className={styles.hint}>{copy.controls}</p>
      <p className={styles.hint}>{copy.memory}</p>
    </>}
    {notice && <p className={styles.notice} role={notice === "saved" || notice === "cardLoaded" ? "status" : "alert"}>{copy[notice]}</p>}
    {stopFailed && <button type="button" className={styles.force} onClick={finish}>{copy.force}</button>}
  </section>;
}
