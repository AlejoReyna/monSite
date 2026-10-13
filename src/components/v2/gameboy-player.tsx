"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { GAME_KEYS, GOLD_SAVE_KEY, parseGoldBackup } from "@/lib/gameboy/save";
import { GAME_LIBRARY, type LibraryGame } from "@/lib/gameboy/library";
import { CASE_STORAGE_KEY, GAMEBOY_CASES, MOBILE_GAMEBOY_QUERY, createGameFullscreen, parseGameBoyCase, type GameBoyCase, type GameFullscreenMode } from "@/lib/gameboy/presentation";
import styles from "./gameboy-player.module.css";

const COPY = {
  es: {
    loading: "Preparando Pokémon Gold…", error: "No pudimos iniciar el juego.", retry: "Reintentar", back: "Volver al escritorio",
    pause: "Pausar", resume: "Continuar", paused: "En pausa", sound: "Activar sonido", mute: "Silenciar", exit: "Salir",
    export: "Exportar partida", import: "Importar partida", checkpoint: "Exportar estado instantáneo",
    help: "Flechas · X: A · Z: B · Enter: Start · Shift: Select · Esc: pausa · Alt + Q: salir",
    saveHelp: "Guarda desde el menú de Pokémon. La partida del cartucho y su reloj se conservan en este navegador. Un estado instantáneo congela también el reloj; no sustituye la partida del cartucho.",
    saved: "Partida del cartucho conservada.", invalid: "Ese respaldo no corresponde a Pokémon Gold o está dañado.",
    storage: "No se pudo conservar la partida. Exporta un respaldo antes de salir.", stopping: "Conservando la partida…",
    up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha", backup: "Partida y respaldos", focus: "Controles del juego",
    fullscreen: "Pantalla completa", windowed: "Salir de pantalla completa", caseLabel: "Carcasa",
    cases: { classic: "Clásica", transparent: "Transparente", green: "Verde", red: "Roja" },
    library: "Juegos", choose: "Elige un juego", play: "Jugar", console: "Consola portátil",
    partial: "Respaldo exportado sin reloj. Conserva la partida guardada.",
  },
  en: {
    loading: "Preparing Pokémon Gold…", error: "The game could not start.", retry: "Try again", back: "Back to desktop",
    pause: "Pause", resume: "Resume", paused: "Paused", sound: "Enable sound", mute: "Mute", exit: "Exit",
    export: "Export cartridge save", import: "Import cartridge save", checkpoint: "Export save state",
    help: "Arrows · X: A · Z: B · Enter: Start · Shift: Select · Esc: pause · Alt + Q: exit",
    saveHelp: "Save from the Pokémon menu. The cartridge save and its clock stay in this browser. A save state also freezes the clock; it does not replace the cartridge save.",
    saved: "Cartridge save preserved.", invalid: "This backup is damaged or belongs to a different Pokémon Gold ROM.",
    storage: "Your save could not be preserved. Export a backup before exiting.", stopping: "Preserving your save…",
    up: "Up", down: "Down", left: "Left", right: "Right", backup: "Save and backups", focus: "Game controls",
    fullscreen: "Fullscreen", windowed: "Exit fullscreen", caseLabel: "Casing",
    cases: { classic: "Classic", transparent: "Transparent", green: "Green", red: "Red" },
    library: "Games", choose: "Choose a game", play: "Play", console: "Handheld console",
    partial: "Backup exported without the clock. Your cartridge save is included.",
  },
};

type HostMessage = { type: string; [key: string]: unknown };

