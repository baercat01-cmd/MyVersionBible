import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveNote, type NoteRec, type VerseRef } from '../lib/db'
import { formatRef } from '../lib/refs'
import {
  SERMON_TEMPLATE, parsePoints, serialisePoints, resolveReference,
  sermonMeta, studyFromSermon, type SermonPoint
} from '../lib/sermons'
import PassageInspector from './PassageInspector'

interface Props {
  note?: NoteRec
  onDone: () => void
  onOpenStudy?: (study: NoteRec) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Taking notes while a sermon is being preached.
 *
 * The reference goes in first, which opens the passage beside the notes; from
 * there a point can be captured straight off the text and an original word
 * dropped into the notes without breaking the flow of listening. Everything is
 * saved as it is typed, because a sermon does not wait for you to press Save.
 */
export default function SermonEditor({ note, onDone, onOpenStudy }: Props) {
  const [title, setTitle] = useState(note?.title || '')
  const [speaker, setSpeaker] = useState(sermonMeta(note, 'speaker'))
  const [series, setSeries] = useState(sermonMeta(note, 'series'))
  const [place, setPlace] = useState(sermonMeta(note, 'place'))
  const [preached, setPreached] = useState(sermonMeta(note, 'preached') || today())
  const [refs, setRefs] = useState<VerseRef[]>(note?.refs || [])
  const [refInput, setRefInput] = useState(note?.refs?.length ? formatRef(note.refs[0]) : '')
  const [refError, setRefError] = useState('')
  const [refLabel, setRefLabel] = useState(note?.refs?.length ? formatRef(note.refs[0]) : '')
  const [points, setPoints] = useState<SermonPoint[]>(() => {
    const existing = parsePoints(note?.sections?.points)
    return existing.length ? existing : [{ text: '', ref: null }]
  })
  const [fields, setFields] = useState<Record<string, string>>({
    bigidea: note?.sections?.bigidea || '',
    words: note?.sections?.words || '',
    quotes: note?.sections?.quotes || '',
    application: note?.sections?.application || '',
    questions: note?.sections?.questions || ''
  })
  const [tags, setTags] = useState((note?.tags || []).join(', '))
  const [saved, setSaved] = useState<string | null>(null)
  const [madeStudy, setMadeStudy] = useState(false)

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const [translation, setTranslation] = useState(note?.refs?.[0]?.translation || '')
  useEffect(() => {
    if (!translation && translations.length) setTranslation(translations[0].id)
  }, [translations.length])

  const idRef = useRef(note?.id)
  const dirtyRef = useRef(false)
  const pointRefs = useRef<(HTMLInputElement | null)[]>([])

  function collect() {
    return {
      id: idRef.current,
      kind: 'sermon' as const,
      title,
      content: '',
      template: SERMON_TEMPLATE.id,
      refs,
      sections: {
        speaker, series, place, preached,
        bigidea: fields.bigidea,
        points: serialisePoints(points),
        words: fields.words,
        quotes: fields.quotes,
        application: fields.application,
        questions: fields.questions
      },
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    }
  }

  async function persist() {
    const rec = await saveNote(collect())
    idRef.current = rec.id
    dirtyRef.current = false
    setSaved(new Date().toLocaleTimeString())
    return rec
  }

  // Save shortly after typing stops, so nothing is lost mid-sermon.
  useEffect(() => {
    dirtyRef.current = true
    const timer = setTimeout(() => { if (dirtyRef.current) persist() }, 1500)
    return () => clearTimeout(timer)
  }, [title, speaker, series, place, preached, refs, points, fields, tags])

  // And once more on the way out, in case the app is closed straight after.
  useEffect(() => () => { if (dirtyRef.current) persist() }, [])

  async function lookupRef(text: string) {
    setRefInput(text)
    if (!text.trim()) { setRefs([]); setRefLabel(''); setRefError(''); return }
    const found = await resolveReference(text, translation)
    if (!found) { setRefError('Not a reference I can read — try "John 3:16-18".'); return }
    setRefError('')
    setRefs(found.refs)
    // The reference as it was given — a whole chapter stays a whole chapter,
    // even on a device that has not downloaded that version to clamp it.
    setRefLabel(found.label)
  }

  // Re-resolve against a different version, so verse ranges match its text.
  useEffect(() => {
    if (refInput.trim()) lookupRef(refInput)
  }, [translation])

  function setPoint(i: number, patch: Partial<SermonPoint>) {
    setPoints(ps => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  }

  function addPoint(after: number, seed: Partial<SermonPoint> = {}) {
    setPoints(ps => [...ps.slice(0, after + 1), { text: '', ref: null, ...seed }, ...ps.slice(after + 1)])
    setTimeout(() => pointRefs.current[after + 1]?.focus(), 0)
  }

  function removePoint(i: number) {
    setPoints(ps => (ps.length === 1 ? [{ text: '', ref: null }] : ps.filter((_, j) => j !== i)))
  }

  function movePoint(i: number, delta: number) {
    setPoints(ps => {
      const j = i + delta
      if (j < 0 || j >= ps.length) return ps
      const next = [...ps]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  /** A verse captured from the passage panel becomes the next point. */
  function capturePoint(ref: VerseRef, text: string) {
    setPoints(ps => {
      const last = ps[ps.length - 1]
      const quoted = `“${text}”`
      if (last && !last.text.trim() && !last.ref) {
        return [...ps.slice(0, -1), { ref, text: quoted }]
      }
      return [...ps, { ref, text: quoted }]
    })
  }

  function captureWord(line: string) {
    setFields(f => ({ ...f, words: f.words ? `${f.words}\n${line}` : line }))
  }

  async function makeStudy() {
    const rec = await persist()
    const study = await studyFromSermon(rec)
    setMadeStudy(true)
    onOpenStudy?.(study)
  }

  return (
    <div className="sermon-grid">
      <div className="sermon-notes">
        <div className="card editor-section">
          <input
            type="text" placeholder="Sermon title" value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', fontWeight: 600, marginBottom: 8 }}
          />
          <div className="row sermon-meta">
            <input type="text" placeholder="Preacher" value={speaker} onChange={e => setSpeaker(e.target.value)} />
            <input type="text" placeholder="Series" value={series} onChange={e => setSeries(e.target.value)} />
            <input type="text" placeholder="Where" value={place} onChange={e => setPlace(e.target.value)} />
            <input type="date" value={preached} onChange={e => setPreached(e.target.value)} />
          </div>

          <label htmlFor="sermon-ref">Preaching from</label>
          <div className="hint">The reference given — "John 3:16-18", "1 Cor 13", "Rom 8:28-39".</div>
          <input
            id="sermon-ref" type="text" placeholder="John 3:16-18"
            value={refInput} onChange={e => lookupRef(e.target.value)}
            style={{ width: '100%' }}
          />
          {refError && <div className="hint sermon-referror">{refError}</div>}
          {refs.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <span className="tag">📖 {refLabel || formatRef(refs[0])}</span>
            </div>
          )}
        </div>

        <div className="card editor-section">
          <label>Big idea</label>
          <div className="hint">{SERMON_TEMPLATE.sections[0].hint}</div>
          <textarea
            value={fields.bigidea} onChange={e => setFields({ ...fields, bigidea: e.target.value })}
            style={{ minHeight: 60 }}
          />

          <label>Outline</label>
          <div className="hint">
            One line per point. Capture a verse from the passage beside you with <strong>+ Point</strong>,
            or type a reference of your own beside the line.
          </div>
          {points.map((p, i) => (
            <div className="sermon-point" key={i}>
              <input
                className="sermon-point-ref" type="text" placeholder="ref"
                value={p.ref ? formatRef(p.ref) : ''}
                onChange={async e => {
                  const found = e.target.value.trim() ? await resolveReference(e.target.value, translation) : null
                  setPoint(i, { ref: found ? found.refs[0] : null })
                }}
                title="The verse this point came from"
              />
              <input
                className="sermon-point-text" type="text" placeholder={`Point ${i + 1}`}
                ref={el => { pointRefs.current[i] = el }}
                value={p.text} onChange={e => setPoint(i, { text: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint(i) } }}
              />
              <button className="linklike small" onClick={() => movePoint(i, -1)} title="Move up" aria-label="Move up">↑</button>
              <button className="linklike small" onClick={() => movePoint(i, 1)} title="Move down" aria-label="Move down">↓</button>
              <button className="linklike small" onClick={() => removePoint(i)} title="Remove" aria-label="Remove point">✕</button>
            </div>
          ))}
          <button className="btn secondary small" onClick={() => addPoint(points.length - 1)}>+ Point</button>

          <label>Words to look at</label>
          <div className="hint">
            Tap a word in the passage and add it here with its Strong's entry — the meaning
            comes with it, so it is still there when you study later.
          </div>
          <textarea
            value={fields.words} onChange={e => setFields({ ...fields, words: e.target.value })}
            style={{ minHeight: 70 }}
          />

          <label>Quotes & illustrations</label>
          <textarea
            value={fields.quotes} onChange={e => setFields({ ...fields, quotes: e.target.value })}
            style={{ minHeight: 70 }}
          />

          <label>Application</label>
          <div className="hint">What this asks of you this week.</div>
          <textarea
            value={fields.application} onChange={e => setFields({ ...fields, application: e.target.value })}
            style={{ minHeight: 70 }}
          />

          <label>Questions to study later</label>
          <div className="hint">One per line. These carry into the study made from this sermon.</div>
          <textarea
            value={fields.questions} onChange={e => setFields({ ...fields, questions: e.target.value })}
            style={{ minHeight: 70 }}
          />

          <input
            type="text" placeholder="Tags (comma-separated)" value={tags}
            onChange={e => setTags(e.target.value)}
            style={{ width: '100%', marginTop: 10 }}
          />

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={async () => { await persist(); onDone() }}>Done</button>
            <button className="btn secondary" onClick={makeStudy} title="Start a study from this sermon">
              📚 Study this deeper
            </button>
            <div style={{ flex: 1 }} />
            {saved && <span className="muted small">Saved {saved}</span>}
          </div>
          {madeStudy && (
            <p className="muted small" style={{ marginTop: 6 }}>
              A study has been started from this sermon — find it under Study, tagged
              <span className="tag">from-sermon</span>
            </p>
          )}
        </div>
      </div>

      <div className="sermon-side">
        <PassageInspector
          refs={refs}
          translation={translation}
          onTranslation={setTranslation}
          onCapture={capturePoint}
          onCaptureWord={captureWord}
        />
      </div>
    </div>
  )
}
