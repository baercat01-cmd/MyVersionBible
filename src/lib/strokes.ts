// Freehand stylus strokes drawn over a chapter.
//
// COORDINATE SYSTEM — the crux of this file.
// Points are stored normalised against the WIDTH of the text column only:
//
//     x_stored = x_px / containerWidth
//     y_stored = y_px / containerWidth      <-- width, NOT height
//
// x therefore runs 0..1 across the column and y runs 0..(height/width), i.e.
// both axes share one unit. That keeps the drawing's aspect ratio intact and,
// more importantly, keeps it anchored to the text: when the column reflows,
// the font size changes or the reader moves between phone / laptop / Boox, the
// text below a stroke stays at roughly the same fraction of the column width,
// so the stroke lands back in the same place. Normalising y by height instead
// would stretch every drawing vertically whenever the chapter's rendered
// height changed (different font size, parallel column, notes panel), which is
// exactly what we do not want.
//
// Stroke `width` is normalised the same way (fraction of the column width), so
// pen weight is consistent across devices too.
import { db, nowISO, pageKey, uuid, type StrokeRec } from './db'
import { supabase } from './supabase'

export type StrokeTool = 'pen' | 'marker'

export interface StrokeInput {
  translation: string
  book: number
  chapter: number
  tool: StrokeTool
  color: string           // hex
  width: number           // normalised (fraction of column width)
  points: number[]        // flat, already normalised [x0,y0,x1,y1,...]
}

/** px -> normalised, against the column width. */
export function toNorm(px: number, containerWidth: number): number {
  return containerWidth > 0 ? px / containerWidth : 0
}

/** normalised -> px, against the column width. */
export function toPx(n: number, containerWidth: number): number {
  return n * containerWidth
}

/** Persist a finished stroke. Returns null for an empty stroke. */
export async function saveStroke(input: StrokeInput): Promise<StrokeRec | null> {
  let points = input.points
  if (points.length < 2) return null
  // A single tap is a dot: give it a second, identical point so the renderer
  // and the hit test can treat every stroke as a polyline.
  if (points.length === 2) points = [...points, points[0], points[1]]

  const now = nowISO()
  const rec: StrokeRec = {
    id: uuid(),
    pageKey: pageKey(input.translation, input.book, input.chapter),
    translation: input.translation,
    book: input.book,
    chapter: input.chapter,
    tool: input.tool,
    color: input.color,
    width: input.width,
    points,
    created_at: now,
    updated_at: now,
    deleted: 0,
    dirty: 1
  }
  await db.strokes.put(rec)
  return rec
}

/**
 * Never hard-delete: a tombstone is what tells the other devices the stroke is
 * gone. Same contract as deleteNote().
 */
export async function softDeleteStroke(id: string): Promise<void> {
  const existing = await db.strokes.get(id)
  if (!existing || existing.deleted) return
  await db.strokes.put({ ...existing, deleted: 1, dirty: 1, updated_at: nowISO() })
}

/** Live strokes for one chapter, oldest first (drawing order). */
export async function strokesForPage(
  translation: string,
  book: number,
  chapter: number
): Promise<StrokeRec[]> {
  const rows = await db.strokes.where('pageKey').equals(pageKey(translation, book, chapter)).toArray()
  return rows.filter(s => !s.deleted).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/** Soft-delete every stroke on a chapter. Returns how many were cleared. */
export async function clearPage(translation: string, book: number, chapter: number): Promise<number> {
  const live = await strokesForPage(translation, book, chapter)
  const now = nowISO()
  if (live.length) {
    await db.strokes.bulkPut(live.map(s => ({ ...s, deleted: 1 as const, dirty: 1 as const, updated_at: now })))
  }
  return live.length
}

/** Soft-delete the most recently drawn stroke on a chapter. */
export async function undoLastStroke(
  translation: string,
  book: number,
  chapter: number
): Promise<string | null> {
  const live = await strokesForPage(translation, book, chapter)
  const last = live[live.length - 1]
  if (!last) return null
  await softDeleteStroke(last.id)
  return last.id
}

/** Squared distance from point p to segment ab, all in normalised units. */
function distToSegment2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  t = t < 0 ? 0 : t > 1 ? 1 : t
  const cx = ax + t * dx, cy = ay + t * dy
  return (px - cx) * (px - cx) + (py - cy) * (py - cy)
}

/**
 * Stroke-level hit test: does the eraser tip (a circle of `radius`, normalised)
 * touch any part of this stroke? The stroke's own half-width counts, so fat
 * marker strokes are easier to catch than hairlines.
 */
