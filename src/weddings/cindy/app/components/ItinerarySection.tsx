"use client";

import ItineraryItemCard from './ItineraryItemCard';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface ItineraryItem {
  time: string;
  displayTime: string;
  title: string;
  description: string;
  location?: string;
}

interface TimelineMetrics {
  top: number;
  height: number;
  centers: number[];
}

// ═══════════════════════════════════════════════════════════════════
//  PETAL CANVAS
//  Pétalos minimalistas (lágrima bezier) cayendo con drift sinusoidal.
//  Se activan al entrar la sección en viewport y pausan al salir.
//  pointer-events: none, z-index 5 (entre fondo z-3 y contenido z-10).
// ═══════════════════════════════════════════════════════════════════

const PETAL_COUNT  = 280
const PETAL_COLORS = ['#f4b8c8', '#f0a0b8', '#fad4df', '#e8899e', '#f7c9d4']
const PETAL_ALPHA  = 0.14

const LEAF_COUNT  = 90
const LEAF_COLORS = ['#8aab8c', '#7a9e7e', '#a5c1a7', '#6b8f6e', '#b2c9b4']
const LEAF_ALPHA  = 0.16

interface Petal {
  x: number; y: number
  vx: number; vy: number
  size: number
  ratio: number
  angle: number
  spin: number
  swayAmp: number
  swayFreq: number
  swayOffset: number
  colorIdx: number
  time: number
}

interface Leaf {
  x: number; y: number
  vx: number; vy: number
  size: number
  ratio: number
  angle: number
  spin: number
  swayAmp: number
  swayFreq: number
  swayOffset: number
  colorIdx: number
  time: number
}

function makePetal(W: number, H: number, init: boolean): Petal {
  return {
    x:          init ? Math.random() * W : -15 + Math.random() * (W + 30),
    y:          init ? Math.random() * H : -20,
    vx:         (Math.random() - 0.5) * 0.3,
    vy:         0.3 + Math.random() * 0.5,
    size:       6.875 + Math.random() * 12.375,
    ratio:      0.32 + Math.random() * 0.28,
    angle:      Math.random() * Math.PI * 2,
    spin:       (Math.random() - 0.5) * 0.022,
    swayAmp:    16 + Math.random() * 26,
    swayFreq:   0.005 + Math.random() * 0.007,
    swayOffset: Math.random() * Math.PI * 2,
    colorIdx:   Math.floor(Math.random() * PETAL_COLORS.length),
    time:       Math.random() * 1000,
  }
}

function makeLeaf(W: number, H: number, init: boolean): Leaf {
  return {
    x:          init ? Math.random() * W : -15 + Math.random() * (W + 30),
    y:          init ? Math.random() * H : -20,
    vx:         (Math.random() - 0.5) * 0.25,
    vy:         0.22 + Math.random() * 0.38,
    size:       7 + Math.random() * 11,
    ratio:      0.38 + Math.random() * 0.24,
    angle:      Math.random() * Math.PI * 2,
    spin:       (Math.random() - 0.5) * 0.016,
    swayAmp:    12 + Math.random() * 22,
    swayFreq:   0.004 + Math.random() * 0.005,
    swayOffset: Math.random() * Math.PI * 2,
    colorIdx:   Math.floor(Math.random() * LEAF_COLORS.length),
    time:       Math.random() * 1000,
  }
}

function tickPetal(p: Petal, dt: number, H: number): boolean {
  p.time  += dt
  p.angle += p.spin * dt
  p.x     += p.vx * dt + Math.sin(p.time * p.swayFreq + p.swayOffset) * 0.3
  p.y     += p.vy * dt
  return p.y > H + 25
}

function tickLeaf(l: Leaf, dt: number, H: number): boolean {
  l.time  += dt
  l.angle += l.spin * dt
  l.x     += l.vx * dt + Math.sin(l.time * l.swayFreq + l.swayOffset) * 0.25
  l.y     += l.vy * dt
  return l.y > H + 25
}

function paintPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  const a = p.size
  const b = p.size * p.ratio
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.angle)
  ctx.beginPath()
  ctx.moveTo(0, -a)
  ctx.bezierCurveTo( b * 1.15, -a * 0.45,  b,  a * 0.35,  0,  a * 0.55)
  ctx.bezierCurveTo(-b,         a * 0.35, -b * 1.15, -a * 0.45, 0, -a)
  ctx.fillStyle = PETAL_COLORS[p.colorIdx]
  ctx.fill()
  ctx.restore()
}

