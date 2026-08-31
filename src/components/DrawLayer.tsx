// Freehand stylus drawing over the scripture text.
//
// MOUNTING
//   const readerCol = useRef<HTMLDivElement>(null)
//   ...
//   <div className="readercol" ref={readerCol}>…the chapter…</div>
//   <DrawLayer
//     translation={pos.translation}
//     book={pos.book}
//     chapter={pos.chapter}
//     containerRef={readerCol}
//   />
//
// The canvas is portalled INTO `containerRef.current` and absolutely
// positioned over it, so DrawLayer itself can be mounted anywhere in the tree.
// The container must be a positioned element; if it is still `position: static`
// when we attach, we set `position: relative` on it inline (the only DOM the
// component touches outside its own nodes).
//
// The layer is OFF by default. While off the canvas is `pointer-events: none`,
// so word tapping, verse selection and marking behave exactly as before — the
// strokes are still painted, just inert.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { StrokeRec } from '../lib/db'
import { MARK_COLORS, colorHex } from '../lib/marks'
import {
  strokesForPage, saveStroke, clearPage, undoLastStroke, eraseStrokesAt,
  type StrokeTool
} from '../lib/strokes'

export type DrawTool = StrokeTool | 'eraser'

export interface DrawLayerProps {
  translation: string
  book: number
  chapter: number
  /** The element the canvas overlays — normally the reader's text column. */
  containerRef: { current: HTMLElement | null }
  /** Controlled drawing mode. Omit to let DrawLayer own it (default: off). */
  enabled?: boolean
  onEnabledChange?: (on: boolean) => void
  /** Set false to hide the built-in toolbar and drive the layer yourself. */
  showToolbar?: boolean
}

/* Pen weights, normalised to the column width (see lib/strokes.ts).
   On a 700px column these come out at roughly 2.4 / 4.2 / 7.7 px. */
const WIDTHS = [0.0035, 0.006, 0.011]
const MARKER_FACTOR = 3.4
const MARKER_ALPHA = 0.32
const ERASER_RADIUS = 0.014          // normalised eraser tip
/** After the pen lifts, keep ignoring touch briefly — that is the palm. */
const PEN_GRACE_MS = 600

const NO_STROKES: StrokeRec[] = []

const K = {
  tool: 'mvb-draw-tool',
  color: 'mvb-draw-color',
  width: 'mvb-draw-width',
  finger: 'mvb-draw-finger'
}

function readLS(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
function writeLS(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private mode */ }
}

/** Pressure -> width multiplier. Devices that report 0 get a constant width. */
function pressureFactor(pressure: number): number {
  if (!pressure || pressure <= 0) return 1
  return 0.45 + 0.95 * Math.min(pressure, 1)
}

