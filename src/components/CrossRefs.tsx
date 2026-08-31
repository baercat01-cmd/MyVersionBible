import { useEffect, useState } from 'react'
import { xrefsFor } from '../lib/xrefs'
import { parsePassage, loadPassage, passageLabel } from '../lib/passages'
import { requestJump } from '../lib/nav'

interface Props {
  book: number
  chapter: number
  verse: number
  translation: string
}

interface Ref { ref: string; label: string; text: string; book: number; chapter: number; verse: number }

/** Passages that speak to the verse currently selected. */
export default function CrossRefs({ book, chapter, verse, translation }: Props) {
  const [refs, setRefs] = useState<Ref[] | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let live = true
    setRefs(null); setExpanded(false)
    ;(async () => {
      const { targets } = await xrefsFor(book, chapter, verse)
      const out: Ref[] = []
      for (const t of targets) {
        try {
          const p = parsePassage(t)
          const chapters = await loadPassage(translation, p)
          const text = chapters.flatMap(c => c.verses).map(v => v.t).join(' ')
          out.push({
            ref: t, label: passageLabel(p), text,
            book: p.book, chapter: p.c1, verse: p.v1 ?? 1
          })
        } catch {
          // Skip anything that will not parse rather than breaking the panel.
        }
      }
      if (live) setRefs(out)
    })()
    return () => { live = false }
  }, [book, chapter, verse, translation])

  if (refs === null) return <div className="xref-block"><p className="muted small">Looking up cross references…</p></div>
  if (!refs.length) {
    return (
      <div className="xref-block">
        <div className="xref-head">Cross references</div>
        <p className="muted small">
          None for this verse yet. The bundled set covers messianic prophecy and the New
          Testament's use of the Old — import the full set from the Versions tab for
          complete coverage.
        </p>
      </div>
    )
  }

  const shown = expanded ? refs : refs.slice(0, 6)
  return (
    <div className="xref-block">
      <div className="xref-head">Cross references <span className="muted">({refs.length})</span></div>
      {shown.map(r => (
        <button
          className="xref" key={r.ref}
          onClick={() => requestJump({ translation, book: r.book, chapter: r.chapter, verse: r.verse })}
          title={`Open ${r.label}`}
        >
          <span className="xref-ref">{r.label}</span>
          {r.text
            ? <span className="xref-text">{r.text.slice(0, 110)}{r.text.length > 110 ? '…' : ''}</span>
            : <span className="xref-text muted">not in {translation}</span>}
        </button>
      ))}
      {refs.length > 6 && (
        <button className="linklike small" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show fewer' : `Show all ${refs.length}`}
        </button>
      )}
    </div>
  )
}
