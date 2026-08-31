import { useState } from 'react'
import { saveNote, type NoteRec, type VerseRef } from '../lib/db'
import { TEMPLATES, getTemplate } from '../lib/templates'
import { formatRefs } from '../lib/refs'

interface Props {
  note?: NoteRec               // existing note to edit
  kind: NoteRec['kind']
  refs?: VerseRef[]            // pre-anchored refs (from the reader)
  onDone: () => void
}

export default function NoteEditor({ note, kind, refs, onDone }: Props) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [templateId, setTemplateId] = useState<string | null>(note?.template ?? (kind === 'study' ? TEMPLATES[0].id : null))
  const [sections, setSections] = useState<Record<string, string>>(note?.sections || {})
  const [tags, setTags] = useState((note?.tags || []).join(', '))
  const [saving, setSaving] = useState(false)

  // Studies pick a template here; sermon notes arrive carrying their own, and
  // are edited through the same section fields rather than losing them.
  const template = kind === 'study' || note?.template ? getTemplate(templateId) : undefined
  const anchoredRefs = note?.refs?.length ? note.refs : (refs || [])

  async function handleSave() {
    setSaving(true)
    await saveNote({
      id: note?.id,
      kind,
      title,
      content,
      template: template?.id ?? null,
      sections: template ? sections : null,
      refs: anchoredRefs,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })
    setSaving(false)
    onDone()
  }

  return (
    <div className="card editor-section">
      {anchoredRefs.length > 0 && (
        <p className="meta">📌 {formatRefs(anchoredRefs)}</p>
      )}
      <input
        type="text"
        placeholder={kind === 'journal' ? 'Entry title' : 'Title'}
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: 8, fontWeight: 600 }}
      />

      {kind === 'study' && !note && (
        <div className="row" style={{ marginBottom: 8 }}>
          <label className="small muted">Template:</label>
          <select value={templateId ?? ''} onChange={e => { setTemplateId(e.target.value); setSections({}) }}>
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {template ? (
        template.sections.map(s => (
          <div key={s.id}>
            <label>{s.label}</label>
            <div className="hint">{s.hint}</div>
            <textarea
              value={sections[s.id] || ''}
              onChange={e => setSections({ ...sections, [s.id]: e.target.value })}
            />
          </div>
        ))
      ) : (
        <textarea
          placeholder={kind === 'verse' ? 'Your note on this passage…' : 'Write freely…'}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ minHeight: kind === 'journal' ? 200 : 120 }}
        />
      )}

      <div style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={saving} onClick={handleSave}>Save</button>
        <button className="btn secondary" onClick={onDone}>Cancel</button>
      </div>
    </div>
  )
}
