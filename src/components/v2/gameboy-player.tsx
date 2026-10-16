"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { GAME_KEYS, GBA_KEYS, GOLD_ROM_SHA256, parseGoldBackup, type GoldBackup } from "@/lib/gameboy/save";
import { parseGameBackup, parseStateBackup, encodedSize, MAX_SRAM_BYTES, GAME_BACKUP_LIMIT, STATE_BACKUP_LIMIT, type GameBackup, type StateBackup } from "../../../public/gameboy/backups.js";
import { GAME_LIBRARY, type LibraryGame } from "@/lib/gameboy/library";
import { ROM_ACCEPT, RomFileError, identifyLocalRom } from "@/lib/gameboy/local-rom";
import { CASE_STORAGE_KEY, GAMEBOY_CASES, createGameFullscreen, parseGameBoyCase, type GameBoyCase, type GameFullscreenMode } from "@/lib/gameboy/presentation";
import styles from "./gameboy-player.module.css";

const COPY = {
  es: {
    loading: "Preparando el juego…", error: "No pudimos iniciar el juego.", retry: "Reintentar", back: "Volver al escritorio",
    pause: "Pausar", resume: "Continuar", paused: "En pausa", sound: "Activar sonido", mute: "Silenciar", exit: "Salir",
    export: "Exportar respaldo", import: "Importar respaldo", checkpoint: "Exportar estado instantáneo",
    rawExport: "Exportar archivo .sav", restore: "Restaurar y reiniciar", cancel: "Cancelar",
    replace: "Se reemplazará la partida de este juego. Exporta un respaldo antes de restaurar.",
    rawWarning: "Un archivo .sav no identifica el juego ni incluye necesariamente su reloj. Comprueba que corresponda a esta ROM.",
    stateWarning: "Restaurar un estado instantáneo también devuelve el reloj y la partida al momento exportado.",
    leaveWithoutSave: "Continuar sin conservar la partida", libraryBack: "Volver a juegos",
    help: "Flechas/WASD · X: A · Z: B · Enter: Start · Shift: Select · Esc: pausa · Alt + Q: salir",
    saveHelp: "Guarda desde el menú de Pokémon. La partida del cartucho y su reloj se conservan en este navegador. Un estado instantáneo congela también el reloj; no sustituye la partida del cartucho.",
    saved: "Partida del cartucho conservada.", invalid: "Ese respaldo no corresponde a este juego, es incompatible o está dañado.",
    storage: "No se pudo conservar la partida. Exporta un respaldo antes de salir.", stopping: "Conservando la partida…",
    up: "Arriba", down: "Abajo", left: "Izquierda", right: "Derecha", backup: "Partida y respaldos", focus: "Controles del juego",
    fullscreen: "Pantalla completa", windowed: "Salir de pantalla completa", caseLabel: "Carcasa",
    cases: { classic: "Clásica", transparent: "Transparente", green: "Verde", red: "Roja" },
    library: "Juegos", choose: "Elige un juego", play: "Jugar", console: "Consola portátil",
    partial: "Respaldo parcial: contiene la partida disponible, pero no se pudo verificar su reloj.",
    openRom: "Abrir ROM", romFormats: "Game Boy / Color / Advance · .gb, .gbc, .gba", readingRom: "Leyendo ROM…",
    romErrors: { format: "Selecciona una ROM .gb, .gbc, .dmg o .gba.", size: "El mínimo es 16 KB; el máximo es 8 MB para GB/Color y 32 MB para GBA.", read: "No pudimos leer esa ROM. Vuelve a seleccionarla." },
    localSaveHelp: "Guarda desde el menú del juego. La partida permanece en este navegador por ROM. El respaldo incluye los archivos de partida y reloj disponibles. Para volver a jugar una ROM local, selecciona el archivo otra vez.",
    gbaHelp: "Flechas/WASD · X: A · Z: B · Q: L · E: R · Enter: Start · Shift: Select · Esc: pausa · Alt + Q: salir",
  },
  en: {
    loading: "Preparing the game…", error: "The game could not start.", retry: "Try again", back: "Back to desktop",
    pause: "Pause", resume: "Resume", paused: "Paused", sound: "Enable sound", mute: "Mute", exit: "Exit",
    export: "Export backup", import: "Import backup", checkpoint: "Export save state",
    rawExport: "Export .sav file", restore: "Restore and restart", cancel: "Cancel",
    replace: "This game's save will be replaced. Export a backup before restoring.",
    rawWarning: "A .sav file does not identify its game and may not include its clock. Check that it belongs to this ROM.",
    stateWarning: "Restoring a save state also returns the clock and game to the exported moment.",
    leaveWithoutSave: "Continue without preserving the save", libraryBack: "Back to games",
    help: "Arrows/WASD · X: A · Z: B · Enter: Start · Shift: Select · Esc: pause · Alt + Q: exit",
    saveHelp: "Save from the Pokémon menu. The cartridge save and its clock stay in this browser. A save state also freezes the clock; it does not replace the cartridge save.",
    saved: "Cartridge save preserved.", invalid: "This backup belongs to another game, is incompatible or is damaged.",
    storage: "Your save could not be preserved. Export a backup before exiting.", stopping: "Preserving your save…",
    up: "Up", down: "Down", left: "Left", right: "Right", backup: "Save and backups", focus: "Game controls",
    fullscreen: "Fullscreen", windowed: "Exit fullscreen", caseLabel: "Casing",
    cases: { classic: "Classic", transparent: "Transparent", green: "Green", red: "Red" },
    library: "Games", choose: "Choose a game", play: "Play", console: "Handheld console",
    partial: "Partial backup: the available save is included, but its clock could not be verified.",
    openRom: "Open ROM", romFormats: "Game Boy / Color / Advance · .gb, .gbc, .gba", readingRom: "Reading ROM…",
    romErrors: { format: "Choose a .gb, .gbc, .dmg or .gba ROM.", size: "Minimum 16 KB; maximum 8 MB for GB/Color and 32 MB for GBA.", read: "This ROM could not be read. Select it again." },
    localSaveHelp: "Save from the game's menu. Saves stay in this browser separately for each ROM. Backups include the available save and clock files. Select a local ROM file again to play it after returning.",
    gbaHelp: "Arrows/WASD · X: A · Z: B · Q: L · E: R · Enter: Start · Shift: Select · Esc: pause · Alt + Q: exit",
  },
};

