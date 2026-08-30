import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import {
  FEATURED, fetchCatalog, downloadTranslation, removeTranslation,
  storeTranslation, type CatalogLanguage
} from '../lib/bolls'

export default function VersionsView() {
  const downloaded = useLiveQuery(() => db.translations.toArray(), []) || []
  const [catalog, setCatalog] = useState<CatalogLanguage[] | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCatalog().then(setCatalog).catch(e => setCatalogError(String(e)))
  }, [])

  const downloadedIds = new Set(downloaded.map(t => t.id))

  async function handleDownload(id: string, name: string, language: string) {
    setBusy(id); setError(''); setProgress('')
    try {
      await downloadTranslation(id, name, language, setProgress)
    } catch (e) {
      setError(`Could not download ${id}: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(null); setProgress('')
    }
  }

  async function handleImportFile(f: File) {
    setBusy('file'); setError('')
    try {
      const text = await f.text()
      const verses = JSON.parse(text)
      if (!Array.isArray(verses) || !verses[0]?.book) throw new Error('Expected a JSON array of {book, chapter, verse, text}')
      const id = f.name.replace(/\.json$/i, '').toUpperCase()
      await storeTranslation(id, id, 'Imported', verses, setProgress)
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(null); setProgress('')
    }
  }

  // Flatten live catalog for search; fall back to the featured list.
  const catalogEntries = catalog
    ? catalog.flatMap(l => l.translations.map(t => ({ id: t.short_name, name: t.full_name, language: l.language })))
    : FEATURED

  const q = search.trim().toLowerCase()
  const filtered = catalogEntries
    .filter(t => !downloadedIds.has(t.id))
    .filter(t => !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.language.toLowerCase().includes(q))
    .slice(0, q ? 60 : 25)

  return (
    <div className="stack">
      <div className="card">
        <h3>Downloaded versions</h3>
        {downloaded.length === 0 && (
          <p className="muted small">Nothing downloaded yet. Grab a version below — after that it works fully offline.</p>
        )}
        {downloaded.map(t => (
          <div className="row" key={t.id} style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <div>
              <strong>{t.id}</strong> — {t.name}
              <div className="meta">{t.language} · {t.verseCount.toLocaleString()} verses</div>
            </div>
            <button className="btn secondary small" onClick={() => removeTranslation(t.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Get more versions</h3>
        <p className="muted small">
          Public-domain translations from bolls.life. {catalogError && !catalog ? 'Live catalog unavailable — showing featured list.' : ''}
        </p>
        <input
          type="text"
          placeholder="Search by name or language…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
        {error && <p className="small" style={{ color: '#b3402a' }}>{error}</p>}
        {busy && <p className="progress">{busy === 'file' ? 'Importing…' : `Downloading ${busy}…`} {progress}</p>}
        {filtered.map(t => (
          <div className="row" key={t.id} style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <div>
              <strong>{t.id}</strong> — {t.name}
              <div className="meta">{t.language}</div>
            </div>
            <button className="btn small" disabled={busy !== null} onClick={() => handleDownload(t.id, t.name, t.language)}>
              Download
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className="muted small">No matches.</p>}
      </div>

      <div className="card">
        <h3>Import from file</h3>
        <p className="muted small">
          Load a translation from a JSON file (array of <code>{'{book, chapter, verse, text}'}</code>) —
          useful if a download source is unreachable.
        </p>
        <input
          ref={fileRef} type="file" accept=".json,application/json"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = '' }}
        />
      </div>
    </div>
  )
}