function paintLeaf(ctx: CanvasRenderingContext2D, l: Leaf) {
  const a = l.size
  const b = l.size * l.ratio
  ctx.save()
  ctx.translate(l.x, l.y)
  ctx.rotate(l.angle)
  // Leaf body: pointed at both ends (classic leaf silhouette)
  ctx.beginPath()
  ctx.moveTo(0, -a)
  ctx.bezierCurveTo( b, -a * 0.3,  b,  a * 0.3,  0,  a)
  ctx.bezierCurveTo(-b,  a * 0.3, -b, -a * 0.3,  0, -a)
  ctx.fillStyle = LEAF_COLORS[l.colorIdx]
  ctx.fill()
  // Center vein
  ctx.beginPath()
  ctx.moveTo(0, -a * 0.85)
  ctx.lineTo(0,  a * 0.85)
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 0.6
  ctx.stroke()
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENTE
// ═══════════════════════════════════════════════════════════════════

export default function ItinerarySection() {
  const containerRef    = useRef<HTMLDivElement>(null)
  const cardsRef        = useRef<HTMLDivElement>(null)
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([])
  const sectionRef      = useRef<HTMLElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const rafRef          = useRef<number>(0)
  const petalsRef       = useRef<Petal[]>([])
  const leavesRef       = useRef<Leaf[]>([])
  const lastTimeRef     = useRef<number>(0)
  const activeRef       = useRef(false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [timelineMetrics, setTimelineMetrics] = useState<TimelineMetrics>({
    top: 0,
    height: 0,
    centers: [],
  })

  // ── card activa por scroll ────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight
      let maxVis = -1, newActive = 0
      cardWrapperRefs.current.forEach((ref, i) => {
        if (!ref) return
        const r   = ref.getBoundingClientRect()
        const vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
        const ratio = r.height > 0 ? vis / r.height : 0
        if (ratio > maxVis) { maxVis = ratio; newActive = i }
      })
      setActiveIndex(newActive)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // ── loop RAF ──────────────────────────────────────────────────────
  const loop = useCallback((now: number) => {
    if (!activeRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dt  = Math.min((now - lastTimeRef.current) / 16.67, 3)
    lastTimeRef.current = now

    const dpr = window.devicePixelRatio || 1
    const W   = canvas.width  / dpr
    const H   = canvas.height / dpr

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    ctx.globalAlpha = PETAL_ALPHA
    for (let i = 0; i < petalsRef.current.length; i++) {
      if (tickPetal(petalsRef.current[i], dt, H)) {
        petalsRef.current[i] = makePetal(W, H, false)
      }
      paintPetal(ctx, petalsRef.current[i])
    }

    ctx.globalAlpha = LEAF_ALPHA
    for (let i = 0; i < leavesRef.current.length; i++) {
      if (tickLeaf(leavesRef.current[i], dt, H)) {
        leavesRef.current[i] = makeLeaf(W, H, false)
      }
      paintLeaf(ctx, leavesRef.current[i])
    }

    ctx.restore()
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const startPetals = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || activeRef.current) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    canvas.width  = W * dpr
    canvas.height = H * dpr
    petalsRef.current   = Array.from({ length: PETAL_COUNT }, () => makePetal(W, H, true))
    leavesRef.current   = Array.from({ length: LEAF_COUNT  }, () => makeLeaf(W, H, true))
    activeRef.current   = true
    lastTimeRef.current = performance.now()
    rafRef.current      = requestAnimationFrame(loop)
  }, [loop])

  const stopPetals = useCallback(() => {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
  }, [])

  // ── resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !activeRef.current) return
      const dpr = window.devicePixelRatio || 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── IntersectionObserver ──────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startPetals()
        else stopPetals()
      },
      { threshold: 0.05 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => { observer.disconnect(); stopPetals() }
  }, [startPetals, stopPetals])

  // ── data ──────────────────────────────────────────────────────────
  const itineraryItems: ItineraryItem[] = useMemo(() => [
    { time: "4:30 PM", displayTime: "4:30", title: "Misa",                   description: "", location: "" },
    { time: "6:00 PM", displayTime: "6:00", title: "Cocktail de Bienvenida", description: "", location: "" },
    { time: "6:30 PM", displayTime: "6:30", title: "Ceremonia Civil",        description: "", location: "" },
    { time: "7:30 PM", displayTime: "7:30", title: "Recepción",              description: "", location: "" },
  ], [])

  // ── mide la línea central a partir del centro real de cada card ─────
  useEffect(() => {
    const measureTimeline = () => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const centers = cardWrapperRefs.current
        .map((ref) => {
          if (!ref) return null
          const rect = ref.getBoundingClientRect()
          return rect.top - containerRect.top + rect.height / 2
        })
        .filter((center): center is number => center !== null)

      if (centers.length === 0) return

      const top = centers[0]
      const height = Math.max(centers[centers.length - 1] - centers[0], 0)

      setTimelineMetrics((prev) => {
        const sameCenters =
          prev.centers.length === centers.length &&
          prev.centers.every((center, index) => Math.abs(center - centers[index]) < 0.5)

        if (sameCenters && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.height - height) < 0.5) {
          return prev
        }

        return { top, height, centers }
      })
    }

    measureTimeline()

    const resizeObserver = new ResizeObserver(() => {
      measureTimeline()
    })

    if (containerRef.current) resizeObserver.observe(containerRef.current)
    cardWrapperRefs.current.forEach((ref) => {
      if (ref) resizeObserver.observe(ref)
    })

    window.addEventListener('resize', measureTimeline)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureTimeline)
    }
  }, [itineraryItems])

  // ── render ────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      className="min-h-screen w-full bg-white pt-0 pb-14 sm:pt-8 sm:pb-20 md:py-24 px-4 md:px-8 relative transition-all duration-1000 ease-in-out"
    >
      {/* Fondo radial sutil */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ zIndex: 3 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196,152,91,0.15) 0%, transparent 60%),
                              radial-gradient(circle at 70% 60%, rgba(139,115,85,0.12) 0%, transparent 60%),
                              radial-gradient(circle at 50% 90%, rgba(180,147,113,0.1) 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* ── Canvas de pétalos ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {/* ── Contenido ── */}
      <div className="max-w-6xl mx-auto relative pt-14 md:pt-4" style={{ zIndex: 10 }}>

        <div
          className="text-center mb-10 sm:mb-12 md:mb-16 transition-all duration-2000 ease-out opacity-100 translate-y-0"
          style={{ transitionDelay: '200ms' }}
        >
          <div className="itinerary-heading">
            <div className="itinerary-heading__title-shell">
              <h2 className="itinerary-heading__title">
                Itinerario
              </h2>
            </div>

            <div className="itinerary-heading__floral md:mb-12" aria-hidden="true">
              <svg viewBox="0 0 120 36" className="itinerary-heading__branch itinerary-heading__branch--left">
                <path d="M116 18C92 18 81 12 66 4C60 1 55 1 49 7" />
                <path d="M78 14C74 10 69 8 64 8" />
                <path d="M56 18C51 13 45 12 39 13" />
                <path d="M37 22C31 19 24 19 18 22" />
                <ellipse cx="62" cy="8" rx="4" ry="2.2" transform="rotate(-26 62 8)" />
                <ellipse cx="39" cy="13" rx="4.6" ry="2.3" transform="rotate(-12 39 13)" />
                <ellipse cx="18" cy="22" rx="4.2" ry="2.1" transform="rotate(10 18 22)" />
              </svg>

              <svg viewBox="0 0 42 42" className="itinerary-heading__flower">
                <circle cx="21" cy="21" r="2.4" />
                <ellipse cx="21" cy="11.5" rx="3.3" ry="6.1" />
                <ellipse cx="21" cy="30.5" rx="3.3" ry="6.1" />
                <ellipse cx="11.5" cy="21" rx="6.1" ry="3.3" />
                <ellipse cx="30.5" cy="21" rx="6.1" ry="3.3" />
                <ellipse cx="14.3" cy="14.3" rx="5.2" ry="3" transform="rotate(-45 14.3 14.3)" />
                <ellipse cx="27.7" cy="14.3" rx="5.2" ry="3" transform="rotate(45 27.7 14.3)" />
                <ellipse cx="14.3" cy="27.7" rx="5.2" ry="3" transform="rotate(45 14.3 27.7)" />
                <ellipse cx="27.7" cy="27.7" rx="5.2" ry="3" transform="rotate(-45 27.7 27.7)" />
              </svg>

              <svg viewBox="0 0 120 36" className="itinerary-heading__branch itinerary-heading__branch--right">
                <path d="M4 18C28 18 39 12 54 4C60 1 65 1 71 7" />
                <path d="M42 14C46 10 51 8 56 8" />
                <path d="M64 18C69 13 75 12 81 13" />
                <path d="M83 22C89 19 96 19 102 22" />
                <ellipse cx="58" cy="8" rx="4" ry="2.2" transform="rotate(26 58 8)" />
                <ellipse cx="81" cy="13" rx="4.6" ry="2.3" transform="rotate(12 81 13)" />
                <ellipse cx="102" cy="22" rx="4.2" ry="2.1" transform="rotate(-10 102 22)" />
              </svg>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="max-w-4xl mx-auto relative ">
          {/* Línea vertical desktop */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-px transition-all duration-500 opacity-60 hidden md:block"
            style={{
              backgroundColor: '#C4985B',
              top: `${timelineMetrics.top}px`,
              height: `${timelineMetrics.height}px`,
              zIndex: 1,
            }}
          />
          {/* Línea vertical mobile */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-px transition-all duration-500 opacity-40 bg-gradient-to-b from-[#C4985B] via-[#8B7355] to-[#C4985B] md:hidden"
            style={{
              top: `${timelineMetrics.top}px`,
              height: `${timelineMetrics.height}px`,
              zIndex: 1,
            }}
          />

          {/* Dots mobile */}
          <div className="md:hidden">
            {timelineMetrics.centers.map((center, index) => (
              <div
                key={index}
                className="absolute left-1/2 w-4 h-4 z-10"
                style={{ top: `${center}px`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-full h-full rounded-full border-2 shadow-lg transition-colors duration-500 bg-white border-[#947e63]/60">
                  <div className="absolute inset-1 rounded-full transition-colors duration-500 bg-[#947e63]/40" />
                </div>
              </div>
            ))}
          </div>

          <div ref={cardsRef} className="space-y-16 sm:space-y-20 md:space-y-32 relative z-10">
            {itineraryItems.map((item, index) => (
              <div
                key={index}
                ref={(el) => { cardWrapperRefs.current[index] = el }}
              >
                <ItineraryItemCard item={item} index={index} isActive={index === activeIndex} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .celestial-transition { transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .itinerary-heading {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 1.2rem 1rem 0;
          max-width: min(92vw, 42rem);
        }
        .itinerary-heading__title-shell {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 1.5rem 0.12rem;
          isolation: isolate;
        }
        .itinerary-heading__title {
          position: relative;
          margin: 0;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.35rem, 6.2vw, 4rem);
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8B7355;
          line-height: 1;
        }
        .itinerary-heading__floral {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          width: min(100%, 29rem);
          color: rgba(196, 152, 91, 0.68);
        }
        .itinerary-heading__branch,
        .itinerary-heading__flower {
          display: block;
          flex-shrink: 0;
        }
        .itinerary-heading__branch {
          width: clamp(6.5rem, 18vw, 8.75rem);
          height: auto;
          overflow: visible;
        }
        .itinerary-heading__branch path,
        .itinerary-heading__branch ellipse {
          fill: none;
          stroke: currentColor;
          stroke-width: 1.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .itinerary-heading__branch ellipse {
          fill: rgba(196, 152, 91, 0.1);
        }
        .itinerary-heading__flower {
          width: 2rem;
          height: 2rem;
          color: rgba(196, 152, 91, 0.72);
          filter: drop-shadow(0 4px 12px rgba(139, 115, 85, 0.08));
        }
        .itinerary-heading__flower circle,
        .itinerary-heading__flower ellipse {
          fill: currentColor;
          opacity: 0.9;
        }
        .itinerary-heading__flower circle {
          fill: rgba(139, 115, 85, 0.82);
        }
        .itinerary-heading__branch--left,
        .itinerary-heading__branch--right {
          opacity: 0.9;
        }
        @keyframes floralDrift {
          0%,100% { transform: translateY(0px); opacity: 0.88; }
          50% { transform: translateY(-2px); opacity: 1; }
        }
        .itinerary-heading__floral {
          animation: floralDrift 5.5s ease-in-out infinite;
        }
        .itinerary-heading__rule {
          flex: 1;
          min-width: 2.5rem;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(196, 152, 91, 0.5) 50%, transparent 100%);
        }
        .itinerary-heading__dot {
          width: 0.32rem;
          height: 0.32rem;
          border-radius: 999px;
          background: rgba(196, 152, 91, 0.55);
          box-shadow: 0 0 0 5px rgba(196, 152, 91, 0.08);
        }
        .itinerary-heading__dot--center {
          width: 0.5rem;
          height: 0.5rem;
          background: rgba(139, 115, 85, 0.72);
        }
        @keyframes celestial-float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          25%      { transform: translateY(-8px) rotate(1deg); }
          50%      { transform: translateY(-12px) rotate(0deg); }
          75%      { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes fade-celestial {
          0%,100% { opacity: 0.8; }
          50%      { opacity: 1; }
        }
        @keyframes sun-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-celestial-float { animation: celestial-float 6s ease-in-out infinite; }
        .animate-fade-celestial  { animation: fade-celestial 4s ease-in-out infinite; }
        .animate-sun-rotate      { animation: sun-rotate 20s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          canvas { display: none !important; }
        }
        @media (max-width: 640px) {
          .itinerary-heading {
            width: 100%;
            padding-inline: 0.2rem;
          }
          .itinerary-heading__title {
            letter-spacing: 0.14em;
          }
          .itinerary-heading__floral {
            gap: 0.2rem;
            width: 100%;
          }
          .itinerary-heading__branch {
            width: min(30vw, 6.2rem);
          }
          .itinerary-heading__flower {
            width: 1.5rem;
            height: 1.5rem;
          }
        }
      `}</style>
    </section>
  )
}
