"use client";

import Link from "next/link";
import { useRef } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { useLanguage } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import { ASSISTANT_NAME, type MenuId } from "@/lib/desktop/types";
import { AssistantControl } from "./assistant-panel";
import { DateTimeControl } from "./datetime-popover";
import { DesktopDialogs } from "./dialogs";
import styles from "./menu-bar.module.css";
import { SpotlightSearch } from "./spotlight-search";
import { BatteryControl, ConnectionControl, FocusControl } from "./status-controls";
import { useHoverSwitch, useMenuDismiss } from "./use-menu-dismiss";

function Menu({
  id,
  label,
  align = "left",
  className,
  triggerClassName,
  ariaLabel,
  children,
}: {
  id: MenuId;
  label: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const { openMenu, setOpenMenu } = useDesktopStore();
  const open = openMenu === id;
  const hover = useHoverSwitch(openMenu, setOpenMenu, id, true);
  const isString = typeof label === "string";
  return (
    <div className={`${styles.item} ${className ?? ""}`.trim()} {...hover}>
      <button
        type="button"
        className={
          triggerClassName
            ? triggerClassName
            : isString
              ? styles.trigger
              : `${styles.trigger} ${styles.appleTrigger}`
        }
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpenMenu(open ? null : id)}
      >
        {label}
      </button>
      {open && (
        <div
          className={`${styles.menu} ${align === "right" ? styles.menuRight : ""}`.trim()}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function MacMenuBar() {
  const { language } = useLanguage();
  const store = useDesktopStore();
  const rootRef = useRef<HTMLElement>(null);
  useMenuDismiss(store.openMenu, store.setOpenMenu, rootRef);

  const t =
    language === "es"
      ? {
          file: "Archivo",
          go: "Ir",
          window: "Ventana",
          help: "Ayuda",
          about: "Acerca de este portafolio",
          prefs: "Preferencias…",
          showDesktop: store.desktopHidden ? "Restaurar ventanas" : "Mostrar escritorio",
          aboutApp: `Acerca de ${store.activeAppName}`,
          closeWindow: "Cerrar ventana",
          openProjects: "Abrir proyectos",
          closeActive: "Cerrar ventana activa",
          projects: "Proyectos",
          blog: "Blog",
          contact: "Contacto",
          home: "Inicio",
          terminal: "Terminal",
          tour: "Tour rápido",
          shortcuts: "Atajos de teclado",
          ask: `Preguntar a ${ASSISTANT_NAME}`,
          search: "Buscar",
          more: "Más",
          focusOn: "Activar Focus",
          focusOff: "Desactivar Focus",
          connection: "Conexión",
          retry: "Reintentar",
          reduce: "Reducir efectos",
          calendar: "Calendario y hora",
          reachable: "Alcanzable",
          unreachable: "No se puede alcanzar",
          checking: "Comprobando…",
        }
      : language === "zh"
        ? {
            file: "文件",
            go: "前往",
            window: "窗口",
            help: "帮助",
            about: "关于此作品集",
            prefs: "偏好设置…",
            showDesktop: store.desktopHidden ? "恢复窗口" : "显示桌面",
            aboutApp: `关于 ${store.activeAppName}`,
            closeWindow: "关闭窗口",
            openProjects: "打开项目",
            closeActive: "关闭活动窗口",
            projects: "项目",
            blog: "博客",
            contact: "联系",
            home: "首页",
            terminal: "终端",
            tour: "快速导览",
            shortcuts: "键盘快捷键",
            ask: `询问 ${ASSISTANT_NAME}`,
            search: "搜索",
            more: "更多",
            focusOn: "开启 Focus",
            focusOff: "关闭 Focus",
            connection: "连接",
            retry: "重试",
            reduce: "降低效果",
            calendar: "日历与时间",
            reachable: "可达",
            unreachable: "无法连接",
            checking: "检查中…",
          }
        : {
            file: "File",
            go: "Go",
            window: "Window",
            help: "Help",
            about: "About This Portfolio",
            prefs: "Preferences…",
            showDesktop: store.desktopHidden ? "Restore Windows" : "Show Desktop",
            aboutApp: `About ${store.activeAppName}`,
            closeWindow: "Close Window",
            openProjects: "Open Projects",
            closeActive: "Close Active Window",
            projects: "Projects",
            blog: "Blog",
            contact: "Contact",
            home: "Home",
            terminal: "Terminal",
            tour: "Quick Tour",
            shortcuts: "Keyboard Shortcuts",
            ask: `Ask ${ASSISTANT_NAME}`,
            search: "Search",
            more: "More",
            focusOn: "Turn Focus On",
            focusOff: "Turn Focus Off",
            connection: "Connection",
            retry: "Retry",
            reduce: "Reduce Effects",
            calendar: "Calendar & Time",
            reachable: "Reachable",
            unreachable: "Unable to Reach",
            checking: "Checking…",
          };

  const canClose =
    (store.focusedWindowId === "finder" && store.projectsOpen) ||
    (store.focusedWindowId === "terminal" && store.terminalOpen) ||
    (store.focusedWindowId === "mail" && store.mailOpen) ||
    store.aboutOpen ||
    store.preferencesOpen ||
    store.tourOpen ||
    store.shortcutsOpen;

  const connectionLabel =
    store.connection === "checking"
      ? t.checking
      : store.connection === "reachable"
        ? t.reachable
        : t.unreachable;

  return (
    <>
      <nav className={styles.bar} aria-label="Desktop" ref={rootRef} onKeyDown={(e) => e.stopPropagation()}>
        <div className={styles.left}>
          <Menu id="apple" label={<FaApple aria-hidden="true" />} className={styles.appleTrigger}>
            <button type="button" role="menuitem" onClick={() => store.openAbout()}>
              {t.about}
            </button>
            <button type="button" role="menuitem" onClick={() => store.openPreferences()}>
              {t.prefs}
            </button>
            <div className={styles.sep} />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (store.desktopHidden) store.restoreDesktop();
                else store.showDesktop();
                store.setOpenMenu(null);
              }}
            >
              {t.showDesktop}
            </button>
          </Menu>

          <Menu id="app" label={<span className={styles.appName}>{store.activeAppName}</span>}>
            <button type="button" role="menuitem" onClick={() => store.openAbout()}>
              {t.aboutApp}
            </button>
            <div className={styles.sep} />
            <button type="button" role="menuitem" disabled={!canClose} onClick={() => { store.closeActiveWindow(); store.setOpenMenu(null); }}>
              {t.closeWindow}
            </button>
          </Menu>

          <div className={`${styles.left} ${styles.menusCollapse}`}>
            <Menu id="file" label={t.file}>
              <button type="button" role="menuitem" onClick={() => store.openProjects()}>
                {t.openProjects}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canClose}
                onClick={() => {
                  store.closeActiveWindow();
                  store.setOpenMenu(null);
                }}
              >
                {t.closeActive}
              </button>
            </Menu>

            <Menu id="go" label={t.go}>
              <button type="button" role="menuitem" onClick={() => store.openProjects()}>
                {t.projects}
              </button>
              <Link href="/blog" role="menuitem" onClick={() => store.setOpenMenu(null)}>
                {t.blog}
              </Link>
              <button type="button" role="menuitem" onClick={() => store.navigateContact()}>
                {t.contact}
              </button>
              <button type="button" role="menuitem" onClick={() => store.navigateHome()}>
                {t.home}
              </button>
            </Menu>

            <Menu id="window" label={t.window}>
              {store.windows
                .filter((w) => w.open)
                .map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    role="menuitem"
                    onClick={() => store.bringForward(w.id)}
                  >
                    <span>{w.title}</span>
                    {w.focused && <span className={styles.check}>●</span>}
                  </button>
                ))}
              {store.windows.some((w) => w.open) && <div className={styles.sep} />}
              <button type="button" role="menuitem" onClick={() => store.openTerminal()}>
                {t.terminal}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  if (store.desktopHidden) store.restoreDesktop();
                  else store.showDesktop();
                  store.setOpenMenu(null);
                }}
              >
                {t.showDesktop}
              </button>
            </Menu>

            <Menu id="help" label={t.help}>
              <button type="button" role="menuitem" onClick={() => store.openTour()}>
                {t.tour}
              </button>
              <button type="button" role="menuitem" onClick={() => store.openShortcuts()}>
                {t.shortcuts}
              </button>
              <button type="button" role="menuitem" onClick={() => store.setOpenMenu("assistant")}>
                {t.ask}
              </button>
              <div className={styles.sep} />
              <button type="button" role="menuitem" onClick={() => store.navigateContact()}>
                {t.contact}
              </button>
            </Menu>
          </div>
        </div>

        <div className={styles.right}>
          {/* Mobile overflow: status + collapsed File/Go/Window/Help equivalents */}
          <Menu
            id="overflow"
            label={<MoreHorizontal size={16} aria-hidden="true" />}
            align="right"
            className={styles.overflowBtn}
            triggerClassName={styles.iconBtn}
            ariaLabel={t.more}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                store.toggleFocus();
                store.setOpenMenu(null);
              }}
            >
              {store.focusMode.active ? t.focusOff : t.focusOn}
            </button>
            <button type="button" disabled>
              <span>
                {t.connection}: {connectionLabel}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void store.checkConnection();
              }}
            >
              {t.retry}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                store.reduceEffects();
                store.setOpenMenu(null);
              }}
            >
              {t.reduce}
            </button>
            <div className={styles.sep} />
            <button type="button" role="menuitem" onClick={() => store.openProjects()}>
              {t.openProjects}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!canClose}
              onClick={() => {
                store.closeActiveWindow();
                store.setOpenMenu(null);
              }}
            >
              {t.closeActive}
            </button>
            <button type="button" role="menuitem" onClick={() => store.openProjects()}>
              {t.projects}
            </button>
            <Link href="/blog" role="menuitem" onClick={() => store.setOpenMenu(null)}>
              {t.blog}
            </Link>
            <button type="button" role="menuitem" onClick={() => store.navigateContact()}>
              {t.contact}
            </button>
            <button type="button" role="menuitem" onClick={() => store.navigateHome()}>
              {t.home}
            </button>
            <button type="button" role="menuitem" onClick={() => store.openTerminal()}>
              {t.terminal}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (store.desktopHidden) store.restoreDesktop();
                else store.showDesktop();
                store.setOpenMenu(null);
              }}
            >
              {t.showDesktop}
            </button>
            <div className={styles.sep} />
            <button type="button" role="menuitem" onClick={() => store.openTour()}>
              {t.tour}
            </button>
            <button type="button" role="menuitem" onClick={() => store.openShortcuts()}>
              {t.shortcuts}
            </button>
            <button type="button" role="menuitem" onClick={() => store.openPreferences()}>
              {t.prefs}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => store.setOpenMenu("datetime")}
            >
              {t.calendar}
            </button>
          </Menu>

          <FocusControl />
          <ConnectionControl />
          <BatteryControl />
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={t.search}
            aria-expanded={store.openMenu === "search"}
            onClick={() => store.setOpenMenu(store.openMenu === "search" ? null : "search")}
          >
            <Search aria-hidden="true" />
          </button>
          <AssistantControl />
          <DateTimeControl />
        </div>
      </nav>
      <SpotlightSearch />
      <DesktopDialogs />
    </>
  );
}
