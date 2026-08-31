// Sync backend: shared Supabase project (same backend as Vesper).
// Notes live in the `mvb_notes` table, locked down with RLS per-user.
// The app is fully usable offline / signed out; sync is additive.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { db, nowISO, refChapterKeys, type MarkStyle, type NoteRec } from './db'

const SUPABASE_URL = 'https://kcmjuunzagqyyxxgjxuq.supabase.co'
const SUPABASE_KEY = 'sb_publishable_gAkzYzLumBBZ-KyC8r8fTQ_z-Mp7HP7'

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)

interface RemoteNote {
  id: string
  kind: string
  title: string
  content: string
  template: string | null
  sections: Record<string, string> | null
  refs: NoteRec['refs']
  tags: string[]
  color: string | null
  style: MarkStyle | null
  words: number[] | null
  created_at: string
  updated_at: string
  deleted: boolean
}

function toRemote(n: NoteRec) {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    content: n.content,
    template: n.template,
    sections: n.sections,
    refs: n.refs,
    tags: n.tags,
    color: n.color,
    style: n.style,
    words: n.words,
    created_at: n.created_at,
    updated_at: n.updated_at,
    deleted: !!n.deleted
  }
}

function toLocal(r: RemoteNote): NoteRec {
  return {
    id: r.id,
    kind: (r.kind as NoteRec['kind']) || 'journal',
    title: r.title || '',
    content: r.content || '',
    template: r.template,
    sections: r.sections,
    refs: r.refs || [],
    tags: r.tags || [],
    color: r.color,
    style: r.style ?? null,
    words: r.words ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted: r.deleted ? 1 : 0,
    dirty: 0,
    chapterKeys: refChapterKeys(r.refs || [])
  }
}

export interface SyncResult { pushed: number; pulled: number }

// Last-write-wins two-way sync keyed on updated_at.
export async function syncNotes(): Promise<SyncResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Push local dirty notes.
  const dirty = await db.notes.where('dirty').equals(1).toArray()
  let pushed = 0
  if (dirty.length) {
    const { data: remoteVersions, error: verErr } = await supabase
      .from('mvb_notes')
      .select('id, updated_at')
      .in('id', dirty.map(n => n.id))
    if (verErr) throw verErr
    const remoteMap = new Map((remoteVersions || []).map(r => [r.id, r.updated_at]))
    const toPush = dirty.filter(n => {
      const remote = remoteMap.get(n.id)
      return !remote || remote <= n.updated_at
    })
    if (toPush.length) {
      const { error } = await supabase
        .from('mvb_notes')
        .upsert(toPush.map(n => ({ ...toRemote(n), user_id: user.id })))
      if (error) throw error
      pushed = toPush.length
    }
    await db.notes.bulkPut(dirty.map(n => ({ ...n, dirty: 0 as const })))
  }

  // Pull anything newer than the last sync point.
  const lastSync = (await db.meta.get('lastSync'))?.value || '1970-01-01T00:00:00Z'
  const { data: remote, error } = await supabase
    .from('mvb_notes')
    .select('*')
    .gt('updated_at', lastSync)
    .order('updated_at', { ascending: true })
    .limit(1000)
  if (error) throw error

  let pulled = 0
  for (const r of (remote || []) as RemoteNote[]) {
    const local = await db.notes.get(r.id)
    if (!local || (local.dirty === 0 && local.updated_at < r.updated_at)) {
      await db.notes.put(toLocal(r))
      pulled++
    }
  }
  await db.meta.put({ key: 'lastSync', value: nowISO() })
  return { pushed, pulled }
}

export async function signInWithEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}
