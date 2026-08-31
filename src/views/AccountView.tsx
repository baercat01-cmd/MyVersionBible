import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { supabase, syncNotes, signInWithEmail, signOut } from '../lib/supabase'
import { syncStrokes } from '../lib/strokes'

export default function AccountView() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const noteCount = useLiveQuery(() => db.notes.filter(n => !n.deleted).count(), []) || 0
  const dirtyCount = useLiveQuery(() => db.notes.where('dirty').equals(1).count(), []) || 0
  const lastSync = useLiveQuery(async () => (await db.meta.get('lastSync'))?.value, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSignIn() {
    setBusy(true); setStatus('')
    try {
      await signInWithEmail(email.trim())
      setStatus('Check your email for a sign-in link, then come back here.')
    } catch (e) {
      setStatus(`Sign-in failed: ${e instanceof Error ? e.message : e}`)
    } finally { setBusy(false) }
  }

  async function handleSync() {
    setBusy(true); setStatus('Syncing…')
    try {
      const r = await syncNotes()
      const d = await syncStrokes()
      setStatus(
        `Synced — ${r.pushed + d.pushed} pushed, ${r.pulled + d.pulled} pulled` +
        (d.pushed || d.pulled ? ` (${d.pushed + d.pulled} drawing strokes).` : '.')
      )
    } catch (e) {
      setStatus(`Sync failed: ${e instanceof Error ? e.message : e}`)
    } finally { setBusy(false) }
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>Sync</h3>
        <p className="muted small">
          Notes are always saved on this device first and work offline.
          Sign in to sync them across your phone, computer, and e-reader.
        </p>
        {user ? (
          <>
            <p>Signed in as <strong>{user.email}</strong></p>
            <p className="small muted">
              {noteCount} notes on this device · {dirtyCount} awaiting sync
              {lastSync && <> · last sync {new Date(lastSync).toLocaleString()}</>}
            </p>
            <div className="row">
              <button className="btn" disabled={busy} onClick={handleSync}>Sync now</button>
              <button className="btn secondary" disabled={busy} onClick={() => signOut()}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <div className="row">
              <input
                type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }}
              />
              <button className="btn" disabled={busy || !email.includes('@')} onClick={handleSignIn}>
                Email me a sign-in link
              </button>
            </div>
          </>
        )}
        {status && <p className="small" style={{ marginTop: 8 }}>{status}</p>}
      </div>

      <div className="card">
        <h3>About</h3>
        <p className="muted small">
          MyVersionBible — an offline-first Bible study app. Bible text is stored entirely on this
          device; notes sync through your own private backend. Install it from your browser menu
          ("Add to Home Screen" / "Install app") on each device.
        </p>
      </div>
    </div>
  )
}
