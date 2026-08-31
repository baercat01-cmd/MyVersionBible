import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { VerseRef } from '../lib/db'
import { listCollections, addVerse, createCollection, refKey } from '../lib/collections'

/** Add the selected verse to a collection, from the reading toolbar. */
export default function AddToCollection({ verseRef, onDone }: { verseRef: VerseRef; onDone: () => void }) {
  const collections = useLiveQuery(() => listCollections(), []) || []
  const [name, setName] = useState('')

  return (
    <div className="collect-pop">
      <div className="xref-head">Add {`${verseRef.chapter}:${verseRef.v1}`} to…</div>
      {collections.map(c => {
        const already = c.items.some(i => refKey(i.ref) === refKey(verseRef))
        return (
          <button
            className="xref" key={c.id} disabled={already}
            onClick={async () => { await addVerse(c.id, verseRef); onDone() }}
          >
            <span className="xref-ref">{c.name}</span>
            <span className="xref-text muted">
              {already ? 'already in this list' : `${c.items.length} verses`}
            </span>
          </button>
        )
      })}
      <form className="row" style={{ marginTop: 6 }} onSubmit={async e => {
        e.preventDefault()
        if (!name.trim()) return
        const c = await createCollection(name.trim())
        await addVerse(c.id, verseRef)
        onDone()
      }}>
        <input
          type="text" placeholder="New list…" value={name}
          onChange={e => setName(e.target.value)} style={{ flex: 1, minWidth: 110 }}
        />
        <button className="btn small" type="submit" disabled={!name.trim()}>Add</button>
      </form>
      <button className="linklike small" onClick={onDone}>Cancel</button>
    </div>
  )
}