type HostMessage = { type: string; [key: string]: unknown };
type ImportCandidate = { restore?: GoldBackup | GameBackup; state?: StateBackup; raw?: boolean };

function GameCartridge({ artwork }: { artwork?: LibraryGame["artwork"] }) {
  if (artwork === "doom") return <svg className={styles.cartridge} viewBox="0 0 80 96" aria-hidden="true" shapeRendering="crispEdges">
    <defs><linearGradient id="doom-label-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe5a5" /><stop offset="0.45" stopColor="#dba755" /><stop offset="1" stopColor="#a34828" /></linearGradient></defs>
    <path d="M8 0h64v8h8v80h-8v8H8v-8H0V8h8Z" fill="#262528" />
    <path d="M10 4h60v4H10ZM4 12h4v72H4Zm68 0h4v72h-4ZM12 88h56v4H12Z" fill="#51494b" />
    <path d="M10 14h60v54H10Z" fill="#190f13" /><path d="M12 16h56v50H12Z" fill="#641b20" />
    <path d="M12 52h6v-6h4v10h6v-8h4v12h6v-6h4v8h6V50h4v8h6V46h4v10h6v10H12Z" fill="#ad4225" />
    <path d="M12 20h9l5 5v10l-5 5h-9Zm4 4v12h3l3-3v-6l-3-3ZM29 20h12v20H29Zm4 4v12h4V24ZM44 20h12v20H44Zm4 4v12h4V24ZM59 20h4l3 7 3-7h4v20h-4V29l-3 6-3-6v11h-4Z" fill="url(#doom-label-fire)" fillRule="evenodd" />
    <path d="M30 46h20v4h4v12H26V50h4Z" fill="#291518" /><path d="M30 51h6v4h-6Zm14 0h6v4h-6Z" fill="#fba043" />
    <path d="M34 60h12v6H34Z" fill="#120c0e" /><path d="M16 76h48v8H16Z" fill="#17171b" />
    <path d="M20 78h40v2H20ZM20 82h40v2H20Z" fill="#655b59" />
  </svg>;
  return <svg className={styles.cartridge} viewBox="0 0 40 48" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h32v4h4v40h-4v4H4v-4H0V4h4Z" fill="#c6ac68" /><path d="M8 4h24v22H8Z" fill="#504c37" /><path d="M12 30h16v12H12Z" fill="#e2cb8c" /><path d="M14 8h12v4H14Zm0 8h12v4H14Z" fill="#e2cb8c" /></svg>;
}

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
  const romInput = useRef<HTMLInputElement>(null);
  const localRomUrl = useRef<string | null>(null);
  const localRomFile = useRef<File | null>(null);
  const mounted = useRef(false);
  const readingRom = useRef(false);
  const [romBusy, setRomBusy] = useState(false);
  const [romError, setRomError] = useState<"format" | "size" | "read" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"library" | "loading" | "ready" | "error" | "stopping">("library");
  const [selectedGame, setSelectedGame] = useState<LibraryGame | null>(null);
  const gameRef = useRef<LibraryGame | null>(null);
  const session = useRef("");
  const [sessionId, setSessionId] = useState("");
  const pendingImport = useRef<ImportCandidate | null>(null);
  const [importCandidate, setImportCandidate] = useState<ImportCandidate | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const importReading = useRef(false);
  const [stopFailed, setStopFailed] = useState(false);
  const [cancelImportOnFailure, setCancelImportOnFailure] = useState(false);
  const stopTarget = useRef<"library" | "desktop" | "restart">("desktop");
  const awaitingStop = useRef(false);
  const wasReady = useRef(false);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const soundOn = useRef(false);
  const userMuted = useRef(false);
  const [casing, setCasing] = useState<GameBoyCase>(() => {
    try { return parseGameBoyCase(typeof window === "undefined" ? null : window.localStorage.getItem(CASE_STORAGE_KEY)); }
    catch { return "classic"; }
  });
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<GameFullscreenMode>("none");
  const fullscreen = useRef<ReturnType<typeof createGameFullscreen> | null>(null);
  const casePicker = useRef<HTMLDivElement>(null);
  const saveMenu = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<"saved" | "invalid" | "storage" | "partial" | null>(null);
  const state = useRef({ status, paused });
  const held = useRef(new Map<string, string>());
  const stopTimeout = useRef<number | undefined>(undefined);
  const exitRef = useRef(onExit);
  const send = useCallback((message: HostMessage) => {
    frame.current?.contentWindow?.postMessage({ channel: "gold-host", session: session.current, ...message }, window.location.origin);
  }, []);
  useEffect(() => { state.current = { status, paused }; exitRef.current = onExit; }, [status, paused, onExit]);

  useLayoutEffect(() => {
    const mobile = window.matchMedia("(max-width: 700px), (pointer: coarse) and (max-width: 1100px)");
    let restore: (() => void) | undefined;
    const sync = () => {
      restore?.();
      restore = undefined;
      const element = dialog.current;
      if (!mobile.matches || !element) return;
      const color = fullscreenMode === "none"
        ? window.getComputedStyle(element).getPropertyValue("--case-top-color").trim()
        : "#000000";
      const root = document.documentElement;
      const body = document.body;
      const rootColor = root.style.backgroundColor;
      const bodyColor = body.style.backgroundColor;
      const panelColor = root.style.getPropertyValue("--sequence-theme-color");
      const panelPriority = root.style.getPropertyPriority("--sequence-theme-color");
      const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
      const previous = metas.map(meta => ({ meta, content: meta.getAttribute("content"), media: meta.getAttribute("media") }));
      const created = metas.length ? null : document.createElement("meta");
      if (created) {
        created.name = "theme-color";
        document.head.appendChild(created);
        metas.push(created);
      }
      // Tint browser chrome and the canvas behind translucent iOS status bars.
      metas.forEach(meta => { meta.removeAttribute("media"); meta.content = color; });
      root.style.backgroundColor = color;
      body.style.backgroundColor = color;
      root.style.setProperty("--sequence-theme-color", color);
      restore = () => {
        root.style.backgroundColor = rootColor;
        body.style.backgroundColor = bodyColor;
        if (panelColor) root.style.setProperty("--sequence-theme-color", panelColor, panelPriority);
        else root.style.removeProperty("--sequence-theme-color");
        previous.forEach(({ meta, content, media }) => {
          if (content === null) meta.removeAttribute("content"); else meta.setAttribute("content", content);
          if (media === null) meta.removeAttribute("media"); else meta.setAttribute("media", media);
        });
        created?.remove();
      };
    };
    sync();
    mobile.addEventListener("change", sync);
    return () => { mobile.removeEventListener("change", sync); restore?.(); };
  }, [casing, fullscreenMode]);

  const release = useCallback(() => { held.current.clear(); send({ type: "release" }); }, [send]);
  const press = useCallback((source: string, key: string) => {
    if (state.current.status !== "ready" || state.current.paused || held.current.has(source)) return;
    // The cartridge boots muted. The first control press unmutes inside this
    // gesture; an explicit mute from the sound button stays off.
    if (!userMuted.current && !soundOn.current) {
      soundOn.current = true;
      send({ type: "sound", value: true });
    }
    const alreadyHeld = [...held.current.values()].includes(key);
    held.current.set(source, key);
    if (!alreadyHeld) send({ type: "key", key, down: true });
  }, [send]);
  const lift = useCallback((source: string) => {
    const key = held.current.get(source);
    if (!key) return;
    held.current.delete(source);
    if (![...held.current.values()].includes(key)) send({ type: "key", key, down: false });
  }, [send]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (localRomUrl.current) URL.revokeObjectURL(localRomUrl.current);
      localRomUrl.current = null;
      localRomFile.current = null;
    };
  }, []);
  useEffect(() => {
    const controller = createGameFullscreen(document, mode => {
      setFullscreenMode(mode);
      // The fullscreen root joins the top layer last. Raise the existing modal
      // above it without remounting its iframe or disturbing the game session.
      if (mode === "native" && dialog.current?.open) {
        dialog.current.close(); dialog.current.showModal();
      }
      // showModal focuses the first control. Immersive mode (Safari refuses the
      // Fullscreen API) never refocused, so Enter/Space kept activating that
      // button instead of Start/A. Return focus to the dialog either way.
      if (mode !== "none") dialog.current?.focus({ preventScroll: true });
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
    if (state.current.status !== "library" || readingRom.current) return;
    state.current.status = "loading";
    session.current = crypto.randomUUID(); gameRef.current = game; wasReady.current = false;
    setSessionId(session.current);
    pendingImport.current = null;
    setSelectedGame(game); setStatus("loading"); setNotice(null); setStopFailed(false);
  }, []);
  // Library screen: the D-pad (arrows, WASD, on-screen) moves the highlighted
  // card and A/Start launch it, mirroring what the keys do in-game.
  const libraryCards = useCallback(() => [...(dialog.current?.querySelectorAll<HTMLButtonElement>("[data-launch-game], [data-library-rom]") ?? [])], []);
  const libraryStep = useCallback((delta: number) => {
    if (state.current.status !== "library") return;
    const cards = libraryCards();
    if (!cards.length) return;
    const current = cards.indexOf(document.activeElement as HTMLButtonElement);
    cards[Math.min(cards.length - 1, Math.max(0, (current < 0 ? 0 : current) + delta))].focus({ preventScroll: false });
  }, [libraryCards]);
  const libraryLaunch = useCallback(() => {
    const cards = libraryCards();
    const focused = cards.find(card => card === document.activeElement) ?? cards[0];
    if (focused?.hasAttribute("data-library-rom")) { focused.click(); return; }
    const game = GAME_LIBRARY.find(item => item.id === focused?.dataset.launchGame) ?? GAME_LIBRARY[0];
    startGame(game);
  }, [libraryCards, startGame]);
  async function openLocalRom(file: File) {
    if (state.current.status !== "library" || readingRom.current) return;
    readingRom.current = true; setRomBusy(true); setRomError(null);
    try {
      const identity = await identifyLocalRom(file);
      if (!mounted.current || state.current.status !== "library") return;
      const romUrl = URL.createObjectURL(file);
      localRomUrl.current = romUrl;
      localRomFile.current = file;
      readingRom.current = false;
      startGame({ ...identity, romUrl, playerUrl: "/gameboy/frame.html?local=1" });
    } catch (error) {
      if (mounted.current) setRomError(error instanceof RomFileError ? error.reason : "read");
    } finally {
      readingRom.current = false;
      if (mounted.current) setRomBusy(false);
    }
  }
  function chooseCase(value: GameBoyCase) {
    setCasing(value); setCasePickerOpen(false);
    try { localStorage.setItem(CASE_STORAGE_KEY, value); } catch { /* Styling remains usable without storage. */ }
    dialog.current?.focus({ preventScroll: true });
  }
  function toggleFullscreen() {
    release(); setCasePickerOpen(false); setSaveMenuOpen(false);
    if (fullscreenMode === "none") void fullscreen.current?.enter();
    else void fullscreen.current?.leave();
  }
  const finishStop = useCallback(() => {
    window.clearTimeout(stopTimeout.current);
    awaitingStop.current = false;
    release();
    if (stopTarget.current === "restart") {
      // EmulatorJS revokes a blob URL after fetching it. A retry needs a new
      // URL from the retained File, without another full ROM copy in memory.
      if (localRomFile.current && gameRef.current) {
        if (localRomUrl.current) URL.revokeObjectURL(localRomUrl.current);
        const romUrl = URL.createObjectURL(localRomFile.current);
        localRomUrl.current = romUrl;
        gameRef.current = { ...gameRef.current, romUrl };
        setSelectedGame(gameRef.current);
      }
      session.current = crypto.randomUUID(); wasReady.current = false;
      setSessionId(session.current);
      state.current = { status: "loading", paused: false };
      setStatus("loading"); setPaused(false); setSound(false); soundOn.current = false; userMuted.current = false; setStopFailed(false);
      setSaveMenuOpen(false); setImportCandidate(null); setAttempt(value => value + 1);
      return;
    }
    void fullscreen.current?.leave();
    if (stopTarget.current === "desktop") { exitRef.current(); return; }
    if (localRomUrl.current) URL.revokeObjectURL(localRomUrl.current);
    localRomUrl.current = null; localRomFile.current = null; gameRef.current = null; pendingImport.current = null;
    session.current = ""; wasReady.current = false;
    setSessionId("");
    state.current = { status: "library", paused: false };
    setSelectedGame(null); setStatus("library"); setPaused(false); setSound(false); soundOn.current = false; userMuted.current = false;
    setNotice(null); setStopFailed(false); setSaveMenuOpen(false); setImportCandidate(null);
  }, [release]);
  const recoverStop = useCallback(() => {
    window.clearTimeout(stopTimeout.current);
    state.current.status = wasReady.current ? "ready" : "error";
    setStatus(state.current.status); setStopFailed(true); setNotice("storage");
    setCancelImportOnFailure(stopTarget.current === "restart" && pendingImport.current !== null);
    setSaveMenuOpen(true);
  }, []);
  const requestStop = useCallback((target: "library" | "desktop" | "restart") => {
    if (state.current.status === "stopping" || readingRom.current) return;
    stopTarget.current = target;
    if (state.current.status === "library" || !frame.current) { finishStop(); return; }
    state.current.status = "stopping";
    awaitingStop.current = true;
    setStatus("stopping"); setStopFailed(false); release();
    stopTimeout.current = window.setTimeout(recoverStop, 5000);
    send({ type: "stop" });
  }, [finishStop, recoverStop, release, send]);
  const exit = useCallback(() => requestStop("desktop"), [requestStop]);

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
      const key = (gameRef.current?.platform === "gba" ? GBA_KEYS : GAME_KEYS)[event.code];
      // Let Enter/Space activate focused UI buttons instead of pressing Start/A.
      if (!key || event.altKey) return;
      event.preventDefault();
      if (state.current.status === "library") {
        if (key === "ArrowUp" || key === "ArrowDown") libraryStep(key === "ArrowUp" ? -1 : 1);
        else if (!event.repeat && (key === "x" || key === "Enter")) libraryLaunch();
        return;
      }
      if (!event.repeat && state.current.status === "ready" && !state.current.paused) {
        press(`keyboard:${event.code}`, key);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.metaKey || event.ctrlKey) { event.stopPropagation(); return; }
      if (!held.current.has(`keyboard:${event.code}`) && (event.key === "Enter" || event.key === " ") && event.target instanceof HTMLElement && event.target.closest("button,summary,input")) return;
      event.stopImmediatePropagation();
      lift(`keyboard:${event.code}`);
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
  }, [send, release, exit, startGame, press, lift, libraryStep, libraryLaunch]);

  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => { if (state.current.status === "loading") setStatus("error"); }, 45000);
    return () => window.clearTimeout(timeout);
  }, [status, attempt]);
  useEffect(() => {
    if (status === "library") dialog.current?.querySelector<HTMLButtonElement>("[data-launch-game]")?.focus({ preventScroll: true });
  }, [status]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.channel !== "gold-player" || event.data.session !== session.current) return;
      const data = event.data;
      if (data.type === "ready" && (state.current.status === "loading" || (state.current.status === "error" && !wasReady.current && !stopFailed))) {
        wasReady.current = true; pendingImport.current = null;
        state.current.status = "ready"; setStatus("ready"); dialog.current?.focus({ preventScroll: true });
      }
      if (data.type === "paused") { state.current.paused = data.value === true; setPaused(data.value === true); }
      if (data.type === "sound") { soundOn.current = data.value === true; setSound(data.value === true); }
      if (data.type === "saved") setNotice("saved");
      if (data.type === "storage-error") setNotice("storage");
      if (data.type === "error") {
        if (state.current.status === "stopping") recoverStop();
        else { state.current.status = "error"; setStatus("error"); }
      }
      if (data.type === "stopped" && awaitingStop.current) finishStop();
      if (data.type === "stop-failed" && awaitingStop.current) {
        awaitingStop.current = false; recoverStop();
      }
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
      if (data.type === "game-backup" && selectedGame && typeof data.backup === "string") {
        try {
          const backup = parseGameBackup(data.backup, selectedGame);
          download(data.backup, `${selectedGame.id}.cartridge.json`, "application/json");
          setNotice(backup.partial ? "partial" : "saved");
        } catch { setNotice("invalid"); }
      }
      if (data.type === "snapshot" && selectedGame && typeof data.backup === "string") {
        try {
          parseStateBackup(data.backup, selectedGame);
          download(data.backup, `${selectedGame.id}.state.json`, "application/json");
        } catch { setNotice("invalid"); }
      }
      if (data.type === "cartridge-save" && selectedGame && encodedSize(data.encoded) >= 0 && encodedSize(data.encoded) <= MAX_SRAM_BYTES) {
        download(Uint8Array.from(atob(data.encoded), char => char.charCodeAt(0)), `${selectedGame.id}.sav`, "application/octet-stream");
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [attempt, exit, selectedGame, finishStop, recoverStop, stopFailed]);

  function retry() {
    if (wasReady.current) { requestStop("restart"); return; }
    stopTarget.current = "restart"; finishStop();
  }
  async function readImport(file: File) {
    const game = gameRef.current;
    const currentSession = session.current;
    if (!game || state.current.status !== "ready" || importReading.current) return;
    importReading.current = true;
    setImportBusy(true); setImportCandidate(null);
    try {
      let candidate: ImportCandidate;
      if (/\.(sav|srm)$/i.test(file.name)) {
        if (!file.size || file.size > MAX_SRAM_BYTES || (game.saveMode === "gold" && file.size !== 32768)) throw new Error("Invalid save size");
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
        const sram = btoa(binary);
        const savedAt = new Date().toISOString();
        candidate = { raw: true, restore: game.saveMode === "gold"
          ? parseGoldBackup(JSON.stringify({ format: "monsite-gold-cartridge", version: 1, rom: GOLD_ROM_SHA256, savedAt, sram }))
          : parseGameBackup(JSON.stringify({ format: "monsite-game-cartridge", version: 1, rom: game.sha256,
            platform: game.platform, core: game.core, savedAt, sram, partial: true }), game) };
      } else {
        if (!/\.json$/i.test(file.name) || file.size > STATE_BACKUP_LIMIT) throw new Error("Invalid backup");
        const text = await file.text();
        const format = JSON.parse(text)?.format;
        if (format === "monsite-game-state") candidate = { state: parseStateBackup(text, game) };
        else if (game.saveMode === "gold") candidate = { restore: parseGoldBackup(text) };
        else {
          if (file.size > GAME_BACKUP_LIMIT) throw new Error("Backup too large");
          candidate = { restore: parseGameBackup(text, game) };
        }
      }
      if (mounted.current && state.current.status === "ready" && session.current === currentSession && gameRef.current === game) setImportCandidate(candidate);
    } catch { if (mounted.current && session.current === currentSession) setNotice("invalid"); }
    finally { importReading.current = false; if (mounted.current) setImportBusy(false); }
  }
  function cancelImport() {
    pendingImport.current = null; awaitingStop.current = false;
    window.clearTimeout(stopTimeout.current);
    setImportCandidate(null); setStopFailed(false); setCancelImportOnFailure(false);
  }
  const gba = selectedGame?.platform === "gba";
  const help = gba ? copy.gbaHelp : copy.help;
  const controls = [["ArrowUp", "↑", copy.up], ["ArrowLeft", "←", copy.left], ["ArrowDown", "↓", copy.down], ["ArrowRight", "→", copy.right], ["z", "B", "B"], ["x", "A", "A"], ["Shift", "Select", "Select"], ["Enter", "Start", "Start"]];
  const libraryAction = (key: string) => { if (key === "ArrowUp" || key === "ArrowDown") libraryStep(key === "ArrowUp" ? -1 : 1); else libraryLaunch(); };
  const renderControl = ([key, label, name]: string[]) => <button key={key} type="button" data-key={key} aria-label={name} disabled={(status !== "ready" && !(status === "library" && ["x", "Enter", "ArrowUp", "ArrowDown"].includes(key))) || paused}
    onPointerDown={event => { event.preventDefault(); if (status === "library") { libraryAction(key); return; } event.currentTarget.setPointerCapture(event.pointerId); press(`pointer:${event.pointerId}`, key); }}
    onPointerUp={event => { lift(`pointer:${event.pointerId}`); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={event => lift(`pointer:${event.pointerId}`)} onLostPointerCapture={event => lift(`pointer:${event.pointerId}`)}
    onKeyDown={event => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); if (status === "library") libraryAction(key); else press(`button:${key}:${event.key}`, key); } }}
    onKeyUp={event => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); lift(`button:${key}:${event.key}`); } }}
    onBlur={() => { lift(`button:${key}: `); lift(`button:${key}:Enter`); }}>
    {key.startsWith("Arrow") ? <svg className={styles.direction} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M6 2h4v2h2v2h2v2h-4v6H6V8H2V6h2V4h2Z" fill="currentColor" /></svg> : label}
  </button>;

  return <dialog ref={dialog} className={styles.dialog} data-case={casing} data-platform={selectedGame?.platform ?? "gbc"} data-fullscreen={fullscreenMode !== "none"} tabIndex={-1} aria-label={copy.console} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onCancel={event => { event.preventDefault(); if (status === "library") exit(); else if (status === "ready") send({ type: "pause", value: !paused }); }} onTouchStart={event => event.stopPropagation()} onTouchEnd={event => event.stopPropagation()}>
    <div className={styles.content}>
      <header className={styles.toolbar}>
        <span className={styles.title}>{selectedGame?.title ?? copy.library}</span>
        <div>
          {selectedGame && <button className={styles.iconButton} type="button" disabled={status === "stopping" || importBusy} title={copy.libraryBack} aria-label={copy.libraryBack} onClick={() => requestStop("library")}>▦</button>}
          <button className={styles.pauseButton} type="button" disabled={status !== "ready"} aria-label={paused ? copy.resume : copy.pause} title={paused ? copy.resume : copy.pause} onClick={() => { release(); send({ type: "pause", value: !paused }); }}><span className={styles.pauseLabel}>{paused ? copy.resume : copy.pause}</span><svg className={styles.pauseIcon} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d={paused ? "M4 2v12h2v-2h3v-2h3V6H9V4H6V2Z" : "M3 2h4v12H3Zm6 0h4v12H9Z"} fill="currentColor" /></svg></button>
          <button className={styles.soundButton} type="button" disabled={status !== "ready"} aria-label={sound ? copy.mute : copy.sound} title={sound ? copy.mute : copy.sound} aria-pressed={sound} onClick={() => { const next = !sound; userMuted.current = !next; send({ type: "sound", value: next }); }}><span className={styles.soundLabel}>{sound ? copy.mute : copy.sound}</span><svg className={styles.soundIcon} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d="M1 6h3V4h2V2h2v12H6v-2H4v-2H1Z" fill="currentColor" /><path d={sound ? "M10 4h2v2h2v4h-2v2h-2v-2h2V6h-2Z" : "M10 6h2v2h-2Zm2 2h2v2h-2Z"} fill="currentColor" /></svg></button>
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
              <p>{selectedGame.saveMode === "gold" ? copy.saveHelp : copy.localSaveHelp}</p>
              <button type="button" disabled={status !== "ready"} onClick={() => send({ type: "export" })}>{copy.export}</button>
              <button type="button" disabled={status !== "ready"} onClick={() => send({ type: "export-raw" })}>{copy.rawExport}</button>
              <button type="button" disabled={status !== "ready" || importBusy} onClick={() => fileInput.current?.click()}>{copy.import}</button>
              <button type="button" disabled={status !== "ready"} onClick={() => send({ type: "snapshot" })}>{copy.checkpoint}</button>
              {importCandidate && <div className={styles.importConfirmation} role="group" aria-label={copy.restore}>
                <p>{copy.replace}</p>
                {importCandidate.raw && <p>{copy.rawWarning}</p>}
                {importCandidate.state && <p>{copy.stateWarning}</p>}
                {importCandidate.restore && (("partial" in importCandidate.restore && importCandidate.restore.partial) ||
                  (selectedGame.saveMode === "gold" && !importCandidate.restore.rtc)) && <p>{copy.partial}</p>}
                <button type="button" disabled={status !== "ready"} onClick={() => { pendingImport.current = importCandidate; requestStop("restart"); }}>{copy.restore}</button>
                <button type="button" onClick={cancelImport}>{copy.cancel}</button>
              </div>}
              <p className={styles.saveHelp}>{help}</p>
              {notice && <p className={styles.saveStatus} role="status">{copy[notice]}</p>}
              {stopFailed && <button type="button" onClick={() => {
                // Explicit escape hatch after a failed flush. Never apply an
                // import while the old engine could still overwrite it.
                if (stopTarget.current === "restart" && pendingImport.current) {
                  cancelImport();
                  return;
                }
                finishStop();
              }}>{cancelImportOnFailure ? copy.cancel : copy.leaveWithoutSave}</button>}
            </section>}
          </div>}
          <button className={styles.iconButton} type="button" disabled={status === "stopping" && fullscreenMode === "none"} title={fullscreenMode === "none" ? copy.fullscreen : copy.windowed} aria-label={fullscreenMode === "none" ? copy.fullscreen : copy.windowed} aria-pressed={fullscreenMode !== "none"} onClick={toggleFullscreen}><svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d={fullscreenMode === "none" ? "M1 1h5v2H3v3H1Zm9 0h5v5h-2V3h-3ZM1 10h2v3h3v2H1Zm12 0h2v5h-5v-2h3Z" : "M4 1h2v5H1V4h3Zm6 0h2v3h3v2h-5ZM1 10h5v5H4v-3H1Zm9 0h5v2h-3v3h-2Z"} fill="currentColor" /></svg></button>
          <button className={styles.exitButton} type="button" disabled={status === "stopping" || romBusy || importBusy} aria-label={copy.exit} title={copy.exit} onClick={exit}><span className={styles.exitLabel}>{copy.exit} </span>↗</button>
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
                <div className={styles.libraryGames}>{GAME_LIBRARY.map(game => <button className={styles.gameCard} data-artwork={game.artwork} data-launch-game={game.id} key={game.id} type="button" disabled={romBusy} onClick={() => startGame(game)}>
                  <GameCartridge artwork={game.artwork} />
                  <span><strong>{game.title}</strong><small>{game.platform.toUpperCase()} · {copy.play}</small></span><span className={styles.cardArrow} aria-hidden="true">▸</span>
                </button>)}</div>
                <button className={`${styles.gameCard} ${styles.romCard}`} data-library-rom type="button" disabled={romBusy} onClick={() => romInput.current?.click()}>
                  <svg className={styles.cartridge} viewBox="0 0 40 48" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 0h32v4h4v40h-4v4H4v-4H0V4h4Z" fill="#777786" /><path d="M17 10h6v8h8v6h-8v8h-6v-8H9v-6h8Z" fill="#e6e2d5" /><path d="M12 38h16v4H12Z" fill="#41454d" /></svg>
                  <span><strong>{romBusy ? copy.readingRom : copy.openRom}</strong><small>{copy.romFormats}</small></span><span aria-hidden="true">▸</span>
                </button>
                {romError && <p className={styles.romError} role="alert">{copy.romErrors[romError]}</p>}
              </section>}
              {selectedGame && <iframe key={attempt} ref={frame} src={`${selectedGame.playerUrl}${selectedGame.playerUrl.includes("?") ? "&" : "?"}session=${sessionId}`} title={selectedGame.title} allow="autoplay" tabIndex={-1} className={styles.frame} onLoad={() => send({ type: "load-rom", url: selectedGame.romUrl, id: selectedGame.id,
                platform: selectedGame.platform, sha256: selectedGame.sha256, saveMode: selectedGame.saveMode,
                restore: pendingImport.current?.restore, state: pendingImport.current?.state })} />}
              {status !== "ready" && status !== "library" && <div className={styles.overlay} role="status">
                <p>{status === "loading" ? copy.loading : status === "stopping" ? copy.stopping : copy.error}</p>
                {status === "error" && <><button type="button" onClick={retry}>{copy.retry}</button><button type="button" onClick={() => requestStop("library")}>{copy.libraryBack}</button></>}
              </div>}
              {status === "ready" && paused && <div className={styles.overlay}><button type="button" onClick={() => send({ type: "pause", value: false })}>{copy.paused} · {copy.resume}</button></div>}
            </div>
          </div>
          <div className={styles.touchControls} aria-label={copy.focus}>
            {gba && <div className={styles.shoulderButtons}>{[["a", "L", "L"], ["s", "R", "R"]].map(renderControl)}</div>}
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
      <input ref={romInput} type="file" accept={ROM_ACCEPT} hidden onChange={event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
        if (file) void openLocalRom(file);
      }} />
      <input ref={fileInput} type="file" accept=".json,.sav,.srm,application/json" hidden onChange={event => {
        const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
        if (file) void readImport(file);
      }} />
    </div>
  </dialog>;
}
