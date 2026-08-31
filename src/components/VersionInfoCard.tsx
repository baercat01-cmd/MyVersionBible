import { useState } from 'react'
import { versionInfoByName } from '../data/versions'

const APPROACH_LABEL: Record<string, string> = {
  formal: 'Word-for-word',
  moderate: 'Balanced',
  dynamic: 'Thought-for-thought',
  paraphrase: 'Paraphrase',
  'interlinear-source': 'Original-language source text'
}

/** What a translation is, where it came from, and what it is good for. */
export default function VersionInfoCard({ id, fullName }: { id: string; fullName?: string }) {
  const [open, setOpen] = useState(false)
  const info = versionInfoByName(id, fullName)
  if (!info) return null

  return (
    <div className="verinfo">
      <button className="ctx-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="verinfo-summary">
          <strong>{APPROACH_LABEL[info.approach] || info.approach}</strong>
          <span className="muted"> · {info.year}</span>
          {!open && info.bestFor.length > 0 && (
            <span className="muted"> · best for {info.bestFor.slice(0, 2).join(', ').toLowerCase()}</span>
          )}
        </span>
        <span className="ctx-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="ctx-body">
          <dl className="ctx-facts">
            <dt>Made by</dt><dd>{info.translators}</dd>
            <dt>From</dt><dd>{info.sourceTexts}</dd>
            <dt>Reading</dt><dd>{info.readingLevel}</dd>
          </dl>
          <p className="ctx-para">{info.approachNote}</p>
          <p className="ctx-para">{info.history}</p>
          <div>
            <div className="ctx-title-sm">Good for</div>
            <div>{info.bestFor.map(b => <span className="tag" key={b}>{b}</span>)}</div>
          </div>
          <p className="placement-note">ⓘ {info.watchFor}</p>
        </div>
      )}
    </div>
  )
}