function download(text: string | Uint8Array<ArrayBuffer>, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function GameBoyPlayer({ onExit }: { onExit: () => void }) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"library" | "loading" | "ready" | "error" | "stopping">("library");
  const [selectedGame, setSelectedGame] = useState<LibraryGame | null>(null);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [casing, setCasing] = useState<GameBoyCase>(() => {
    try { return parseGameBoyCase(typeof window === "undefined" ? null : window.localStorage.getItem(CASE_STORAGE_KEY)); }
    catch { return "classic"; }
  });
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<GameFullscreenMode>("none");
  const [fullscreenView, setFullscreenView] = useState<"mobile" | "desktop">("desktop");
  const fullscreen = useRef<ReturnType<typeof createGameFullscreen> | null>(null);
  const casePicker = useRef<HTMLDivElement>(null);
  const saveMenu = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<"saved" | "invalid" | "storage" | "partial" | null>(null);
  const state = useRef({ status, paused });
  const held = useRef(new Map<string, string>());
  const stopTimeout = useRef<number | undefined>(undefined);
  const exitRef = useRef(onExit);
  const send = useCallback((message: HostMessage) => {
    frame.current?.contentWindow?.postMessage({ channel: "gold-host", ...message }, window.location.origin);
  }, []);
  useEffect(() => { state.current = { status, paused }; exitRef.current = onExit; }, [status, paused, onExit]);

  const release = useCallback(() => { held.current.clear(); send({ type: "release" }); }, [send]);
  useEffect(() => {
    const controller = createGameFullscreen(document, mode => {
      setFullscreenMode(mode);
      // The fullscreen root joins the top layer last. Raise the existing modal
      // above it without remounting its iframe or disturbing the game session.
      if (mode === "native" && dialog.current?.open) {
        dialog.current.close(); dialog.current.showModal();
        dialog.current.focus({ preventScroll: true });
      }
    });
    fullscreen.current = controller;
    return () => { controller.dispose(); fullscreen.current = null; };
  }, []);
  useEffect(() => {
    if (!casePickerOpen && !saveMenuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!casePicker.current?.contains(event.target)) setCasePickerOpen(false);
      if (!saveMenu.current?.contains(event.target)) setSaveMenuOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [casePickerOpen, saveMenuOpen]);
  const startGame = useCallback((game: LibraryGame) => {
    if (state.current.status !== "library") return;
    state.current.status = "loading";
    setSelectedGame(game); setStatus("loading");
  }, []);
  function chooseCase(value: GameBoyCase) {
    setCasing(value); setCasePickerOpen(false);
    try { localStorage.setItem(CASE_STORAGE_KEY, value); } catch { /* Styling remains usable without storage. */ }
    dialog.current?.focus({ preventScroll: true });
  }
  function toggleFullscreen() {
    release(); setCasePickerOpen(false); setSaveMenuOpen(false);
    if (fullscreenMode === "none") {
      setFullscreenView(window.matchMedia(MOBILE_GAMEBOY_QUERY).matches ? "mobile" : "desktop");
      void fullscreen.current?.enter();
    } else void fullscreen.current?.leave();
  }
  const exit = useCallback(() => {
    if (state.current.status === "stopping") return;
    void fullscreen.current?.leave();
    if (state.current.status === "library" || state.current.status === "error") { exitRef.current(); return; }
    state.current.status = "stopping";
    setStatus("stopping"); release(); send({ type: "stop" });
    // An unresponsive engine must still allow returning to the desktop.
    stopTimeout.current = window.setTimeout(() => exitRef.current(), 2500);
  }, [send, release]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal(); element.focus({ preventScroll: true });
    element.querySelector<HTMLButtonElement>("[data-launch-game]")?.focus({ preventScroll: true });
    const wheel = (event: WheelEvent) => event.stopPropagation();
    element.addEventListener("wheel", wheel);
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      // Native capture prevents terminal/carousel document and window handlers.
      if (event.key === "Tab" || event.metaKey || event.ctrlKey) { event.stopPropagation(); return; }
      const interactive = event.target instanceof HTMLElement && event.target.closest("button,summary,input");
      if (interactive && (event.key === "Enter" || event.key === " ")) return;
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        if (state.current.status === "library") { exit(); return; }
        if (!event.repeat && state.current.status === "ready") { release(); send({ type: "pause", value: !state.current.paused }); }
        return;
      }
      if (event.altKey && event.code === "KeyQ") { event.preventDefault(); exit(); return; }
      const key = GAME_KEYS[event.code];
      // Let Enter/Space activate focused UI buttons instead of pressing Start/A.
      if (!key || event.altKey) return;
      event.preventDefault();
      if (!event.repeat && state.current.status === "library" && (key === "x" || key === "Enter")) { startGame(GAME_LIBRARY[0]); return; }
      if (!event.repeat && state.current.status === "ready" && !state.current.paused) {
        held.current.set(event.code, key); send({ type: "key", key, down: true });
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.metaKey || event.ctrlKey) { event.stopPropagation(); return; }
      if (!held.current.has(event.code) && (event.key === "Enter" || event.key === " ") && event.target instanceof HTMLElement && event.target.closest("button,summary,input")) return;
      event.stopImmediatePropagation();
      const key = held.current.get(event.code);
      if (!key) return;
      held.current.delete(event.code);
      if (![...held.current.values()].includes(key)) send({ type: "key", key, down: false });
    };
    const blur = () => { release(); send({ type: "save" }); send({ type: "pause", value: true }); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", keydown, true);
    window.addEventListener("keyup", keyup, true);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearTimeout(stopTimeout.current);
      // Removing the iframe destroys its audio, WASM, workers and event realm.
      // Do not send stop from effect cleanup: StrictMode also runs it while mounting.
      release();
      window.removeEventListener("keydown", keydown, true);
      window.removeEventListener("keyup", keyup, true);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("wheel", wheel);
      element.close(); document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [send, release, exit, startGame]);

  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => { if (state.current.status === "loading") setStatus("error"); }, 45000);
    return () => window.clearTimeout(timeout);
  }, [status, attempt]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.channel !== "gold-player") return;
      const data = event.data;
      if (data.type === "ready") { setStatus("ready"); dialog.current?.focus({ preventScroll: true }); }
      if (data.type === "paused") { state.current.paused = data.value === true; setPaused(data.value === true); }
      if (data.type === "sound") setSound(data.value === true);
      if (data.type === "saved") setNotice("saved");
      if (data.type === "storage-error") setNotice("storage");
      if (data.type === "error") setStatus("error");
      if (data.type === "stopped") { window.clearTimeout(stopTimeout.current); exitRef.current(); }
      if (data.type === "exit") exit();
      if (data.type === "focus-host") dialog.current?.querySelector("button")?.focus();
      if (data.type === "backup" && typeof data.backup === "string") {
        try {
          const backup = parseGoldBackup(data.backup);
          download(data.backup, "pokemon-gold-cartridge.json", "application/json");
          setNotice(backup.rtc ? "saved" : "partial");
        }
        catch { setNotice("storage"); }
      }
      if (data.type === "snapshot" && typeof data.encoded === "string") {
        download(Uint8Array.from(atob(data.encoded), char => char.charCodeAt(0)), "pokemon-gold.state", "application/octet-stream");
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [attempt, exit]);

  function retry() {
    release(); setStatus("loading"); state.current.status = "loading"; setPaused(false); setSound(false); setNotice(null); setAttempt(value => value + 1);
  }
  const controls = [["ArrowUp", "↑", copy.up], ["ArrowLeft", "←", copy.left], ["ArrowDown", "↓", copy.down], ["ArrowRight", "→", copy.right], ["z", "B", "B"], ["x", "A", "A"], ["Shift", "Select", "Select"], ["Enter", "Start", "Start"]];
  const renderControl = ([key, label, name]: string[]) => <button key={key} type="button" data-key={key} aria-label={name} disabled={(status !== "ready" && !(status === "library" && (key === "x" || key === "Enter"))) || paused}
    onPointerDown={event => { event.preventDefault(); if (status === "library") { startGame(GAME_LIBRARY[0]); return; } event.currentTarget.setPointerCapture(event.pointerId); send({ type: "key", key, down: true }); }}
    onPointerUp={event => { send({ type: "key", key, down: false }); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => send({ type: "key", key, down: false })} onLostPointerCapture={() => send({ type: "key", key, down: false })}
    onKeyDown={event => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); if (status === "library") startGame(GAME_LIBRARY[0]); else send({ type: "key", key, down: true }); } }}
    onKeyUp={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); send({ type: "key", key, down: false }); } }}
    onBlur={() => send({ type: "key", key, down: false })}>
    {key.startsWith("Arrow") ? <svg className={styles.direction} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M6 2h4v2h2v2h2v2h-4v6H6V8H2V6h2V4h2Z" fill="currentColor" /></svg> : label}
  </button>;

  return <dialog ref={dialog} className={styles.dialog} data-case={casing} data-fullscreen={fullscreenMode !== "none"} data-fullscreen-view={fullscreenView} tabIndex={-1} aria-label={copy.console} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); if (status === "library") exit(); else send({ type: "pause", value: !paused }); }} onTouchStart={event => event.stopPropagation()} onTouchEnd={event => event.stopPropagation()}>
    <div className={styles.content}>
      <header className={styles.toolbar}>
        <span className={styles.title}>{selectedGame?.title ?? copy.library}</span>
        <div>
          <button className={styles.pauseButton} type="button" disabled={status !== "ready"} aria-label={paused ? copy.resume : copy.pause} title={paused ? copy.resume : copy.pause} onClick={() => { release(); send({ type: "pause", value: !paused }); }}><span className={styles.pauseLabel}>{paused ? copy.resume : copy.pause}</span><svg className={styles.pauseIcon} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d={paused ? "M4 2v12h2v-2h3v-2h3V6H9V4H6V2Z" : "M3 2h4v12H3Zm6 0h4v12H9Z"} fill="currentColor" /></svg></button>
          <button className={styles.soundButton} type="button" disabled={status !== "ready"} aria-label={sound ? copy.mute : copy.sound} title={sound ? copy.mute : copy.sound} aria-pressed={sound} onClick={() => send({ type: "sound", value: !sound })}><span className={styles.soundLabel}>{sound ? copy.mute : copy.sound}</span><svg className={styles.soundIcon} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M1 6h3V4h2V2h2v12H6v-2H4v-2H1Z" fill="currentColor" /><path d={sound ? "M10 4h2v2h2v4h-2v2h-2v-2h2V6h-2Z" : "M10 6h2v2h-2Zm2 2h2v2h-2Z"} fill="currentColor" /></svg></button>
          <div ref={casePicker} className={styles.casePicker}>
            <button className={styles.iconButton} type="button" title={copy.caseLabel} aria-label={copy.caseLabel} aria-expanded={casePickerOpen} aria-controls="gameboy-case-picker" onClick={() => { release(); setSaveMenuOpen(false); setCasePickerOpen(value => !value); }}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M1 1h6v6H1Zm8 0h6v6H9ZM1 9h6v6H1Zm8 0h6v6H9Z" fill="currentColor" /></svg></button>
            {casePickerOpen && <div id="gameboy-case-picker" className={styles.caseMenu} role="group" aria-label={copy.caseLabel}>
              {GAMEBOY_CASES.map(value => <button type="button" key={value} aria-pressed={casing === value} onClick={() => chooseCase(value)}><span className={styles.swatch} data-case={value} aria-hidden="true" />{copy.cases[value]}</button>)}
            </div>}
          </div>
          {selectedGame && <div ref={saveMenu} className={styles.savePicker}>
            <button className={styles.iconButton} type="button" title={copy.backup} aria-label={copy.backup} aria-expanded={saveMenuOpen} aria-controls="game-save-menu" data-warning={notice === "storage" || notice === "invalid" || notice === "partial"} onClick={() => { release(); send({ type: "pause", value: true }); setCasePickerOpen(false); setSaveMenuOpen(value => !value); }}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M1 1h12v2h2v12H1Zm3 2v4h7V3Zm0 7v3h8v-3Z" fill="currentColor" /></svg></button>
            {saveMenuOpen && <section id="game-save-menu" className={styles.savePopup} aria-label={copy.backup}>
              <h2>{selectedGame.title}</h2>
              <p>{copy.saveHelp}</p>
              <button type="button" disabled={status !== "ready"} onClick={() => send({ type: "export" })}>{copy.export}</button>
              <button type="button" disabled={status !== "ready"} onClick={() => fileInput.current?.click()}>{copy.import}</button>
              <button type="button" disabled={status !== "ready"} onClick={() => send({ type: "snapshot" })}>{copy.checkpoint}</button>
              <p className={styles.saveHelp}>{copy.help}</p>
              {notice && <p className={styles.saveStatus} role="status">{copy[notice]}</p>}
            </section>}
          </div>}
          <button className={styles.iconButton} type="button" disabled={!selectedGame || (status !== "ready" && fullscreenMode === "none")} title={fullscreenMode === "none" ? copy.fullscreen : copy.windowed} aria-label={fullscreenMode === "none" ? copy.fullscreen : copy.windowed} aria-pressed={fullscreenMode !== "none"} onClick={toggleFullscreen}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d={fullscreenMode === "none" ? "M1 1h5v2H3v3H1Zm9 0h5v5h-2V3h-3ZM1 10h2v3h3v2H1Zm12 0h2v5h-5v-2h3Z" : "M4 1h2v5H1V4h3Zm6 0h2v3h3v2h-5ZM1 10h5v5H4v-3H1Zm9 0h5v2h-3v3h-2Z"} fill="currentColor" /></svg></button>
          <button className={styles.exitButton} type="button" aria-label={copy.exit} title={copy.exit} onClick={exit}><span className={styles.exitLabel}>{copy.exit} </span>↗</button>
        </div>
      </header>
      <div className={styles.console}>
        <div className={styles.shell}>
          <svg className={styles.circuitBoard} viewBox="0 0 320 480" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
            <rect x="4" y="4" width="312" height="472" fill="#254d3c" stroke="#80a98c" strokeWidth="4" />
            <g fill="none" stroke="#91be86" strokeWidth="2"><path d="M20 34h30v250h44v80h42v84M300 30h-36v264h-40v120h-38v40M16 310h36v110h24v42M306 322h-38v88h-32v52M40 14v20h136v-20M12 288h62v24h66v26h42M308 282h-56v40h-38v44" /><path d="M24 302h36v70h-36v58h62M298 304h-40v56h-54v82h52" /></g>
            <g fill="#162922" stroke="#6f8d72" strokeWidth="3"><rect x="88" y="320" width="66" height="70" /><rect x="176" y="402" width="48" height="32" /><rect x="30" y="58" width="24" height="52" /></g>
            <g fill="#cfbf82">{[0, 1, 2, 3, 4, 5].map(index => <g key={index}><rect x="80" y={326 + index * 10} width="8" height="4" /><rect x="154" y={326 + index * 10} width="8" height="4" /><rect x={168 + index * 10} y="446" width="6" height="18" /></g>)}</g>
            <g fill="#b6d2b6" stroke="#3b6751" strokeWidth="3"><rect x="14" y="14" width="8" height="8" /><rect x="298" y="14" width="8" height="8" /><rect x="14" y="456" width="8" height="8" /><rect x="298" y="456" width="8" height="8" /></g>
          </svg>
          <div className={styles.bezel}>
            <span className={styles.powerLight} data-on={status === "ready"} aria-hidden="true" />
            <div className={styles.screen} onPointerDown={() => dialog.current?.focus({ preventScroll: true })}>
              {status === "library" && <section className={styles.library} aria-labelledby="game-library-title">
                <h2 id="game-library-title">{copy.choose}</h2>
                {GAME_LIBRARY.map(game => <button className={styles.gameCard} data-launch-game={game.id} key={game.id} type="button" onClick={() => startGame(game)}>
                  <svg className={styles.cartridge} viewBox="0 0 40 48" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h32v4h4v40h-4v4H4v-4H0V4h4Z" fill="#c6ac68" /><path d="M8 4h24v22H8Z" fill="#504c37" /><path d="M12 30h16v12H12Z" fill="#e2cb8c" /><path d="M14 8h12v4H14Zm0 8h12v4H14Z" fill="#e2cb8c" /></svg>
                  <span><strong>{game.title}</strong><small>{copy.play}</small></span><span aria-hidden="true">▸</span>
                </button>)}
              </section>}
              {selectedGame && (status === "loading" || status === "ready" || status === "stopping") && <iframe key={attempt} ref={frame} src={selectedGame.playerUrl} title={selectedGame.title} allow="autoplay" tabIndex={-1} className={styles.frame} />}
              {status !== "ready" && status !== "library" && <div className={styles.overlay} role="status">
                <p>{status === "loading" ? copy.loading : status === "stopping" ? copy.stopping : copy.error}</p>
                {status === "error" && <><button type="button" onClick={retry}>{copy.retry}</button><button type="button" onClick={exit}>{copy.back}</button></>}
              </div>}
              {status === "ready" && paused && <div className={styles.overlay}><button type="button" onClick={() => send({ type: "pause", value: false })}>{copy.paused} · {copy.resume}</button></div>}
            </div>
          </div>
          <div className={styles.touchControls} aria-label={copy.focus}>
            <div className={styles.dpad}><span className={styles.dpadCenter} aria-hidden="true" />{controls.slice(0, 4).map(renderControl)}</div>
            <div className={styles.actionButtons}>{controls.slice(4, 6).map(renderControl)}</div>
            <div className={styles.systemButtons}>{controls.slice(6).map(renderControl)}</div>
          </div>
          <div className={styles.shellBottom} aria-hidden="true">
            <svg className={styles.speaker} viewBox="0 0 86 42" shapeRendering="crispEdges">
              {[0, 14, 28, 42, 56].map(x => <path key={x} transform={`translate(${x} 0)`} d="M0 0h6v6h6v6h6v6h6v6h6v6h-6v-6h-6v-6h-6v-6H6V6H0Z" />)}
            </svg>
          </div>
        </div>
      </div>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={async event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
        if (!file) return;
        try {
          if (file.size > 100_000) throw new Error("Too large");
          const backup = parseGoldBackup(await file.text());
          // Retry replaces the iframe atomically. External files restore SRAM and RTC before boot.
          localStorage.setItem(`${GOLD_SAVE_KEY}.restore`, JSON.stringify(backup)); retry();
        } catch { setNotice("invalid"); }
      }} />
    </div>
  </dialog>;
}
