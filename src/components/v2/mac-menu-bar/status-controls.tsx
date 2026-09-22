"use client";

import { useEffect, useRef, useState } from "react";
import { Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
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
