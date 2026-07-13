"use client"

import { useEffect, useState, useRef, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════════════
// LETTER-WRITING ANIMATION + SWALLOW BIRDS (Canvas)
// ───────────────────────────────────────────────────────────────────────
// Golondrinas dibujadas con bezier curves en Canvas <2D>, opacas,
// entrando desde el viewport cuando la sección es visible.
// El mismo IntersectionObserver que dispara el texto arranca el loop.
// Canvas tiene pointer-events: none y z-index entre el fondo y el texto.
// ═══════════════════════════════════════════════════════════════════════

const TOTAL_TEXT_RENDER_MS = 2000
const ITEM_ANIMATION_MS    = 220

const QUOTE_LINES = [
  'Con el amor,',
  'la bendición de Dios,',
  'y de nuestros padres.',
]
const QUOTE_WORDS = QUOTE_LINES.join(' ').split(' ')

const BRIDE_HEADING = 'Padres de la novia'
const BRIDE_NAMES   = [
  'María Magdalena Sánchez Ibarra',
  'Jorge Medina López',
]

const GROOM_HEADING = 'Padres del novio'
const GROOM_NAMES   = [
  'Patricia Pérez Hernández',
  'Jorge Alberto González Rodriguez',
]

// ── Swallow config ──────────────────────────────────────────────────────
const BIRD_COUNT  = 9
const BIRD_COLOR  = '#8B7355'   // mismo tono dorado-sepia del texto
const BIRD_ALPHA  = 0.18        // muy tenue para no competir con el texto

// ── Tipos ───────────────────────────────────────────────────────────────
interface Bird {
  x: number
  y: number
  vx: number
  vy: number
  waveAmp: number
  waveFreq: number
  waveOffset: number
  scale: number
  phase: number       // batir de alas [0, 1)
  beatSpeed: number
  time: number
}

function createBird(canvasW: number, canvasH: number, init: boolean): Bird {
  return {
    x:          init ? Math.random() * canvasW : -70,
    y:          40 + Math.random() * (canvasH - 80),
    vx:         2.2 + Math.random() * 3.2,
    vy:         (Math.random() - 0.5) * 0.7,
    waveAmp:    10 + Math.random() * 16,
    waveFreq:   0.007 + Math.random() * 0.009,
    waveOffset: Math.random() * Math.PI * 2,
    scale:      15.6 + Math.random() * 15.6,
    phase:      Math.random(),
    beatSpeed:  0.011 + Math.random() * 0.009,
    time:       Math.random() * 1000,
  }
}

function updateBird(b: Bird, dt: number, canvasH: number): boolean {
  b.time  += dt
  b.phase += b.beatSpeed * dt
  if (b.phase >= 1) b.phase -= 1

  b.x += b.vx  * dt * 0.38
  b.y += b.vy  * dt * 0.38 + Math.sin(b.time * b.waveFreq + b.waveOffset) * 0.35

  if (b.y < 18)           b.vy =  Math.abs(b.vy) * 0.8 + 0.2
  if (b.y > canvasH - 18) b.vy = -Math.abs(b.vy) * 0.8 - 0.2

  return b.x > window.innerWidth + 80
}

function drawSwallow(ctx: CanvasRenderingContext2D, b: Bird) {
  const s    = b.scale
  const beat = Math.sin(b.phase * Math.PI * 2)
  const dip  = beat * s * 0.52
  const sweep = beat * s * 0.1

  ctx.save()
  ctx.translate(b.x, b.y)
  ctx.fillStyle   = BIRD_COLOR
  ctx.strokeStyle = BIRD_COLOR
  ctx.lineWidth   = 0.7

  // Cuerpo
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.26, s * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cola bifurcada
  ctx.beginPath()
  ctx.moveTo(-s * 0.22, s * 0.04)
  ctx.quadraticCurveTo(-s * 0.52, s * 0.26, -s * 0.68, s * 0.20)
  ctx.moveTo(-s * 0.22, s * 0.04)
  ctx.quadraticCurveTo(-s * 0.50, s * 0.15, -s * 0.52, s * 0.06)
  ctx.stroke()

  // Ala izquierda
  ctx.beginPath()
  ctx.moveTo(-s * 0.05, 0)
  ctx.bezierCurveTo(-s * 0.28, -sweep + dip * 0.35, -s * 0.52, dip * 0.75, -s * 0.78, dip)
  ctx.bezierCurveTo(-s * 0.52,  dip * 0.45 + s * 0.11, -s * 0.23, s * 0.08, -s * 0.05, s * 0.04)
  ctx.fill()

  // Ala derecha (espejo)
  ctx.beginPath()
  ctx.moveTo(s * 0.05, 0)
  ctx.bezierCurveTo(s * 0.28, -sweep + dip * 0.35, s * 0.52, dip * 0.75, s * 0.78, dip)
  ctx.bezierCurveTo(s * 0.52,  dip * 0.45 + s * 0.11,  s * 0.23, s * 0.08,  s * 0.05, s * 0.04)
  ctx.fill()

  ctx.restore()
}

// ════════════════════════════════════════════════════════════════════════
//  COMPONENTE
// ════════════════════════════════════════════════════════════════════════
export default function ParentsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const birdsRef   = useRef<Bird[]>([])
  const lastTimeRef = useRef<number>(0)
  const activeRef  = useRef(false)

  const [textStarted, setTextStarted] = useState(false)
  const [birdsVisible, setBirdsVisible] = useState(false)

  // ── Timeline para los delays de animación ──────────────────────────
  const quoteWords        = QUOTE_WORDS
  const brideHeadingChars = BRIDE_HEADING.split('')
  const groomHeadingChars = GROOM_HEADING.split('')
  const brideName0Words   = BRIDE_NAMES[0].split(' ')
  const brideName1Words   = BRIDE_NAMES[1].split(' ')
  const groomName0Words   = GROOM_NAMES[0].split(' ')
  const groomName1Words   = GROOM_NAMES[1].split(' ')

  let cur = 0
  const quoteStart        = cur; cur += quoteWords.length
  const brideHeadingStart = cur; cur += brideHeadingChars.length
  const brideName0Start   = cur; cur += brideName0Words.length
  const brideName1Start   = cur; cur += brideName1Words.length
  const groomHeadingStart = cur; cur += groomHeadingChars.length
  const groomName0Start   = cur; cur += groomName0Words.length
  const groomName1Start   = cur; cur += groomName1Words.length
  const totalUnits        = cur

  const unitDelay = totalUnits > 1
    ? Math.max(0, Math.floor((TOTAL_TEXT_RENDER_MS - ITEM_ANIMATION_MS) / (totalUnits - 1)))
    : 0

  // ── Loop de Canvas ─────────────────────────────────────────────────
  const loop = useCallback((now: number) => {
    if (!activeRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dt = Math.min((now - lastTimeRef.current) / 16.67, 3)
    lastTimeRef.current = now

    const W = canvas.width  / (window.devicePixelRatio || 1)
    const H = canvas.height / (window.devicePixelRatio || 1)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)
    ctx.globalAlpha = BIRD_ALPHA

    for (let i = 0; i < birdsRef.current.length; i++) {
      const dead = updateBird(birdsRef.current[i], dt, H)
      if (dead) birdsRef.current[i] = createBird(W, H, false)
      drawSwallow(ctx, birdsRef.current[i])
    }

    ctx.restore()
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const startBirds = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || activeRef.current) return

    const dpr = window.devicePixelRatio || 1
    const W   = canvas.offsetWidth
    const H   = canvas.offsetHeight
    canvas.width  = W * dpr
    canvas.height = H * dpr

    birdsRef.current = Array.from({ length: BIRD_COUNT }, () => createBird(W, H, true))
    activeRef.current = true
    lastTimeRef.current = performance.now()
    setBirdsVisible(true)
    rafRef.current = requestAnimationFrame(loop)
  }, [loop])

  const stopBirds = useCallback(() => {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !activeRef.current) return
      const dpr = window.devicePixelRatio || 1
      canvas.width  = canvas.offsetWidth  * dpr
      canvas.height = canvas.offsetHeight * dpr
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── IntersectionObserver — mismo trigger para texto y pájaros ──────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTextStarted(true)
          startBirds()
          observer.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '-30px' }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => {
      observer.disconnect()
      stopBirds()
    }
  }, [startBirds, stopBirds])

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <section
      id="padres"
      ref={sectionRef}
      className="w-full relative overflow-hidden min-h-screen"
    >
      <div
        className="ps-col-content min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%)'
        }}
      >
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 20%, rgba(196,152,91,0.15) 0%, transparent 60%),
                                radial-gradient(circle at 70% 60%, rgba(139,115,85,0.12) 0%, transparent 60%),
                                radial-gradient(circle at 50% 90%, rgba(180,147,113,0.1) 0%, transparent 60%)`
            }}
          />
        </div>



        {/* ── Canvas de golondrinas — entre fondo (z-0) y texto (z-10) ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none ps-birds-canvas"
          style={{
            zIndex: 5,
            opacity: birdsVisible ? 1 : 0,
            transition: 'opacity 1.8s ease',
          }}
        />

        {/* ── Contenido textual ── */}
        <div className="relative z-10 text-center px-4 sm:px-5 md:px-10 py-10 sm:py-12 md:py-24 flex flex-col items-center justify-center min-h-screen">

          {/* Quote — palabra a palabra */}
          <div className="flex justify-center items-center mb-8 sm:mb-10 md:mb-12">
            <p className="ps-quote-text">
              {QUOTE_WORDS.map((word, i) => (
                <span key={`q-${i}`}>
                  <span
                    className={`ps-word${textStarted ? ' ps-word--animated' : ''}`}
                    style={{ animationDelay: `${(quoteStart + i) * unitDelay}ms` }}
                  >
                    {word}
                  </span>
                  {word === 'amor,' ? <br /> : word === 'Dios,' ? <br /> : ' '}
                </span>
              ))}
            </p>
          </div>

          {/* Bloques de padres */}
          <div className="w-full max-w-md md:max-w-2xl lg:max-w-6xl mx-auto space-y-7 sm:space-y-8 lg:space-y-0 lg:flex lg:items-start lg:justify-center lg:gap-12">

            {/* Padres de la novia */}
            <div className="text-center lg:flex-[1.2] lg:min-w-0 xl:min-w-[420px]">
              <h3 className="ps-heading-text mb-3 sm:mb-4">
                {brideHeadingChars.map((char, i) => (
                  <span
                    key={`bh-${i}`}
                    className={`ps-letter${textStarted ? ' ps-letter--animated' : ''}`}
                    style={{ animationDelay: `${(brideHeadingStart + i) * unitDelay}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h3>
              <p className="ps-name-text">
                {brideName0Words.map((word, i) => (
                  <span key={`bn0-${i}`}>
                    <span
                      className={`ps-word${textStarted ? ' ps-word--animated' : ''}`}
                      style={{ animationDelay: `${(brideName0Start + i) * unitDelay}ms` }}
                    >
                      {word}
                    </span>
                    {i < brideName0Words.length - 1 && ' '}
                  </span>
                ))}
              </p>
              <p className="ps-name-text">
                {brideName1Words.map((word, i) => (
                  <span key={`bn1-${i}`}>
                    <span
                      className={`ps-word${textStarted ? ' ps-word--animated' : ''}`}
                      style={{ animationDelay: `${(brideName1Start + i) * unitDelay}ms` }}
                    >
                      {word}
                    </span>
                    {i < brideName1Words.length - 1 && ' '}
                  </span>
                ))}
              </p>
            </div>

            {/* Divisor entre grupos */}
            <div
              className={`flex items-center justify-center gap-2 lg:gap-0 lg:flex-col transition-all duration-[350ms] ease-out ${
                textStarted ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="block w-8 h-[0.5px] lg:w-[0.5px] lg:h-8 bg-[#C4985B]/30" />
              <span className="block w-1 h-1 rounded-full bg-[#C4985B]/25" />
              <span className="block w-8 h-[0.5px] lg:w-[0.5px] lg:h-8 bg-[#C4985B]/30" />
            </div>

            {/* Padres del novio */}
            <div className="text-center lg:flex-[1.2] lg:min-w-0 xl:min-w-[420px]">
              <h3 className="ps-heading-text mb-3 sm:mb-4">
                {groomHeadingChars.map((char, i) => (
                  <span
                    key={`gh-${i}`}
                    className={`ps-letter${textStarted ? ' ps-letter--animated' : ''}`}
                    style={{ animationDelay: `${(groomHeadingStart + i) * unitDelay}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h3>
              <p className="ps-name-text">
                {groomName0Words.map((word, i) => (
                  <span key={`gn0-${i}`}>
                    <span
                      className={`ps-word${textStarted ? ' ps-word--animated' : ''}`}
                      style={{ animationDelay: `${(groomName0Start + i) * unitDelay}ms` }}
                    >
                      {word}
                    </span>
                    {i < groomName0Words.length - 1 && ' '}
                  </span>
                ))}
              </p>
              <p className="ps-name-text">
                {groomName1Words.map((word, i) => (
                  <span key={`gn1-${i}`}>
                    <span
                      className={`ps-word${textStarted ? ' ps-word--animated' : ''}`}
                      style={{ animationDelay: `${(groomName1Start + i) * unitDelay}ms` }}
                    >
                      {word}
                    </span>
                    {i < groomName1Words.length - 1 && ' '}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           STYLES
         ═══════════════════════════════════════════════════════════ */}
      <style jsx>{`
        .ps-col-content {
          position: relative;
          width: 100%;
          min-height: 100vh;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Canvas ocupa todo el contenedor sin afectar el layout */
        .ps-birds-canvas {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
        }

        /* Respeto por prefers-reduced-motion: para el canvas
           (el JS verifica esta media query antes de iniciar el loop) */
        @media (prefers-reduced-motion: reduce) {
          .ps-birds-canvas { display: none !important; }
        }

        /* ── Tipografía ── */
        .ps-quote-text {
          font-family: 'Cormorant Garamond', 'EB Garamond', serif;
          font-weight: 300;
          font-size: 1.1rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8B7355;
          line-height: 1.65;
        }
        .ps-heading-text {
          font-family: 'Cormorant Garamond', 'EB Garamond', serif;
          font-size: 1.7rem;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #5c5c5c;
          line-height: 1.1;
          white-space: nowrap;
        }
        .ps-name-text {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1.1rem;
          color: #57534e;
          line-height: 1.45;
          margin-bottom: 0;
        }

        @media (min-width: 640px) {
          .ps-quote-text   { font-size: 1.25rem; }
          .ps-heading-text { font-size: 1.95rem; }
          .ps-name-text    { font-size: 1.3rem; }
        }

        @media (min-width: 768px) {
          .ps-quote-text   { font-size: 1.8rem; }
          .ps-heading-text { font-size: 2.45rem; }
          .ps-name-text    { font-size: 1.7rem; }
        }

        /* ═══ LETTER WRITING ═══ */
        .ps-letter {
          display: inline-block;
          opacity: 0;
        }
        .ps-letter--animated {
          animation: psLetterWrite ${ITEM_ANIMATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes psLetterWrite {
          0%   { opacity: 0; transform: translateY(10px) scaleX(0.4); filter: blur(2px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0)  scaleX(1);   filter: blur(0); }
        }

        /* ═══ WORD WRITING ═══ */
        .ps-word {
          display: inline-block;
          opacity: 0;
        }
        .ps-word--animated {
          animation: psWordWrite ${ITEM_ANIMATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes psWordWrite {
          0%   { opacity: 0; transform: translateY(8px) scaleX(0.6); filter: blur(1.5px); }
          55%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scaleX(1);   filter: blur(0); }
        }
      `}</style>
    </section>
  )
}
