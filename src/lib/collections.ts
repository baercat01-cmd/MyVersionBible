import { db, uuid, nowISO, type CollectionRec, type CollectionItem, type VerseRef } from './db'
import { supabase } from './supabase'

/**
 * Verse collections: named lists gathered from anywhere in the Bible.
 *
 * Notes answer "what did I think about this passage". A collection answers
 * "where is everything on this theme" — a different question, so a different
 * tool. Any collection can be switched into memorisation, which adds a simple
 * spaced-repetition schedule on top of the same list.
 */
export function refKey(r: VerseRef): string {
  return `${r.book}:${r.chapter}:${r.v1}-${r.v2}`
}

export async function listCollections(): Promise<CollectionRec[]> {
  const all = await db.collections.filter(c => !c.deleted).toArray()
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCollection(name: string, description = ''): Promise<CollectionRec> {
  const rec: CollectionRec = {
    id: uuid(), name, description, items: [], memorize: false,
    created_at: nowISO(), updated_at: nowISO(), deleted: 0, dirty: 1
  }
  await db.collections.put(rec)
  return rec
}

async function update(id: string, fn: (c: CollectionRec) => void): Promise<void> {
  const c = await db.collections.get(id)
  if (!c) return
  fn(c)
  c.updated_at = nowISO()
  c.dirty = 1
  await db.collections.put(c)
}

export async function addVerse(id: string, ref: VerseRef): Promise<void> {
  await update(id, c => {
    if (c.items.some(i => refKey(i.ref) === refKey(ref))) return   // already there
    c.items.push({ ref, added_at: nowISO() })
  })
}

export async function removeVerse(id: string, ref: VerseRef): Promise<void> {
  await update(id, c => { c.items = c.items.filter(i => refKey(i.ref) !== refKey(ref)) })
}

export async function setMemorize(id: string, on: boolean): Promise<void> {
  await update(id, c => { c.memorize = on })
}

export async function renameCollection(id: string, name: string, description: string): Promise<void> {
  await update(id, c => { c.name = name; c.description = description })
}

export async function deleteCollection(id: string): Promise<void> {
  await update(id, c => { c.deleted = 1 })
}

// ---------------------------------------------------------------------------
// Spaced repetition
//
// A deliberately simple Leitner schedule: five boxes, each roughly tripling the
// interval. Getting a verse right moves it up a box; getting it wrong sends it
// back to the start. Enough to keep review honest without pretending to model
// forgetting curves.

export const BOX_DAYS = [0, 1, 3, 9, 27, 90]

export function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isDue(item: CollectionItem, today = new Date().toISOString().slice(0, 10)): boolean {
  if (item.box === undefined || !item.due) return true          // never reviewed
  return item.due <= today
}

export async function review(id: string, ref: VerseRef, correct: boolean): Promise<void> {
  await update(id, c => {
    const item = c.items.find(i => refKey(i.ref) === refKey(ref))
    if (!item) return
    const box = correct ? Math.min((item.box ?? 0) + 1, BOX_DAYS.length - 1) : 0
    item.box = box
    item.due = addDays(new Date().toISOString(), BOX_DAYS[box])
  })
}

export function dueCount(c: CollectionRec): number {
  return c.items.filter(i => isDue(i)).length
}

/** Blank out words for recall practice, keeping the shape of the verse. */
export function cloze(text: string, fraction = 0.4, seed = 1): string[] {
  const words = text.split(' ')
  // A deterministic pseudo-random pick, so the same verse hides the same words
  // within a review rather than shuffling under the reader.
  let s = seed
  const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648
  return words.map(w => (w.length > 3 && rand() < fraction ? '_'.repeat(Math.min(w.length, 8)) : w))
}

// ---------------------------------------------------------------------------
// Sync — mirrors syncNotes: push what is dirty, pull what is newer.

interface RemoteCollection {
  id: string
  name: string
  description: string
  items: CollectionItem[]
  memorize: boolean
  created_at: string
  updated_at: string
  deleted: boolean
}

export async function syncCollections(): Promise<{ pushed: number; pulled: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const dirty = await db.collections.where('dirty').equals(1).toArray()
  let pushed = 0
  if (dirty.length) {
    const { data: versions, error: verErr } = await supabase
      .from('mvb_collections').select('id, updated_at').in('id', dirty.map(c => c.id))
    if (verErr) throw verErr
    const remote = new Map((versions || []).map(r => [r.id, r.updated_at]))
    const toPush = dirty.filter(c => {
      const r = remote.get(c.id)
      return !r || r <= c.updated_at
    })
    if (toPush.length) {
      const { error } = await supabase.from('mvb_collections').upsert(
        toPush.map(c => ({
          id: c.id, user_id: user.id, name: c.name, description: c.description,
          items: c.items, memorize: c.memorize,
          created_at: c.created_at, updated_at: c.updated_at, deleted: !!c.deleted
        }))
      )
      if (error) throw error
      pushed = toPush.length
    }
    await db.collections.bulkPut(dirty.map(c => ({ ...c, dirty: 0 as const })))
  }

  const lastSync = (await db.meta.get('lastCollectionSync'))?.value || '1970-01-01T00:00:00Z'
  const { data, error } = await supabase
    .from('mvb_collections').select('*')
    .gt('updated_at', lastSync).order('updated_at', { ascending: true }).limit(500)
  if (error) throw error

  let pulled = 0
  for (const r of (data || []) as RemoteCollection[]) {
    const local = await db.collections.get(r.id)
    if (!local || (local.dirty === 0 && local.updated_at < r.updated_at)) {
      await db.collections.put({
        id: r.id, name: r.name || '', description: r.description || '',
        items: r.items || [], memorize: !!r.memorize,
        created_at: r.created_at, updated_at: r.updated_at,
        deleted: r.deleted ? 1 : 0, dirty: 0
      })
      pulled++
    }
  }
  await db.meta.put({ key: 'lastCollectionSync', value: nowISO() })
  return { pushed, pulled }
}
