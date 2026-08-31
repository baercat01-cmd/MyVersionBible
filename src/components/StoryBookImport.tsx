import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import {
  SPLIT_PATTERNS, splitIntoChapters, saveStoryBook, removeStoryBook,
  type ParsedChapter
} from '../lib/storybooks'

/**
 * Import a public-domain narrative retelling from a text file. Detection is
 * previewed before saving, because plain-text books do not agree on how they
 * mark a chapter and guessing silently would be worse than asking.
 */
export default function StoryBookImport() {
  const books = useLiveQuery(() => db.storybooks.toArray(), []) || []
  const [raw, setRaw] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [pattern, setPattern] = useState(SPLIT_PATTERNS[0].id)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const chapters: ParsedChapter[] = raw ? splitIntoChapters(raw, pattern) : []

  async function handleFile(f: File) {
    setError('')
    try {
      const text = await f.text()
      setRaw(text)
      setFileName(f.name)
      if (!title) setTitle(f.name.replace(/\.(txt|md)$/i, '').replace(/[-_]+/g, ' '))
      // Pick whichever pattern finds the most chapters, as a starting guess.
      const best = SPLIT_PATTERNS
        .map(p => ({ id: p.id, n: splitIntoChapters(text, p.id).length }))
        .sort((a, b) => b.n - a.n)[0]
      if (best && best.n > 1) setPattern(best.id)
    } catch (e) {
      setError(`Could not read the file: ${e instanceof Error ? e.message : e}`)
    }
  }

  async function handleSave() {
    if (!chapters.length || !title.trim()) return
    await saveStoryBook(title.trim(), author.trim(), chapters)
    setRaw(null); setFileName(''); setTitle(''); setAuthor('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="card">
      <h3>Story books</h3>
      <p className="muted small">
        A narrative retelling to read alongside scripture. Hurlbut's <em>Story of the
        Bible</em> (1904) is public domain and free from Project Gutenberg — download the
        plain-text file and load it here. Any public-domain story book works.
      </p>

      {books.map(b => (
        <div className="row" key={b.id} style={{ justifyContent: 'space-between', padding: '6px 0' }}>
          <div>
            <strong>{b.title}</strong>{b.author && <span className="muted"> — {b.author}</span>}
            <div className="meta">{b.chapters.length} chapters · read it in the Story tab</div>
          </div>
          <button className="btn secondary small" onClick={() => removeStoryBook(b.id)}>Remove</button>
        </div>
      ))}

      <input
        ref={fileRef} type="file" accept=".txt,.md,text/plain"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        style={{ marginTop: 8 }}
      />
      {error && <p className="small" style={{ color: '#b3402a' }}>{error}</p>}

      {raw && (
        <div style={{ marginTop: 10 }}>
          <p className="small muted">Loaded {fileName} — check the chapters were found correctly before saving.</p>
          <div className="row" style={{ marginBottom: 8 }}>
            <label className="small muted">Chapters start at:</label>
            <select value={pattern} onChange={e => setPattern(e.target.value)}>
              {SPLIT_PATTERNS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label} ({splitIntoChapters(raw, p.id).length})
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ marginBottom: 8 }}>
            <input type="text" placeholder="Book title" value={title}
              onChange={e => setTitle(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <input type="text" placeholder="Author (optional)" value={author}
              onChange={e => setAuthor(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
          </div>

          {chapters.length === 0 ? (
            <p className="small" style={{ color: '#b3402a' }}>
              No chapters found with that pattern — try another one.
            </p>
          ) : (
            <>
              <p className="small"><strong>{chapters.length} chapters found.</strong> First few:</p>
              <ol className="small muted" style={{ margin: '4px 0 8px', paddingLeft: 20 }}>
                {chapters.slice(0, 5).map(c => (
                  <li key={c.n}>{c.title} <span style={{ opacity: 0.7 }}>({c.text.length.toLocaleString()} chars)</span></li>
                ))}
              </ol>
              <button className="btn" onClick={handleSave} disabled={!title.trim()}>
                Save story book
              </button>
            </>
          )}
          <button className="btn secondary small" style={{ marginLeft: 8 }}
            onClick={() => { setRaw(null); setFileName(''); if (fileRef.current) fileRef.current.value = '' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
