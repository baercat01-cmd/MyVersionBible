import { useEffect, useState } from 'react'
import { lookup, findByStrongs, type LexEntry, type StrongsHit } from '../lib/strongs'
import { bookName } from '../lib/books'
import { requestJump } from '../lib/nav'

interface Props {
  codes: string[]          // Strong's codes on the selected word(s)
  translation: string
}

/** The original-language word behind the English one currently selected. */
export default function StrongsInfo({ codes, translation }: Props) {
  const [entries, setEntries] = useState<{ code: string; entry?: LexEntry }[]>([])
  const [uses, setUses] = useState<{ code: string; hits: StrongsHit[]; total: number } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    setUses(null)
    ;(async () => {
      const out = []
      for (const code of codes) out.push({ code, entry: await lookup(code) })
      if (live) setEntries(out)
    })()
    return () => { live = false }
  }, [codes.join(',')])

  async function showUses(code: string) {
    setBusy(true)
    const r = await findByStrongs(translation, code, 60)
    setUses({ code, hits: r.hits, total: r.total })
    setBusy(false)
  }

  if (!codes.length) return null

  return (
    <div className="xref-block">
      <div className="xref-head">Original word</div>
      {entries.map(({ code, entry }) => (
        <div key={code} className="strongs">
          <div className="strongs-head">
            <span className="strongs-code">{code}</span>
            {entry && <span className="strongs-lemma">{entry.lemma}</span>}
            {entry && <span className="strongs-translit">{entry.translit}</span>}
          </div>
          {entry
            ? <>
                <p className="strongs-def">{entry.definition}</p>
                {entry.kjvUsage && <p className="meta">Rendered: {entry.kjvUsage}</p>}
              </>
            : <p className="muted small">
                Not in the bundled lexicon. Import the full Strong's dictionary from the
                Versions tab for every entry.
              </p>}
          <button className="linklike small" disabled={busy} onClick={() => showUses(code)}>
            {busy ? 'Searching…' : `Find every verse using ${code}`}
          </button>
        </div>
      ))}

      {uses && (
        <div className="strongs-uses">
          <div className="meta">
            {uses.total === 0
              ? `No tagged verses in ${translation}.`
              : `${uses.total} verse${uses.total === 1 ? '' : 's'} use ${uses.code}` +
                (uses.total > uses.hits.length ? ` — first ${uses.hits.length}` : '')}
          </div>
          {uses.hits.map(h => (
            <button
              className="xref" key={`${h.book}:${h.chapter}:${h.verse}`}
              onClick={() => requestJump({ translation, book: h.book, chapter: h.chapter, verse: h.verse })}
            >
              <span className="xref-ref">{bookName(h.book)} {h.chapter}:{h.verse}</span>
              <span className="xref-text">{h.text.slice(0, 90)}{h.text.length > 90 ? '…' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
