"use client";

import { useEffect, useRef, useState } from "react";
import { Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Moon } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import styles from "./menu-bar.module.css";
import { useOutsideClick } from "./use-menu-dismiss";

type BatteryManagerLike = {
  charging: boolean;
  level: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

export function FocusControl() {
  const { language } = useLanguage();
  const { openMenu, setOpenMenu, focusMode, toggleFocus } = useDesktopStore();
  const open = openMenu === "focus";
  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideClick(open, () => setOpenMenu(null), rootRef);
  const label =
    language === "es" ? "Focus" : language === "zh" ? "Focus" : "Focus";
  const detail = focusMode.active
    ? language === "es"
      ? "Activo · hasta 25 min"
      : language === "zh"
        ? "已开启 · 最长 25 分钟"
        : "On · up to 25 min"
    : language === "es"
      ? "Pausa animaciones 25 min"
      : language === "zh"
        ? "暂停动画 25 分钟"
        : "Pause animations 25 min";

  return (
    <div className={`${styles.item} ${styles.desktopOnly}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.iconBtn} ${focusMode.active ? styles.focusOn : ""}`.trim()}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpenMenu(open ? null : "focus")}
      >
        <Moon size={15} fill={focusMode.active ? "currentColor" : "none"} />
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.menuRight}`} role="menu">
          <button type="button" role="menuitem" onClick={() => { toggleFocus(); setOpenMenu(null); }}>
            <span>{focusMode.active ? (language === "es" ? "Desactivar Focus" : language === "zh" ? "关闭 Focus" : "Turn Focus Off") : (language === "es" ? "Activar Focus" : language === "zh" ? "开启 Focus" : "Turn Focus On")}</span>
          </button>
          <div className={styles.sep} />
          <button type="button" disabled>
            <span>{detail}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ConnectionControl() {
  const { language } = useLanguage();
  const { openMenu, setOpenMenu, connection, checkConnection, assistantAvailable } = useDesktopStore();
  const open = openMenu === "connection";
  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideClick(open, () => setOpenMenu(null), rootRef);

  const statusText =
    connection === "checking"
      ? language === "es"
        ? "Comprobando…"
        : language === "zh"
          ? "检查中…"
          : "Checking…"
      : connection === "reachable"
        ? language === "es"
          ? "Alcanzable"
          : language === "zh"
            ? "可达"
            : "Reachable"
        : language === "es"
          ? "No se puede alcanzar"
          : language === "zh"
            ? "无法连接"
            : "Unable to Reach";

  const assistantText =
    assistantAvailable == null
      ? "…"
      : assistantAvailable
        ? language === "es"
          ? "Orbit disponible"
          : language === "zh"
            ? "Orbit 可用"
            : "Orbit available"
        : language === "es"
          ? "Orbit no disponible"
          : language === "zh"
            ? "Orbit 不可用"
            : "Orbit unavailable";

  return (
    <div className={`${styles.item} ${styles.desktopOnly}`} ref={rootRef}>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Connection"
        aria-expanded={open}
        onClick={() => setOpenMenu(open ? null : "connection")}
      >
        <span
          className={`${styles.statusDot} ${
            connection === "reachable"
              ? styles.statusReachable
              : connection === "unreachable"
                ? styles.statusUnreachable
                : styles.statusChecking
          }`}
        />
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.menuRight}`} role="menu">
          <button type="button" disabled>
            <span>{statusText}</span>
          </button>
          <button type="button" disabled>
            <span>{assistantText}</span>
          </button>
          <div className={styles.sep} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void checkConnection();
            }}
          >
            {language === "es" ? "Reintentar" : language === "zh" ? "重试" : "Retry"}
          </button>
        </div>
      )}
    </div>
  );
}

export function BatteryControl() {
  const { language } = useLanguage();
  const { openMenu, setOpenMenu, reduceEffects } = useDesktopStore();
  const open = openMenu === "battery";
  const rootRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  useOutsideClick(open, () => setOpenMenu(null), rootRef);

  useEffect(() => {
    let battery: BatteryManagerLike | null = null;
    let cancelled = false;
    const sync = (mgr: BatteryManagerLike) => {
      if (cancelled) return;
      setSupported(true);
      setLevel(mgr.level);
      setCharging(mgr.charging);
    };
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (typeof nav.getBattery !== "function") return;
    nav
      .getBattery()
      .then((mgr) => {
        battery = mgr;
        sync(mgr);
        mgr.addEventListener?.("levelchange", () => sync(mgr));
        mgr.addEventListener?.("chargingchange", () => sync(mgr));
      })
      .catch(() => setSupported(false));
    return () => {
      cancelled = true;
      void battery;
    };
  }, []);

  if (!supported || level == null) return null;

  const pct = Math.round(level * 100);
  const Icon =
    charging ? BatteryCharging : pct > 80 ? BatteryFull : pct > 45 ? BatteryMedium : pct > 15 ? Battery : BatteryLow;

  return (
    <div className={`${styles.item} ${styles.desktopOnly}`} ref={rootRef}>
      <button
        type="button"
        className={styles.iconBtn}
        aria-label={`Battery ${pct}%`}
        aria-expanded={open}
        onClick={() => setOpenMenu(open ? null : "battery")}
      >
        <span className={styles.batteryWrap}>
          <Icon size={16} />
          <span>{pct}%</span>
        </span>
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.menuRight}`} role="menu">
          <button type="button" disabled>
            <span>
              {charging
                ? language === "es"
                  ? "Cargando"
                  : language === "zh"
                    ? "充电中"
                    : "Charging"
                : language === "es"
                  ? "En batería"
                  : language === "zh"
                    ? "使用电池"
                    : "On battery"}
            </span>
            <span>{pct}%</span>
          </button>
          <div className={styles.sep} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              reduceEffects();
              setOpenMenu(null);
            }}
          >
            {language === "es" ? "Reducir efectos" : language === "zh" ? "降低效果" : "Reduce Effects"}
          </button>
        </div>
      )}
    </div>
  );
}
