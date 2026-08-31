import { useState } from 'react'
import type { useSpeech } from '../lib/speech'

type Speech = ReturnType<typeof useSpeech>

interface Props {
  speech: Speech
  /** Start playing — from the selected verse when there is one. */
  onPlay: () => void
  /** Shown when a selection means playback will start part-way in. */
  fromLabel?: string
}

/** Read-aloud controls: play, pause, speed and voice. */
export default function AudioPlayer({ speech, onPlay, fromLabel }: Props) {
  const [open, setOpen] = useState(false)

  if (!speech.supported) {
    return (
      <span className="small muted" title="This browser has no speech engine">
        🔇 No voice on this device
      </span>
    )
  }

  return (
    <span className="audiobar">
      {!speech.speaking ? (
        <button className="btn small" onClick={onPlay} title="Read aloud">
          ▶ Listen{fromLabel ? ` from ${fromLabel}` : ''}
        </button>
      ) : (
        <>
          {speech.paused
            ? <button className="btn small" onClick={speech.resume} title="Resume">▶</button>
            : <button className="btn small" onClick={speech.pause} title="Pause">❚❚</button>}
          <button className="btn secondary small" onClick={speech.stop} title="Stop">■</button>
        </>
      )}
      <button
        className="btn secondary small" onClick={() => setOpen(o => !o)}
        title="Voice and speed" aria-expanded={open}
      >⚙</button>

      {open && (
        <div className="audio-settings">
          <div className="xref-head">Reading voice</div>
          <label className="small muted" htmlFor="voicesel">Voice</label>
          <select
            id="voicesel" value={speech.voiceURI}
            onChange={e => speech.setVoiceURI(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          >
            <option value="">Device default</option>
            {speech.voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}{v.localService ? '' : ' (needs connection)'}
              </option>
            ))}
          </select>
          {speech.voices.length === 0 && (
            <p className="muted small">
              No voices reported yet. They come from the device, so on Android you may
              need a text-to-speech engine installed in system settings.
            </p>
          )}

          <label className="small muted" htmlFor="ratesel">Speed — {speech.rate.toFixed(1)}×</label>
          <input
            id="ratesel" type="range" min="0.5" max="2" step="0.1"
            value={speech.rate}
            onChange={e => speech.setRate(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <label className="row small muted" style={{ cursor: 'pointer', marginTop: 6 }}>
            <input
              type="checkbox" checked={speech.autoContinue}
              onChange={e => speech.setAutoContinue(e.target.checked)}
            />
            Keep going into the next chapter
          </label>
          <button className="linklike small" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </span>
  )
}
