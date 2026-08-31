import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveNote, type NoteRec, type VerseRef } from '../lib/db'
import { formatRef } from '../lib/refs'
import {
  SERMON_TEMPLATE, parsePoints, serialisePoints, resolveReference,
  sermonMeta, studyFromSermon, type SermonPoint
} from '../lib/sermons'
import { useNarrow } from '../lib/useNarrow'
import PassageInspector from './PassageInspector'
import Section from './Section'

interface Props {
  note?: NoteRec
  onDone: () => void
  onOpenStudy?: (study: NoteRec) => void
}

const today = () => new Date().toISOString().slice(0, 10)

/** One line of the "preaching from" list: what was typed, and what it resolved to. */
interface RefLine { input: string; refs: VerseRef[]; label: string; error: boolean }

const emptyLine = (): RefLine => ({ input: '', refs: [], label: '', error: false })

/**
 * Taking notes while a sermon is being preached.
 *
 * On a phone the notes and the passage take turns rather than sitting side by
 * side, so neither is a scroll away from the other: one tap switches, and a
 * point captured from the passage lands in the outline without leaving the
 * text. Everything is saved as it is typed, because a sermon does not wait.
 */
export default function SermonEditor({ note, onDone, onOpenStudy }: Props) {
  const narrow = useNarrow()
  const [pane, setPane] = useState<'notes' | 'passage'>('notes')

  const [title, setTitle] = useState(note?.title || '')
  const [speaker, setSpeaker] = useState(sermonMeta(note, 'speaker'))
  const [series, setSeries] = useState(sermonMeta(note, 'series'))
  const [place, setPlace] = useState(sermonMeta(note, 'place'))
  const [preached, setPreached] = useState(sermonMeta(note, 'preached') || today())

  // The passages preached from, as line items - a sermon rarely stays in one.
  const [lines, setLines] = useState<RefLine[]>(() => {
    const saved = note?.sections?.passages
    if (saved) {
      return saved.split('\n').filter(Boolean).map(input => ({ input, refs: [], label: input, error: false }))
    }
    if (note?.refs?.length) {
      return note.refs.map(r => ({ input: formatRef(r), refs: [r], label: formatRef(r), error: false }))
    }
    return [emptyLine()]
  })

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
  const [flash, setFlash] = useState('')

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const [translation, setTranslation] = useState(note?.refs?.[0]?.translation || '')
  useEffect(() => {
    if (!translation && translations.length) setTranslation(translations[0].id)
  }, [translations.length])

  const idRef = useRef(note?.id)
  const dirtyRef = useRef(false)
  const pointRefs = useRef<(HTMLInputElement | null)[]>([])
  const allRefs = lines.flatMap(l => l.refs)

  // Resolve every typed line against the chosen version.
  useEffect(() => {
    let live = true
    ;(async () => {
      const resolved = await Promise.all(lines.map(async l => {
        if (!l.input.trim()) return { ...l, refs: [], label: '', error: false }
        const found = await resolveReference(l.input, translation)
        return found
          ? { ...l, refs: found.refs, label: found.label, error: false }
          : { ...l, refs: [], label: '', error: true }
      }))
      const changed = resolved.some((r, i) =>
        r.label !== lines[i].label || r.error !== lines[i].error || r.refs.length !== lines[i].refs.length)
      if (live && changed) setLines(resolved)
    })()
    return () => { live = false }
  }, [lines.map(l => l.input).join(' '), translation])

  function collect() {
    return {
      id: idRef.current,
      kind: 'sermon' as const,
      title,
      content: '',
      template: SERMON_TEMPLATE.id,
      refs: allRefs,
      sections: {
        speaker, series, place, preached,
        // The references as they were given, one per line, so a whole chapter
        // stays a whole chapter and the list comes back as it was typed.
        passages: lines.map(l => l.input.trim()).filter(Boolean).join('\n'),
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

  useEffect(() => {
    dirtyRef.current = true
    const timer = setTimeout(() => { if (dirtyRef.current) persist() }, 1500)
    return () => clearTimeout(timer)
  }, [title, speaker, series, place, preached, lines, points, fields, tags])

  useEffect(() => () => { if (dirtyRef.current) persist() }, [])

  function setLine(i: number, input: string) {
    setLines(ls => ls.map((l, j) => (j === i ? { ...l, input } : l)))
  }

  function addLine() {
    setLines(ls => [...ls, emptyLine()])
  }

  function removeLine(i: number) {
    setLines(ls => (ls.length === 1 ? [emptyLine()] : ls.filter((_, j) => j !== i)))
  }

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

  function say(message: string) {
    setFlash(message)
    setTimeout(() => setFlash(''), 1800)
  }

  /** A verse captured from the passage becomes the next point, without leaving it. */
  function capturePoint(ref: VerseRef, text: string) {
    setPoints(ps => {
      const last = ps[ps.length - 1]
      const quoted = `"${text}"`
      if (last && !last.text.trim() && !last.ref) return [...ps.slice(0, -1), { ref, text: quoted }]
      return [...ps, { ref, text: quoted }]
    })
    say('Added to the outline')
  }

  function captureWord(line: string) {
    setFields(f => ({ ...f, words: f.words ? `${f.words}\n${line}` : line }))
    say('Added to the words')
  }

  async function makeStudy() {
    const rec = await persist()
    const study = await studyFromSermon(rec)
    say('Study started - find it under Study')
    onOpenStudy?.(study)
  }

  const questionCount = fields.questions.split('\n').filter(l => l.trim()).length
  const wordCount = fields.words.split('\n').filter(l => l.trim()).length
  const showNotes = !narrow || pane === 'notes'
  const showPassage = !narrow || pane === 'passage'
  const resolvedLines = lines.filter(l => l.refs.length).length

  return (
    <div className="sermon-wrap">
      {narrow && (
        <div className="segmented no-print">
          <button className={pane === 'notes' ? 'on' : ''} onClick={() => setPane('notes')}>Notes</button>
          <button className={pane === 'passage' ? 'on' : ''} onClick={() => setPane('passage')}>
            Passage{resolvedLines ? ` (${resolvedLines})` : ''}
          </button>
        </div>
      )}

      {flash && <div className="sermon-flash">{flash}</div>}

      <div className="sermon-grid">
        {showNotes && (
          <div className="sermon-notes">
            <div className="card editor-section">
              <input
                type="text" placeholder="Sermon title" value={title}
                onChange={e => setTitle(e.target.value)} className="sermon-title"
              />
              <div className="row sermon-meta">
                <input type="text" placeholder="Preacher" value={speaker} onChange={e => setSpeaker(e.target.value)} />
                <input type="text" placeholder="Series" value={series} onChange={e => setSeries(e.target.value)} />
                <input type="text" placeholder="Where" value={place} onChange={e => setPlace(e.target.value)} />
                <input type="date" value={preached} onChange={e => setPreached(e.target.value)} />
              </div>

              <label>Preaching from</label>
              {lines.map((l, i) => (
                <div className="sermon-refline" key={i}>
                  <input
                    id={i === 0 ? 'sermon-ref' : undefined}
                    type="text" placeholder="John 3:16-18"
                    value={l.input} onChange={e => setLine(i, e.target.value)}
                    className={l.error ? 'bad' : ''}
                  />
                  {l.label && <span className="tag">{l.label}</span>}
                  <button className="linklike" onClick={() => removeLine(i)} aria-label="Remove passage">x</button>
                </div>
              ))}
              <button className="btn secondary small" onClick={addLine}>+ Passage</button>
            </div>

            <div className="card editor-section">
              <label>Big idea</label>
              <textarea
                value={fields.bigidea} onChange={e => setFields({ ...fields, bigidea: e.target.value })}
                className="sermon-idea"
              />

              <label>Outline</label>
              {points.map((p, i) => (
                <div className="sermon-point" key={i}>
                  <input
                    className="sermon-point-ref" type="text" placeholder="ref"
                    value={p.ref ? formatRef(p.ref) : ''}
                    onChange={async e => {
                      const found = e.target.value.trim() ? await resolveReference(e.target.value, translation) : null
                      setPoint(i, { ref: found ? found.refs[0] : null })
                    }}
                  />
                  <input
                    className="sermon-point-text" type="text" placeholder={`Point ${i + 1}`}
                    ref={el => { pointRefs.current[i] = el }}
                    value={p.text} onChange={e => setPoint(i, { text: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint(i) } }}
                  />
                  <button className="linklike" onClick={() => movePoint(i, -1)} aria-label="Move up">^</button>
                  <button className="linklike" onClick={() => movePoint(i, 1)} aria-label="Move down">v</button>
                  <button className="linklike" onClick={() => removePoint(i)} aria-label="Remove point">x</button>
                </div>
              ))}
              <button className="btn secondary small" onClick={() => addPoint(points.length - 1)}>+ Point</button>
            </div>

            <div className="card sermon-folds">
              <Section label="Words to look at" badge={wordCount ? String(wordCount) : undefined}>
                <textarea value={fields.words} onChange={e => setFields({ ...fields, words: e.target.value })} />
              </Section>
              <Section label="Quotes and illustrations">
                <textarea value={fields.quotes} onChange={e => setFields({ ...fields, quotes: e.target.value })} />
              </Section>
              <Section label="Application">
                <textarea value={fields.application} onChange={e => setFields({ ...fields, application: e.target.value })} />
              </Section>
              <Section label="Questions to study later" badge={questionCount ? String(questionCount) : undefined}>
                <textarea value={fields.questions} onChange={e => setFields({ ...fields, questions: e.target.value })} />
              </Section>
              <Section label="Tags">
                <input
                  type="text" placeholder="prayer, grace, romans" value={tags}
                  onChange={e => setTags(e.target.value)} style={{ width: '100%' }}
                />
              </Section>
            </div>

            <div className="card row sermon-actions">
              <button className="btn" onClick={async () => { await persist(); onDone() }}>Done</button>
              <button className="btn secondary" onClick={makeStudy}>Study deeper</button>
              <div style={{ flex: 1 }} />
              {saved && <span className="muted small">Saved {saved}</span>}
            </div>
          </div>
        )}

        {showPassage && (
          <div className="sermon-side">
            <PassageInspector
              refs={allRefs}
              translation={translation}
              onTranslation={setTranslation}
              onCapture={capturePoint}
              onCaptureWord={captureWord}
            />
          </div>
        )}
      </div>
    </div>
  )
}
