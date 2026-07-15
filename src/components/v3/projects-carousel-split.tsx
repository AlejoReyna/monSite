"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage, type Language } from "@/components/lang-context";
import { t } from "@/lib/translations";
import { PROJECTS, type V3Project } from "./data/projects";
import "@/components/v3/v3.css";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const TOTAL = PROJECTS.length;

type SplitMediaSlideProps = {
  project: V3Project;
  isActive: boolean;
  videoRef: (el: HTMLVideoElement | null) => void;
};

function SplitMediaSlide({ project, isActive, videoRef }: SplitMediaSlideProps) {
  const hasMedia = Boolean(project.media) && project.mediaType !== "none";
  const isVideo = project.mediaType === "video";

  return (
    <div
      className="projects-split-media-slide"
      aria-hidden={!isActive}
      style={{
        opacity: isActive ? 1 : 0.42,
        transition: "opacity 0.4s ease",
      }}
    >
      <div className="projects-split-col-right">
        {hasMedia &&
          (isVideo ? (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="metadata"
              className="projects-split-video"
              style={{
                filter: isActive ? "none" : "grayscale(0.55)",
                transition: "filter 0.35s ease",
              }}
            >
              <source src={project.media!} type="video/mp4" />
            </video>
          ) : (
            <div className="projects-split-img-wrap">
              <Image
                src={project.media!}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(min-width: 900px) 58vw, 92vw"
                style={{
                  filter: isActive ? "none" : "grayscale(0.55)",
                  transition: "filter 0.35s ease",
                }}
                unoptimized={(project.media ?? "").startsWith("http")}
              />
            </div>
          ))}
        {!hasMedia && <div className="projects-split-media-placeholder" />}
      </div>
    </div>
  );
}

