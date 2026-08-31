import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CollectionRec, type VerseRef } from '../lib/db'
import {
  listCollections, createCollection, deleteCollection, renameCollection,
  removeVerse, setMemorize, review, isDue, dueCount, cloze, refKey
} from '../lib/collections'
import { loadPassage, passageLabel } from '../lib/passages'
import { requestJump } from '../lib/nav'

export default function CollectionsView() {
  const collections = useLiveQuery(() => listCollections(), []) || []
  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const [openId, setOpenId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [reviewing, setReviewing] = useState<string | null>(null)

  const translation = translations[0]?.id || ''
  const open = collections.find(c => c.id === openId)

  if (reviewing) {
    const c = collections.find(x => x.id === reviewing)
    if (!c) { setReviewing(null); return null }
    return <ReviewSession collection={c} translation={translation} onDone={() => setReviewing(null)} />
  }

  if (open) {
    return (
      <CollectionDetail
        collection={open} translation={translation}
        onBack={() => setOpenId(null)}
        onReview={() => setReviewing(open.id)}
      />
    )
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>Verse collections</h3>
        <p className="muted small">
          Named lists of verses gathered from anywhere in the Bible — everything on
          grace, say, or the verses you are learning. Add to one by selecting a verse
          while reading. Turn on memorising and a collection gets a review schedule.
        </p>
        <form className="row" onSubmit={async e => {
          e.preventDefault()
          if (!newName.trim()) return
          await createCollection(newName.trim())
          setNewName('')
        }}>
          <input
            type="text" placeholder="New collection name…" value={newName}
            onChange={e => setNewName(e.target.value)} style={{ flex: 1, minWidth: 160 }}
          />
          <button className="btn" type="submit" disabled={!newName.trim()}>Create</button>
        </form>
      </div>

      {collections.length === 0 && <p className="muted">No collections yet.</p>}
      {collections.map(c => {
        const due = dueCount(c)
        return (
          <div className="card" key={c.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="linklike" onClick={() => setOpenId(c.id)}>
                <strong>{c.name}</strong>
              </button>
              <span className="meta">
                {c.items.length} {c.items.length === 1 ? 'verse' : 'verses'}
                {c.memorize && due > 0 && <> · <strong>{due} due</strong></>}
              </span>
            </div>
            {c.description && <p className="small muted" style={{ margin: '4px 0 0' }}>{c.description}</p>}
            {c.memorize && c.items.length > 0 && (
              <button className="btn small" style={{ marginTop: 8 }} onClick={() => setReviewing(c.id)}>
                {due > 0 ? `Review ${due}` : 'Review anyway'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CollectionDetail({ collection, translation, onBack, onReview }: {
  collection: CollectionRec
  translation: string
  onBack: () => void
  onReview: () => void
}) {
  const [texts, setTexts] = useState<Map<string, string>>(new Map())
  const [name, setName] = useState(collection.name)
  const [desc, setDesc] = useState(collection.description)

  useEffect(() => {
    let live = true
    ;(async () => {
      const map = new Map<string, string>()
      for (const item of collection.items) {
        const t = await verseText(item.ref, translation)
        if (t) map.set(refKey(item.ref), t)
      }
      if (live) setTexts(map)
    })()
    return () => { live = false }
  }, [collection.items.length, translation, collection.id])

  return (
    <div className="stack">
      <div className="row">
        <button className="btn secondary small" onClick={onBack}>← All collections</button>
        {collection.memorize && collection.items.length > 0 && (
          <button className="btn small" onClick={onReview}>Review</button>
        )}
      </div>

      <div className="card">
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          onBlur={() => renameCollection(collection.id, name.trim() || collection.name, desc)}
          style={{ width: '100%', fontWeight: 600, marginBottom: 6 }}
        />
        <input
          type="text" value={desc} placeholder="Description (optional)"
          onChange={e => setDesc(e.target.value)}
          onBlur={() => renameCollection(collection.id, name.trim() || collection.name, desc)}
          style={{ width: '100%' }}
        />
        <label className="row small muted" style={{ marginTop: 8, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={collection.memorize}
            onChange={e => setMemorize(collection.id, e.target.checked)}
          />
          Memorise these verses (adds a review schedule)
        </label>
        <button
          className="btn secondary small" style={{ marginTop: 8 }}
          onClick={() => { if (confirm(`Delete “${collection.name}”?`)) { deleteCollection(collection.id); onBack() } }}
        >Delete collection</button>
      </div>

      {collection.items.length === 0 && (
        <p className="muted">
          Empty. While reading, select a verse and use <strong>+ List</strong> to add it here.
        </p>
      )}

      {collection.items.map(item => (
        <div className="card" key={refKey(item.ref)}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button
              className="linklike"
              onClick={() => requestJump({
                translation, book: item.ref.book, chapter: item.ref.chapter, verse: item.ref.v1
              })}
            ><strong>{passageLabel({
              book: item.ref.book, c1: item.ref.chapter, v1: item.ref.v1,
              c2: item.ref.chapter, v2: item.ref.v2
            })}</strong></button>
            <button className="btn secondary small" onClick={() => removeVerse(collection.id, item.ref)}>
              Remove
            </button>
          </div>
          <p className="small" style={{ margin: '4px 0 0', fontFamily: 'var(--serif)' }}>
            {texts.get(refKey(item.ref)) || <span className="muted">not in {translation || 'any downloaded version'}</span>}
          </p>
          {collection.memorize && (
            <div className="meta">
              {item.box === undefined ? 'not yet reviewed' : `box ${item.box}`}
              {item.due && ` · due ${item.due}`}
              {isDue(item) && ' · due now'}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ReviewSession({ collection, translation, onDone }: {
  collection: CollectionRec
  translation: string
  onDone: () => void
}) {
  const queue = collection.items.filter(i => isDue(i))
  const items = queue.length ? queue : collection.items
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [text, setText] = useState<string | null>(null)

  const item = items[index]

  useEffect(() => {
    let live = true
    setText(null); setRevealed(false)
    if (!item) return
    verseText(item.ref, translation).then(t => { if (live) setText(t) })
    return () => { live = false }
  }, [index, item && refKey(item.ref), translation])

  if (!item) {
    return (
      <div className="card">
        <h3>Nothing to review</h3>
        <p className="muted">This collection has no verses yet.</p>
        <button className="btn" onClick={onDone}>Back</button>
      </div>
    )
  }

  const label = passageLabel({
    book: item.ref.book, c1: item.ref.chapter, v1: item.ref.v1,
    c2: item.ref.chapter, v2: item.ref.v2
  })

  async function answer(correct: boolean) {
    await review(collection.id, item.ref, correct)
    if (index + 1 >= items.length) onDone()
    else setIndex(i => i + 1)
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="btn secondary small" onClick={onDone}>← Stop</button>
        <span className="meta">{index + 1} of {items.length}</span>
      </div>
      <div className="card review">
        <div className="xref-head">{label}</div>
        {text === null
          ? <p className="muted">Loading…</p>
          : <p className="review-text">
              {revealed ? text : cloze(text, 0.45, item.ref.v1 + item.ref.chapter).join(' ')}
            </p>}
        {!revealed
          ? <button className="btn" onClick={() => setRevealed(true)} disabled={text === null}>Show verse</button>
          : <div className="row">
              <button className="btn secondary" onClick={() => answer(false)}>Missed it</button>
              <button className="btn" onClick={() => answer(true)}>Got it</button>
            </div>}
      </div>
    </div>
  )
}

async function verseText(ref: VerseRef, translation: string): Promise<string | null> {
  const trans = ref.translation || translation
  if (!trans) return null
  const chapters = await loadPassage(trans, {
    book: ref.book, c1: ref.chapter, v1: ref.v1, c2: ref.chapter, v2: ref.v2
  })
  const verses = chapters.flatMap(c => c.verses)
  return verses.length ? verses.map(v => v.t).join(' ') : null
}
