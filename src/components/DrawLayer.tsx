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
  finger: 'mvb-draw-finger',
  drawer: 'mvb-draw-drawer',
  eink: 'mvb-draw-eink'
}

/**
 * E-ink panels refresh slowly, so drawing on them feels laggy in a way no web
 * canvas can fully fix — the browser cannot reach the fast-refresh path the
 * device's own note app uses. What we can do is stop asking the panel to do
 * more work than necessary: a smaller backing store, no pressure-driven width
 * changes, and a coarser sampling step.
 */
function looksLikeEink(): boolean {
  if (typeof navigator === 'undefined') return false
  return /onyx|boox|eink|e-ink|kobo|remarkable|kindle/i.test(navigator.userAgent)
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
  /* Drawer open/closed is independent of drawing mode: closing the tools does
     not put the pen down. */
  const [drawerOpen, setDrawerOpen] = useState(() => readLS(K.drawer, '0') === '1')
  const [eink, setEink] = useState(() => readLS(K.eink, looksLikeEink() ? '1' : '0') === '1')
  const einkRef = useRef(eink)
  einkRef.current = eink

  useEffect(() => { writeLS(K.tool, tool) }, [tool])
  useEffect(() => { writeLS(K.color, colorId) }, [colorId])
  useEffect(() => { writeLS(K.width, String(widthIdx)) }, [widthIdx])
  useEffect(() => { writeLS(K.finger, allowFinger ? '1' : '0') }, [allowFinger])
  useEffect(() => { writeLS(K.drawer, drawerOpen ? '1' : '0') }, [drawerOpen])
  useEffect(() => { writeLS(K.eink, eink ? '1' : '0') }, [eink])

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

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const ctxForRef = useRef<HTMLCanvasElement | null>(null)

  /**
   * The 2D context, created once with `desynchronized: true`.
   *
   * That flag is the low-latency ink path: it lets the browser present canvas
   * updates without waiting for the normal compositing step, which is the
   * single largest code-side win for stylus lag. It only applies to the first
   * getContext call for a canvas, so the context is cached rather than fetched
   * per point.
   */
  const ctxOf = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return null
    if (ctxRef.current && ctxForRef.current === cv) return ctxRef.current
    ctxRef.current = cv.getContext('2d', { desynchronized: true, alpha: true })
    ctxForRef.current = cv
    return ctxRef.current
  }, [])

  const lastStyleRef = useRef('')

  const applyStyle = useCallback((
    ctx: CanvasRenderingContext2D, toolKind: StrokeTool, hex: string, widthPx: number
  ) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = hex
    ctx.lineWidth = Math.max(0.6, widthPx)
    ctx.globalAlpha = toolKind === 'marker' ? MARKER_ALPHA : 1
  }, [])

  const invalidateStyle = useCallback(() => { lastStyleRef.current = '' }, [])

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
    invalidateStyle()
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
  }, [ctxOf, paintStroke, applyStyle, invalidateStyle])

  /** Size the bitmap to the container at device resolution, then repaint. */
  const fit = useCallback(() => {
    const el = containerRef.current
    const cv = canvasRef.current
    if (!el || !cv) return
    const w = el.clientWidth
    const h = Math.max(el.clientHeight, el.scrollHeight)
    if (!w || !h) return
    // On e-ink there is no benefit to a high-resolution backing store: the
    // panel is greyscale and slow, and every extra pixel costs refresh time.
    let dpr = einkRef.current ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    // Cap the total backing store however tall the chapter is.
    const MAX_PIXELS = einkRef.current ? 2.5e6 : 6e6
    while (dpr > 0.5 && w * dpr * h * dpr > MAX_PIXELS) dpr -= 0.25
    const bw = Math.round(w * dpr), bh = Math.round(h * dpr)
    // Assigning width/height clears the bitmap, so only do it when it changed.
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh }
    cv.style.width = `${w}px`
    cv.style.height = `${h}px`
    const ctx = ctxOf()
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    sizeRef.current = { w, h, dpr }
    redraw()
  }, [containerRef, redraw, ctxOf])

  // Switching e-ink mode changes the backing-store scale, so rebuild it.
  useEffect(() => { fit() }, [eink])

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
        // Skip sub-pixel jitter; keeps stored strokes small. A coarser step on
        // e-ink means fewer draw calls per stroke, which the panel notices.
        const minStep = einkRef.current ? 1.2 : 0.4
        if (Math.abs(p.x - px) * w < minStep && Math.abs(p.y - py) * w < minStep) return
        // Varying width by pressure re-styles the context on every segment. On
        // e-ink the panel cannot show the subtlety anyway, so keep it constant.
        const factor = drawTool === 'pen' && !einkRef.current ? pressureFactor(pressure) : 1
        const styleKey = `${drawTool}|${cfg.current.colorId}|${(baseWidthNorm() * factor * w).toFixed(2)}`
        if (styleKey !== lastStyleRef.current) {
          applyStyle(ctx, drawTool, colorHex(cfg.current.colorId), baseWidthNorm() * factor * w)
          lastStyleRef.current = styleKey
        }
        ctx.beginPath()
        ctx.moveTo(px * w, py * w)
        ctx.lineTo(p.x * w, p.y * w)
        ctx.stroke()
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

  /* Dismiss the drawer on Escape or a tap outside it. Drawing mode is untouched. */
  const dockRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!showToolbar || !drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    const onDown = (e: PointerEvent) => {
      const dock = dockRef.current
      if (dock && e.target instanceof Node && !dock.contains(e.target)) setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Capture phase: the canvas swallows its own pointer events while drawing.
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [showToolbar, drawerOpen])

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
        <div
          ref={dockRef}
          className={`dl-dock no-print ${drawerOpen ? 'dl-open' : ''} ${on ? 'dl-armed' : ''}`}
        >
          {drawerOpen && (
            <div className="dl-drawer" role="group" aria-label="Drawing tools">
              <button
                className={`btn small dl-toggle ${on ? '' : 'secondary'}`}
                onClick={() => setOn(!on)}
                aria-pressed={on}
                title="Draw freehand over the page"
              >{on ? 'Drawing on' : 'Drawing off'}</button>

              <div className="dl-grid dl-grid-3">
                <button
                  className={`btn small markbtn ${tool === 'pen' ? 'dl-sel' : ''}`}
                  onClick={() => setTool('pen')} title="Pen" aria-label="Pen"
                >&#x2712;&#xfe0e;</button>
                <button
                  className={`btn small markbtn ${tool === 'marker' ? 'dl-sel' : ''}`}
                  onClick={() => setTool('marker')} title="Marker" aria-label="Marker"
                >&#x25a8;</button>
                <button
                  className={`btn small markbtn ${tool === 'eraser' ? 'dl-sel' : ''}`}
                  onClick={() => setTool('eraser')} title="Eraser" aria-label="Eraser"
                >&#x232b;</button>
              </div>

              <div className="dl-grid dl-grid-3">
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
              </div>

              <div className="dl-grid dl-grid-3">
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
              </div>

              <button className="btn secondary small dl-wide" onClick={() => void undo()}>Undo</button>
              <button className="btn secondary small dl-wide" onClick={() => void clearAll()}>Clear page</button>
              <label className="dl-finger small" title="Let a fingertip draw too (off keeps the palm out)">
                <input
                  type="checkbox"
                  checked={allowFinger}
                  onChange={e => setAllowFinger(e.target.checked)}
                />
                Finger
              </label>
              <label
                className="dl-finger small"
                title="Less work for a slow panel: smaller canvas, no pressure shading"
              >
                <input
                  type="checkbox"
                  checked={eink}
                  onChange={e => setEink(e.target.checked)}
                />
                E-ink
              </label>
            </div>
          )}

          <button
            className="dl-handle"
            onClick={() => setDrawerOpen(o => !o)}
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? 'Close drawing tools' : 'Drawing tools'}
            title={on ? 'Drawing tools (drawing is on)' : 'Drawing tools'}
          >
            <span className="dl-handle-icon" aria-hidden="true">&#x270f;&#xfe0f;</span>
          </button>
        </div>
      )}
    </>
  )
}