export default function DrawLayer({
  translation, book, chapter, containerRef,
  enabled, onEnabledChange, showToolbar = true
}: DrawLayerProps) {
  const [selfOn, setSelfOn] = useState(false)
  const on = enabled ?? selfOn
  const setOn = useCallback((next: boolean) => {
    if (enabled === undefined) setSelfOn(next)
    onEnabledChange?.(next)
  }, [enabled, onEnabledChange])

  const [tool, setTool] = useState<DrawTool>(() => {
    const t = readLS(K.tool, 'pen')
    return t === 'marker' || t === 'eraser' ? t : 'pen'
  })
  const [colorId, setColorId] = useState(() => readLS(K.color, 'blue'))
  const [widthIdx, setWidthIdx] = useState(() => {
    const n = parseInt(readLS(K.width, '1'), 10)
    return n >= 0 && n < WIDTHS.length ? n : 1
  })
  const [allowFinger, setAllowFinger] = useState(() => readLS(K.finger, '0') === '1')

  useEffect(() => { writeLS(K.tool, tool) }, [tool])
  useEffect(() => { writeLS(K.color, colorId) }, [colorId])
  useEffect(() => { writeLS(K.width, String(widthIdx)) }, [widthIdx])
  useEffect(() => { writeLS(K.finger, allowFinger ? '1' : '0') }, [allowFinger])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)

  // The container may mount after us (chapter still loading), so re-check every
  // render; setState bails out once it settles.
  useLayoutEffect(() => { setHost(containerRef.current ?? null) })

  const loaded = useLiveQuery(
    () => (translation ? strokesForPage(translation, book, chapter) : Promise.resolve(NO_STROKES)),
    [translation, book, chapter]
  )
  // Stable identity while loading, so the repaint effect does not spin.
  const strokes = loaded ?? NO_STROKES

  /* ---- mutable mirrors, so the native listeners never need re-binding ---- */
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const strokesRef = useRef<StrokeRec[]>([])
  strokesRef.current = strokes
  const cfg = useRef({ on, tool, colorId, widthIdx, allowFinger, translation, book, chapter })
  cfg.current = { on, tool, colorId, widthIdx, allowFinger, translation, book, chapter }

  const liveRef = useRef<number[]>([])            // normalised points, in flight
  const pressSumRef = useRef(0)
  const pressCountRef = useRef(0)
  const activeIdRef = useRef<number | null>(null)
  const activeTypeRef = useRef<string>('')
  const penDownRef = useRef(false)
  const penUpAtRef = useRef(0)

  /* ------------------------------ painting ------------------------------ */

  const ctxOf = useCallback(() => {
    const cv = canvasRef.current
    return cv ? cv.getContext('2d') : null
  }, [])

  const applyStyle = useCallback((
    ctx: CanvasRenderingContext2D, toolKind: StrokeTool, hex: string, widthPx: number
  ) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = hex
    ctx.lineWidth = Math.max(0.6, widthPx)
    ctx.globalAlpha = toolKind === 'marker' ? MARKER_ALPHA : 1
  }, [])

  const paintStroke = useCallback((ctx: CanvasRenderingContext2D, s: StrokeRec) => {
    const { w } = sizeRef.current
    if (!w || s.points.length < 4) return
    applyStyle(ctx, s.tool, s.color, s.width * w)
    ctx.beginPath()
    ctx.moveTo(s.points[0] * w, s.points[1] * w)
    for (let i = 2; i + 1 < s.points.length; i += 2) ctx.lineTo(s.points[i] * w, s.points[i + 1] * w)
    ctx.stroke()
    ctx.globalAlpha = 1
  }, [applyStyle])

  const redraw = useCallback(() => {
    const ctx = ctxOf()
    const { w, h } = sizeRef.current
    if (!ctx || !w) return
    ctx.clearRect(0, 0, w, h)
    for (const s of strokesRef.current) paintStroke(ctx, s)
    // Keep an in-flight stroke on screen if something else forced a repaint.
    const live = liveRef.current
    if (live.length >= 4) {
      const c = cfg.current
      const drawTool: StrokeTool = c.tool === 'marker' ? 'marker' : 'pen'
      const base = WIDTHS[c.widthIdx] * (drawTool === 'marker' ? MARKER_FACTOR : 1)
      applyStyle(ctx, drawTool, colorHex(c.colorId), base * w)
      ctx.beginPath()
      ctx.moveTo(live[0] * w, live[1] * w)
      for (let i = 2; i + 1 < live.length; i += 2) ctx.lineTo(live[i] * w, live[i + 1] * w)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [ctxOf, paintStroke, applyStyle])

  /** Size the bitmap to the container at device resolution, then repaint. */
  const fit = useCallback(() => {
    const el = containerRef.current
    const cv = canvasRef.current
    if (!el || !cv) return
    const w = el.clientWidth
    const h = Math.max(el.clientHeight, el.scrollHeight)
    if (!w || !h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr)
    // Assigning width/height clears the bitmap, so only do it when it changed.
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh }
    cv.style.width = `${w}px`
    cv.style.height = `${h}px`
    const ctx = cv.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    sizeRef.current = { w, h, dpr }
    redraw()
  }, [containerRef, redraw])

  // Attach to the host: guarantee a positioning context, then track its size.
  useLayoutEffect(() => {
    if (!host) return
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
    fit()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit)
      return () => window.removeEventListener('resize', fit)
    }
    const ro = new ResizeObserver(() => fit())
    ro.observe(host)
    return () => ro.disconnect()
  }, [host, fit])

  // Chapter switched or a stroke was added/erased/synced: repaint.
  useEffect(() => { fit() }, [strokes, translation, book, chapter, fit])

  /* ----------------------------- input ----------------------------- */

  const pointAt = useCallback((clientX: number, clientY: number) => {
    const cv = canvasRef.current
    if (!cv) return null
    const r = cv.getBoundingClientRect()
    const w = sizeRef.current.w || r.width
    if (!w) return null
    return { x: (clientX - r.left) / w, y: (clientY - r.top) / w }
  }, [])

  const abortLive = useCallback(() => {
    liveRef.current = []
    pressSumRef.current = 0
    pressCountRef.current = 0
    activeIdRef.current = null
    activeTypeRef.current = ''
    redraw()
  }, [redraw])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const baseWidthNorm = () => WIDTHS[cfg.current.widthIdx] *
      (cfg.current.tool === 'marker' ? MARKER_FACTOR : 1)

    const eraseHere = (clientX: number, clientY: number) => {
      const p = pointAt(clientX, clientY)
      if (!p) return
      void eraseStrokesAt(strokesRef.current, p.x, p.y, ERASER_RADIUS)
    }

    /** Draw just the newest segment — no full repaint mid-stroke (e-ink). */
    const extend = (clientX: number, clientY: number, pressure: number) => {
      const p = pointAt(clientX, clientY)
      const ctx = ctxOf()
      const { w } = sizeRef.current
      if (!p || !ctx || !w) return
      const pts = liveRef.current
      const drawTool: StrokeTool = cfg.current.tool === 'marker' ? 'marker' : 'pen'
      if (pts.length >= 2) {
        const px = pts[pts.length - 2], py = pts[pts.length - 1]
        // Skip sub-pixel jitter; keeps stored strokes small.
        if (Math.abs(p.x - px) * w < 0.4 && Math.abs(p.y - py) * w < 0.4) return
        const factor = drawTool === 'pen' ? pressureFactor(pressure) : 1
        applyStyle(ctx, drawTool, colorHex(cfg.current.colorId), baseWidthNorm() * factor * w)
        ctx.beginPath()
        ctx.moveTo(px * w, py * w)
        ctx.lineTo(p.x * w, p.y * w)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      pts.push(p.x, p.y)
      if (pressure > 0) { pressSumRef.current += pressure; pressCountRef.current++ }
    }

    const onDown = (e: PointerEvent) => {
      const c = cfg.current
      if (!c.on || !c.translation) return

      if (e.pointerType === 'pen') {
        penDownRef.current = true
        // A palm usually lands before the nib: drop whatever it started.
        if (activeIdRef.current !== null && activeTypeRef.current === 'touch') abortLive()
      } else if (e.pointerType === 'touch') {
        if (!c.allowFinger) return
        if (penDownRef.current || Date.now() - penUpAtRef.current < PEN_GRACE_MS) return
      }
      if (activeIdRef.current !== null) return          // one stroke at a time
      if (e.button > 0) return

      e.preventDefault()
      activeIdRef.current = e.pointerId
      activeTypeRef.current = e.pointerType
      try { cv.setPointerCapture(e.pointerId) } catch { /* capture is optional */ }

      if (c.tool === 'eraser') { eraseHere(e.clientX, e.clientY); return }
      liveRef.current = []
      pressSumRef.current = 0
      pressCountRef.current = 0
      extend(e.clientX, e.clientY, e.pressure)
    }

    const onMove = (e: PointerEvent) => {
      if (activeIdRef.current !== e.pointerId) return
      e.preventDefault()
      if (cfg.current.tool === 'eraser') { eraseHere(e.clientX, e.clientY); return }
      // High-rate styluses report several samples per frame.
      let batch: PointerEvent[] = [e]
      if (typeof e.getCoalescedEvents === 'function') {
        const co = e.getCoalescedEvents()
        if (co && co.length) batch = co as PointerEvent[]
      }
      for (const ev of batch) extend(ev.clientX, ev.clientY, ev.pressure)
    }

    const finish = async () => {
      const pts = liveRef.current
      const c = cfg.current
      liveRef.current = []
      activeIdRef.current = null
      activeTypeRef.current = ''
      if (c.tool === 'eraser' || pts.length < 2) return
      const drawTool: StrokeTool = c.tool === 'marker' ? 'marker' : 'pen'
      // The schema stores one width per stroke, so the pressure that shaped the
      // live line is folded into a single mean weight (see report/README note).
      const mean = pressCountRef.current ? pressSumRef.current / pressCountRef.current : 0
      const factor = drawTool === 'pen' ? pressureFactor(mean) : 1
      await saveStroke({
        translation: c.translation,
        book: c.book,
        chapter: c.chapter,
        tool: drawTool,
        color: colorHex(c.colorId),
        width: baseWidthNorm() * factor,
        points: pts
      })
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'pen') { penDownRef.current = false; penUpAtRef.current = Date.now() }
      if (activeIdRef.current !== e.pointerId) return
      try { cv.releasePointerCapture(e.pointerId) } catch { /* already released */ }
      void finish()
    }

    const onCancel = (e: PointerEvent) => {
      if (e.pointerType === 'pen') { penDownRef.current = false; penUpAtRef.current = Date.now() }
      if (activeIdRef.current !== e.pointerId) return
      abortLive()
    }

    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerup', onUp)
    cv.addEventListener('pointercancel', onCancel)
    return () => {
      cv.removeEventListener('pointerdown', onDown)
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerup', onUp)
      cv.removeEventListener('pointercancel', onCancel)
    }
  }, [host, abortLive, applyStyle, ctxOf, pointAt])

  /* ----------------------------- actions ----------------------------- */

  const undo = useCallback(async () => {
    await undoLastStroke(translation, book, chapter)
  }, [translation, book, chapter])

  const clearAll = useCallback(async () => {
    if (!strokesRef.current.length) return
    const n = strokesRef.current.length
    if (!window.confirm(`Erase all ${n} drawing${n === 1 ? '' : 's'} on this page?`)) return
    await clearPage(translation, book, chapter)
  }, [translation, book, chapter])

  const hex = useMemo(() => colorHex(colorId), [colorId])
  const canvas = host
    ? createPortal(
        <canvas
          ref={canvasRef}
          className={`dl-canvas ${on ? "dl-live" : ""}`}
          aria-hidden={!on}
          data-drawlayer={on ? 'on' : 'off'}
        />,
        host
      )
    : null

  return (
    <>
      {canvas}
      {showToolbar && (
        <div className="dl-bar no-print">
          <button
            className={`btn small ${on ? '' : 'secondary'}`}
            onClick={() => setOn(!on)}
            aria-pressed={on}
            title="Draw freehand over the page"
          >✏️ Draw</button>

          {on && (
            <>
              <span className="dl-sep" />
              <button
                className={`btn small markbtn ${tool === 'pen' ? 'dl-sel' : ''}`}
                onClick={() => setTool('pen')} title="Pen" aria-label="Pen"
              >✒︎</button>
              <button
                className={`btn small markbtn ${tool === 'marker' ? 'dl-sel' : ''}`}
                onClick={() => setTool('marker')} title="Marker" aria-label="Marker"
              >▨</button>
              <button
                className={`btn small markbtn ${tool === 'eraser' ? 'dl-sel' : ''}`}
                onClick={() => setTool('eraser')} title="Eraser" aria-label="Eraser"
              >⌫</button>

              <span className="dl-sep" />
              {MARK_COLORS.map(c => (
                <button
                  key={c.id}
                  className={`swatch ${colorId === c.id ? 'active' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setColorId(c.id)}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}

              <span className="dl-sep" />
              {WIDTHS.map((_, i) => (
                <button
                  key={i}
                  className={`dl-width ${widthIdx === i ? 'active' : ''}`}
                  onClick={() => setWidthIdx(i)}
                  title={['Fine', 'Medium', 'Bold'][i]}
                  aria-label={['Fine', 'Medium', 'Bold'][i]}
                >
                  <span style={{ background: hex, height: 2 + i * 3 }} />
                </button>
              ))}

              <span className="dl-sep" />
              <button className="btn secondary small" onClick={() => void undo()}>Undo</button>
              <button className="btn secondary small" onClick={() => void clearAll()}>Clear page</button>
              <label className="dl-finger small" title="Let a fingertip draw too (off keeps the palm out)">
                <input
                  type="checkbox"
                  checked={allowFinger}
                  onChange={e => setAllowFinger(e.target.checked)}
                />
                Finger
              </label>
            </>
          )}
        </div>
      )}
    </>
  )
}
