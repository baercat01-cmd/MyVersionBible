import { useEffect, useRef, useState } from 'react'
import { importXrefs, importedXrefCount, coreXrefCount, clearImportedXrefs } from '../lib/xrefs'
import { importLexicon, importedLexiconCount, coreLexiconCount, clearImportedLexicon } from '../lib/strongs'

/**
 * Import the large public-domain study datasets that are too big to ship with
 * the app. Today that means cross references; the file is downloaded in a
 * normal browser and loaded here, so it lives on the device like everything else.
 */
export default function StudyDataImport() {
  const [imported, setImported] = useState<number | null>(null)
  const [lexCount, setLexCount] = useState<number | null>(null)
  const [lexBusy, setLexBusy] = useState(false)
  const [lexStatus, setLexStatus] = useState('')
  const [lexError, setLexError] = useState('')
  const lexRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = () => importedXrefCount().then(setImported)
  const refreshLex = () => importedLexiconCount().then(setLexCount)
  useEffect(() => { refresh(); refreshLex() }, [])

  async function handleLexFile(f: File) {
    setLexBusy(true); setLexError(''); setLexStatus('')
    try {
      const r = await importLexicon(await f.text())
      setLexStatus(
        `Imported ${r.entries.toLocaleString()} lexicon entries` +
        (r.skipped ? `. ${r.skipped.toLocaleString()} skipped.` : '.')
      )
      await refreshLex()
    } catch (e) {
      setLexError(`Import failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setLexBusy(false)
      if (lexRef.current) lexRef.current.value = ''
    }
  }

  async function handleFile(f: File) {
    setBusy(true); setError(''); setStatus(''); setProgress(0)
    try {
      const text = await f.text()
      const r = await importXrefs(text, setProgress)
      if (r.sourceVerses === 0) {
        setError(
          'No cross references could be read from that file. Expected the ' +
          'openbible.info format: tab-separated "From Verse / To Verse / Votes".'
        )
      } else {
        setStatus(
          `Imported ${r.links.toLocaleString()} cross references across ` +
          `${r.sourceVerses.toLocaleString()} verses` +
          (r.skipped ? `. ${r.skipped.toLocaleString()} lines skipped (low-voted or unrecognised).` : '.')
        )
      }
      await refresh()
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false); setProgress(0)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
    <div className="card">
      <h3>Cross references</h3>
      <p className="muted small">
        Tap a verse while reading and related passages appear beside the text.
        A core set of <strong>{coreXrefCount()}</strong> passages ships with the app,
        covering messianic prophecy and the New Testament's use of the Old.
        {imported !== null && imported > 0 && (
          <> You have also imported a full set covering <strong>{imported.toLocaleString()}</strong> verses.</>
        )}
      </p>
      <p className="muted small">
        For complete coverage, download the public-domain cross-reference file from
        <strong> openbible.info/labs/cross-references</strong> (derived from the Treasury of
        Scripture Knowledge, about 340,000 links), unzip it, and load the
        <code> .txt</code> file here.
      </p>

      <input
        ref={fileRef} type="file" accept=".txt,.tsv,text/plain"
        disabled={busy}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {busy && <p className="progress">Importing… {Math.round(progress * 100)}%</p>}
      {status && <p className="small" style={{ marginBottom: 0 }}>{status}</p>}
      {error && <p className="small" style={{ color: '#b3402a', marginBottom: 0 }}>{error}</p>}
      {imported !== null && imported > 0 && !busy && (
        <button
          className="btn secondary small" style={{ marginTop: 8 }}
          onClick={async () => { await clearImportedXrefs(); refresh(); setStatus('') }}
        >Remove imported set</button>
      )}

    </div>

    <div className="card">
      <h3>Hebrew and Greek lexicon</h3>
      <p className="muted small">
        Tap a word while reading and the original word behind it appears, with its
        meaning and every other verse that uses it. This needs a version that carries
        Strong's numbers — <strong>KJV</strong> from bolls.life does.
        {' '}<strong>{coreLexiconCount()}</strong> key words ship with the app
        {lexCount !== null && lexCount > 0 && <>, and you have imported <strong>{lexCount.toLocaleString()}</strong> entries</>}.
      </p>
      <p className="muted small">
        For the full dictionary, load a Strong's JSON file — either an object keyed by
        number or an array of entries; common field names are recognised.
      </p>
      <input
        ref={lexRef} type="file" accept=".json,application/json" disabled={lexBusy}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleLexFile(f) }}
      />
      {lexBusy && <p className="progress">Importing lexicon…</p>}
      {lexStatus && <p className="small" style={{ marginBottom: 0 }}>{lexStatus}</p>}
      {lexError && <p className="small" style={{ color: '#b3402a', marginBottom: 0 }}>{lexError}</p>}
      {lexCount !== null && lexCount > 0 && !lexBusy && (
        <button
          className="btn secondary small" style={{ marginTop: 8 }}
          onClick={async () => { await clearImportedLexicon(); refreshLex(); setLexStatus('') }}
        >Remove imported lexicon</button>
      )}
    </div>
    </>
  )
}
