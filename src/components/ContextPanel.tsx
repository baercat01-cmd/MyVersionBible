import { useState } from 'react'
import { contextForBook, contextForEra } from '../data/context'
import { bookName } from '../lib/books'

interface Props {
  book?: number
  era?: string
  eraTitle?: string
  /** Open by default in the chronological reader, closed beside the text. */
  startOpen?: boolean
}

/**
 * Historical background for what is being read: who wrote it, when, to whom,
 * and what the first hearers already knew that we do not.
 */
export default function ContextPanel({ book, era, eraTitle, startOpen }: Props) {
  const [open, setOpen] = useState(!!startOpen)
  const bc = book !== undefined ? contextForBook(book) : undefined
  const ec = era ? contextForEra(era) : undefined
  if (!bc && !ec) return null

  return (
    <div className="xref-block">
      <button className="ctx-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="xref-head" style={{ margin: 0 }}>Historical context</span>
        <span className="ctx-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="ctx-body">
          {bc && (
            <>
              <div className="ctx-title">{bookName(bc.book)}</div>
              <dl className="ctx-facts">
                <dt>Author</dt><dd>{bc.author}</dd>
                <dt>Written</dt><dd>{bc.written}</dd>
                <dt>To</dt><dd>{bc.audience}</dd>
              </dl>
              <p className="ctx-para">{bc.setting}</p>
              <p className="ctx-para"><strong>Why:</strong> {bc.purpose}</p>
              <div>{bc.themes.map(t => <span className="tag" key={t}>{t}</span>)}</div>
              {bc.note && <p className="placement-note">ⓘ {bc.note}</p>}
            </>
          )}

          {ec && (
            <>
              <div className="ctx-title" style={{ marginTop: bc ? 14 : 0 }}>
                {eraTitle || 'The period'}
              </div>
              {ec.background.split(/\n\s*\n/).map((p, i) => <p className="ctx-para" key={i}>{p}</p>)}
              <div className="ctx-title-sm">Elsewhere in the world</div>
              {ec.world.split(/\n\s*\n/).map((p, i) => <p className="ctx-para" key={i}>{p}</p>)}
            </>
          )}
        </div>
      )}
    </div>
  )
}
