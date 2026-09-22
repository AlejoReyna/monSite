import { WINDOW_EDGES, type WindowEdge } from "@/lib/desktop/use-window-frame";
import styles from "./window-resize-handles.module.css";

// The eight edge and corner grips of a resizable window (see useWindowFrame).
export default function WindowResizeHandles({ handleProps }: { handleProps: (edge: WindowEdge) => object }) {
  return <>{WINDOW_EDGES.map(edge => <span key={edge} className={styles.resizeHandle} {...handleProps(edge)} />)}</>;
}
