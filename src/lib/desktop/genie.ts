// Deform horizontal strips so the content itself bends into the Dock.
// A clipped/scaled rectangle alone cannot reproduce the Genie funnel.
export function animateGenie(source: HTMLElement, target: HTMLElement | null, restoring = false, onComplete?: () => void): () => void {
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("mac-reduced-motion")) return () => {};
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !from.height) return () => {};

  const layer = document.createElement("div");
  layer.dataset.genieLayer = "true";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  const computed = getComputedStyle(source);
  Object.assign(layer.style, {
    position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999",
    font: computed.font, color: computed.color,
  });
  const count = 64;
  const height = from.height / count;
  const template = source.cloneNode(true) as HTMLElement;
  template.removeAttribute("id");
  template.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  Object.assign(template.style, {
    position: "absolute", top: "0", left: "0", width: `${from.width}px`, height: `${from.height}px`,
    maxWidth: "none", maxHeight: "none", margin: "0", transform: "none", translate: "none",
    animation: "none", transition: "none", visibility: "visible", pointerEvents: "none", boxShadow: "none",
  });
  const strips = Array.from({ length: count }, (_, index) => {
    const strip = document.createElement("div");
    Object.assign(strip.style, {
      position: "absolute", left: "0", top: "0", width: `${from.width}px`,
      height: `${height + 0.5}px`, overflow: "hidden", transformOrigin: "0 0", willChange: "transform",
    });
    const content = template.cloneNode(true) as HTMLElement;
    content.style.top = `${-index * height}px`;
    strip.append(content);
    layer.append(strip);
    return strip;
  });
  document.body.append(layer);
  const visibility = source.style.visibility;
  source.style.visibility = "hidden";
  let frame = 0;
  let finished = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    layer.remove();
    source.style.visibility = visibility;
  };
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const point = (v: number, p: number) => {
    const neck = smooth((p - (1 - v) * 0.34) / 0.56);
    const pull = smooth((p - 0.3) / 0.7);
    const width = from.width + (to.width - from.width) * neck;
    const center = from.left + from.width / 2 + (to.left + to.width / 2 - from.left - from.width / 2) * neck;
    return { x: center - width / 2, y: from.top + v * from.height + (to.top + v * to.height - from.top - v * from.height) * pull, width };
  };
  const draw = (p: number) => {
    strips.forEach((strip, index) => {
      const a = point(index / count, p);
      const b = point((index + 1) / count, p);
      const width = Math.max(a.width, b.width);
      strip.style.clipPath = `polygon(0 0, ${a.width / width * 100}% 0, ${b.width / width * 100}% 100%, 0 100%)`;
      strip.style.transform = `matrix(${width / from.width},0,${(b.x - a.x) / height},${(b.y - a.y) / height},${a.x},${a.y})`;
    });
    layer.style.opacity = String(1 - smooth((p - 0.92) / 0.08));
  };
  draw(restoring ? 1 : 0);
  const start = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / 720);
    draw(restoring ? 1 - progress : progress);
    if (progress < 1) frame = requestAnimationFrame(tick);
    else {
      cleanup();
      onComplete?.();
    }
  };
  frame = requestAnimationFrame(tick);
  return cleanup;
}