function SplitCopyColumn({ project, language }: { project: V3Project; language: Language }) {
  return (
    <div className="projects-split-parent-copy">
      <span className="projects-split-ghost" aria-hidden="true">
        {project.ghost}
      </span>

      <span className="projects-split-badge">{project.badge}</span>
      <p className="projects-split-tagline">{project.tagline[language]}</p>
      <p className="projects-split-desc">{project.description[language]}</p>

      <div className="projects-split-tags">
        {project.tags.map((tag) => (
          <span key={tag} className="projects-split-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="projects-split-links">
        {project.links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="projects-split-link">
            {link.label[language]}
            {" ↗"}
          </a>
        ))}
      </div>
    </div>
  );
}

type ProjectsCarouselSplitProps = {
  transparentBackdrop?: boolean;
};

export default function ProjectsCarouselSplit({ transparentBackdrop }: ProjectsCarouselSplitProps) {
  const { language } = useLanguage();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    slidesToScroll: 1,
  });

  const viewportNodeRef = useRef<HTMLDivElement | null>(null);
  const setViewportRef = useCallback(
    (el: HTMLDivElement | null) => {
      viewportNodeRef.current = el;
      emblaRef(el);
    },
    [emblaRef]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>(
    Array.from({ length: TOTAL }, () => null)
  );

  const activeProject = useMemo(() => PROJECTS[activeIndex]!, [activeIndex]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setActiveIndex(idx);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (Math.abs(i - activeIndex) <= 1) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [activeIndex]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const progress = TOTAL > 1 ? activeIndex / (TOTAL - 1) : 0;
  const headlineId = "projects-split-title";

  return (
    <section
      className={`projects-split-carousel${transparentBackdrop ? " projects-carousel-night__carousel" : ""}`}
      style={{
        background: transparentBackdrop ? "transparent" : "var(--v3-bg)",
        position: "relative",
      }}
      aria-label={language === "zh" ? "项目 — 分栏视图" : language === "es" ? "Proyectos — vista en columnas" : "Projects — split view"}
    >
      {/* Title row replaces the old [ VIEW 04B / SPLIT ] band — headline follows the active slide */}
      <div
        className="v3-section-header projects-split-section-head"
        style={
          transparentBackdrop ? { background: "transparent", borderBottomColor: "var(--v3-line)" } : undefined
        }
      >
        <div className="projects-split-header-lead" aria-live="polite" aria-atomic="true">
          <span className="projects-split-header-index v3-mono">
            {pad(activeIndex + 1)}&thinsp;/&thinsp;{pad(TOTAL)}
          </span>
          <h2 id={headlineId} className="v3-sh-title projects-split-main-title">
            {activeProject.title}
          </h2>
        </div>
        <span className="v3-sh-num v3-serif projects-split-head-aside" style={{ fontStyle: "italic" }} aria-hidden="true">
          {activeProject.ghost}
        </span>
      </div>

      <div
        className="projects-split-parent-body"
        aria-roledescription="carousel"
        aria-label={language === "zh" ? "项目媒体轮播" : language === "es" ? "Carrusel de medios del proyecto" : "Project media carousel"}
        aria-labelledby={headlineId}
      >
        <div className="projects-split-parent-left">
          <SplitCopyColumn key={activeProject.id} project={activeProject} language={language} />
        </div>

        <div className="projects-split-parent-right">
          <div className="v3-carousel-viewport-shell projects-split-media-shell">
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label={t("previousProject", language)}
              className="v3-carousel-arrow v3-carousel-edge-btn v3-carousel-edge-btn-prev"
              style={{
                opacity: canScrollPrev ? 1 : 0.28,
                cursor: canScrollPrev ? "pointer" : "not-allowed",
              }}
            >
              <ChevronLeft className="size-6 shrink-0" strokeWidth={1.85} aria-hidden />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label={t("nextProject", language)}
              className="v3-carousel-arrow v3-carousel-edge-btn v3-carousel-edge-btn-next"
              style={{
                opacity: canScrollNext ? 1 : 0.28,
                cursor: canScrollNext ? "pointer" : "not-allowed",
              }}
            >
              <ChevronRight className="size-6 shrink-0" strokeWidth={1.85} aria-hidden />
            </button>

            <div
              ref={setViewportRef}
              className="projects-split-embla-root"
              style={{ overflow: "hidden", padding: "clamp(0.85rem, 2vw, 1.35rem) clamp(2.5rem, 8vw, 4.25rem) clamp(1rem, 3vw, 1.65rem)" }}
            >
              <div className="projects-split-track">
                {PROJECTS.map((project, i) => (
                  <article
                    key={project.id}
                    className="projects-split-slide"
                    style={{
                      flex: "0 0 100%",
                      minWidth: 0,
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <SplitMediaSlide
                      project={project}
                      isActive={i === activeIndex}
                      videoRef={(el) => {
                        videoRefs.current[i] = el;
                      }}
                    />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="v3-carousel-controls-bar"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(120px, 320px) max-content",
          alignItems: "center",
          gap: "clamp(1rem, 3vw, 2rem)",
          padding: "1.25rem clamp(1.5rem, 6vw, 5rem) 2.25rem",
          borderTop: "1px solid var(--v3-line)",
        }}
      >
        <div
          className="v3-carousel-progress-wrap v3-carousel-progress-wrap--footer"
          aria-hidden="true"
          role="presentation"
          style={{
            gridColumn: 2,
            justifySelf: "center",
            width: "100%",
            maxWidth: 320,
          }}
        >
          <motion.div
            className="v3-carousel-progress-fill"
            animate={{ scaleX: progress }}
            initial={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{ transformOrigin: "left center" }}
          />
        </div>

        <span
          className={`v3-display${transparentBackdrop ? " projects-carousel-night-counter" : ""}`}
          aria-live="polite"
          style={{
            gridColumn: 3,
            justifySelf: "end",
            fontSize: "clamp(1rem, 1.6vw, 1.25rem)",
            ...(!transparentBackdrop ? { color: "var(--v3-gold)" } : {}),
            letterSpacing: "0.08em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pad(activeIndex + 1)}&thinsp;/&thinsp;{pad(TOTAL)}
        </span>
      </div>
    </section>
  );
}