export function strokeHit(stroke: StrokeRec, x: number, y: number, radius: number): boolean {
  const p = stroke.points
  const reach = radius + stroke.width / 2
  const reach2 = reach * reach
  for (let i = 0; i + 3 < p.length; i += 2) {
    if (distToSegment2(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= reach2) return true
  }
  return false
}

/** Topmost (most recently drawn) stroke under the eraser, or null. */
export function strokeAtPoint(
  strokes: StrokeRec[],
  x: number,
  y: number,
  radius: number
): StrokeRec | null {
  for (let i = strokes.length - 1; i >= 0; i--) {
    if (strokeHit(strokes[i], x, y, radius)) return strokes[i]
  }
  return null
}

/**
 * Erase whole strokes touched by the eraser tip. Pass the strokes already
 * loaded for the page so the caller does not hit Dexie on every pointermove.
 * Returns the ids that were erased.
 */
export async function eraseStrokesAt(
  strokes: StrokeRec[],
  x: number,
  y: number,
  radius: number
): Promise<string[]> {
  const hits = strokes.filter(s => strokeHit(s, x, y, radius))
  for (const h of hits) await softDeleteStroke(h.id)
  return hits.map(h => h.id)
}

/* ------------------------------------------------------------------ *
 * Sync — same last-write-wins shape as syncNotes() in ./supabase.ts.
 * ------------------------------------------------------------------ */

const STROKE_SYNC_KEY = 'lastStrokeSync'

interface RemoteStroke {
  id: string
  page_key: string
  translation: string
  book: number
  chapter: number
  tool: string
  color: string
  width: number
  points: number[]
  created_at: string
  updated_at: string
  deleted: boolean
}

function toRemote(s: StrokeRec) {
  return {
    id: s.id,
    page_key: s.pageKey,
    translation: s.translation,
    book: s.book,
    chapter: s.chapter,
    tool: s.tool,
    color: s.color,
    width: s.width,
    points: s.points,
    created_at: s.created_at,
    updated_at: s.updated_at,
    deleted: !!s.deleted
  }
}

function toLocal(r: RemoteStroke): StrokeRec {
  return {
    id: r.id,
    pageKey: r.page_key || pageKey(r.translation, r.book, r.chapter),
    translation: r.translation,
    book: r.book,
    chapter: r.chapter,
    tool: (r.tool === 'marker' ? 'marker' : 'pen'),
    color: r.color,
    width: r.width,
    points: r.points || [],
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted: r.deleted ? 1 : 0,
    dirty: 0
  }
}

export interface StrokeSyncResult { pushed: number; pulled: number }

/** Two-way last-write-wins sync of strokes against public.mvb_strokes. */
export async function syncStrokes(): Promise<StrokeSyncResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Push local dirty strokes (including tombstones).
  const dirty = await db.strokes.where('dirty').equals(1).toArray()
  let pushed = 0
  if (dirty.length) {
    const { data: remoteVersions, error: verErr } = await supabase
      .from('mvb_strokes')
      .select('id, updated_at')
      .in('id', dirty.map(s => s.id))
    if (verErr) throw verErr
    const remoteMap = new Map((remoteVersions || []).map(r => [r.id, r.updated_at]))
    const toPush = dirty.filter(s => {
      const remote = remoteMap.get(s.id)
      return !remote || remote <= s.updated_at
    })
    if (toPush.length) {
      const { error } = await supabase
        .from('mvb_strokes')
        .upsert(toPush.map(s => ({ ...toRemote(s), user_id: user.id })))
      if (error) throw error
      pushed = toPush.length
    }
    await db.strokes.bulkPut(dirty.map(s => ({ ...s, dirty: 0 as const })))
  }

  // Pull anything newer than the last stroke sync point.
  const lastSync = (await db.meta.get(STROKE_SYNC_KEY))?.value || '1970-01-01T00:00:00Z'
  const { data: remote, error } = await supabase
    .from('mvb_strokes')
    .select('*')
    .gt('updated_at', lastSync)
    .order('updated_at', { ascending: true })
    .limit(1000)
  if (error) throw error

  let pulled = 0
  for (const r of (remote || []) as RemoteStroke[]) {
    const local = await db.strokes.get(r.id)
    if (!local || (local.dirty === 0 && local.updated_at < r.updated_at)) {
      await db.strokes.put(toLocal(r))
      pulled++
    }
  }
  await db.meta.put({ key: STROKE_SYNC_KEY, value: nowISO() })
  return { pushed, pulled }
}
