import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { bookName } from '../lib/books'
import { requestJump } from '../lib/nav'
import { searchScripture, segmentHit, type Scope, type SearchResult } from '../lib/search'

const LIMIT = 300

export default function SearchView() {
  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const [translation, setTranslation] = useState('')
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [book, setBook] = useState(1)
  const [wholeWord, setWholeWord] = useState(false)
  const [phrase, setPhrase] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const runId = useRef(0)

  useEffect(() => {
    if (translations.length && !translations.find(t => t.id === translation)) {
      setTranslation(translations[0].id)
    }
  }, [translations.length])

  const current = translations.find(t => t.id === translation)

  async function run() {
    if (!query.trim() || !translation) return
    const id = ++runId.current
    setBusy(true); setProgress(0); setResult(null)
    const r = await searchScripture(query, {
      translation, scope, book, wholeWord, phrase, limit: LIMIT
    }, f => { if (runId.current === id) setProgress(f) })
    if (runId.current === id) { setResult(r); setBusy(false) }
  }

  if (!translations.length) {
    return (
      <div className="card">
        <h3>Nothing to search yet</h3>
        <p>Download a version from the <strong>Versions</strong> tab, then you can search every word of it — offline.</p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>Search the text</h3>
        <form onSubmit={e => { e.preventDefault(); run() }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <input
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Word or phrase…" autoFocus
              style={{ flex: 1, minWidth: 180 }}
            />
            <button className="btn" type="submit" disabled={busy || !query.trim()}>
              {busy ? 'Searching…' : 'Search'}
            </button>
          </div>
          <div className="row">
            <select value={translation} onChange={e => setTranslation(e.target.value)}>
              {translations.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
            </select>
            <select value={scope} onChange={e => setScope(e.target.value as Scope)}>
              <option value="all">Whole Bible</option>
              <option value="ot">Old Testament</option>
              <option value="nt">New Testament</option>
              <option value="book">One book…</option>
            </select>
            {scope === 'book' && (
              <select value={book} onChange={e => setBook(+e.target.value)}>
                {(current?.books || []).map(b =>
                  <option key={b.bookid} value={b.bookid}>{b.name}</option>)}
              </select>
            )}
            <label className="small muted searchopt">
              <input type="checkbox" checked={phrase} onChange={e => setPhrase(e.target.checked)} />
              Exact phrase
            </label>
            <label className="small muted searchopt">
              <input type="checkbox" checked={wholeWord} onChange={e => setWholeWord(e.target.checked)} />
              Whole words
            </label>
          </div>
        </form>
        {!phrase && query.trim().split(/\s+/).length > 1 && (
          <p className="muted small" style={{ marginBottom: 0 }}>
            Finding verses containing <em>all</em> of these words. Tick “Exact phrase” to
            match them together in order.
          </p>
        )}
        {busy && (
          <p className="progress">Scanning {translation}… {Math.round(progress * 100)}%</p>
        )}
      </div>

      {result && (
        <>
          <p className="muted small">
            {result.total === 0
              ? <>No verses in {translation} contain that.</>
              : <>
                  <strong>{result.total.toLocaleString()}</strong> {result.total === 1 ? 'verse' : 'verses'}
                  {result.truncated && <> — showing the first {result.hits.length}</>}
                  {' '}· {Math.round(result.ms)}ms
                </>}
          </p>
          {result.hits.map(h => (
            <button
              className="hitcard" key={`${h.book}:${h.chapter}:${h.verse}`}
              onClick={() => requestJump({ translation, book: h.book, chapter: h.chapter, verse: h.verse })}
            >
              <div className="hitref">{bookName(h.book)} {h.chapter}:{h.verse}</div>
              <div className="hittext">
                {segmentHit(h).map((seg, i) =>
                  seg.hit ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>)}
              </div>
            </button>
          ))}
        </>
      )}
    </div>
  )
}
