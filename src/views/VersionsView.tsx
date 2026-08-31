import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import {
  FEATURED, fetchCatalog, downloadTranslation, removeTranslation,
  storeTranslation, type CatalogLanguage
} from '../lib/bolls'
import StoryBookImport from '../components/StoryBookImport'
import StudyDataImport from '../components/StudyDataImport'

const ALL = '__all__'

// bolls labels languages with their own names; match English tolerantly.
function isEnglish(language: string): boolean {
  return language.trim().toLowerCase().startsWith('english')
}

export default function VersionsView() {
  const downloaded = useLiveQuery(() => db.translations.toArray(), []) || []
  const [catalog, setCatalog] = useState<CatalogLanguage[] | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [language, setLanguage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCatalog().then(setCatalog).catch(e => setCatalogError(String(e)))
  }, [])

  // Known-good English (plus original-language) entries always come first, so the
  // essentials stay reachable no matter how the live catalog labels its languages.
  const catalogEntries = useMemo(() => {
    const entries = [...FEATURED]
    const seen = new Set(FEATURED.map(t => t.id))
    for (const l of catalog || []) {
      for (const t of l.translations) {
        if (seen.has(t.short_name)) continue
        seen.add(t.short_name)
        entries.push({ id: t.short_name, name: t.full_name, language: l.language })
      }
    }
    return entries
  }, [catalog])

  // Languages present in the catalog, English first, then alphabetical.
  const languages = useMemo(() => {
    const set = [...new Set(catalogEntries.map(e => e.language))]
    return set.sort((a, b) => {
      if (isEnglish(a) !== isEnglish(b)) return isEnglish(a) ? -1 : 1
      return a.localeCompare(b)
    })
  }, [catalogEntries])

  // Default to English once we know what the catalog calls it.
  useEffect(() => {
    if (language === null && languages.length) {
      setLanguage(languages.find(isEnglish) ?? languages[0])
    }
  }, [languages, language])

  const downloadedIds = new Set(downloaded.map(t => t.id))

  async function handleDownload(id: string, name: string, lang: string) {
    setBusy(id); setError(''); setProgress('')
    try {
      await downloadTranslation(id, name, lang, setProgress)
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

  const q = search.trim().toLowerCase()
  const available = catalogEntries
    .filter(t => !downloadedIds.has(t.id))
    .filter(t => language === ALL || language === null || t.language === language)
    .filter(t => !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
    .sort((a, b) => a.id.localeCompare(b.id))

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
          Public-domain translations from bolls.life.
          {!catalog && catalogError && ' Live catalog unavailable — showing the featured list.'}
        </p>

        <div className="row" style={{ marginBottom: 8 }}>
          <label className="small muted" htmlFor="langsel">Language:</label>
          <select
            id="langsel"
            value={language ?? ''}
            onChange={e => setLanguage(e.target.value)}
          >
            {languages.map(l => <option key={l} value={l}>{l}</option>)}
            <option value={ALL}>All languages ({catalogEntries.length})</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search by name or abbreviation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />

        {error && <p className="small" style={{ color: '#b3402a' }}>{error}</p>}
        {busy && <p className="progress">{busy === 'file' ? 'Importing…' : `Downloading ${busy}…`} {progress}</p>}

        {available.map(t => (
          <div className="row" key={`${t.language}:${t.id}`} style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <div>
              <strong>{t.id}</strong> — {t.name}
              {language === ALL && <div className="meta">{t.language}</div>}
            </div>
            <button className="btn small" disabled={busy !== null} onClick={() => handleDownload(t.id, t.name, t.language)}>
              Download
            </button>
          </div>
        ))}
        {available.length === 0 && (
          <p className="muted small">
            {q ? 'No matches — try clearing the search.' : 'Everything in this language is already downloaded.'}
          </p>
        )}
      </div>

      <StudyDataImport />

      <StoryBookImport />

      <div className="card">
        <h3>Import a translation from a file</h3>
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
