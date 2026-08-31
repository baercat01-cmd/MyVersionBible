import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reading scripture aloud through the browser's speech engine.
 *
 * This uses the voices the device already has, so it needs no API key, costs
 * nothing, and on most platforms works with no connection. Availability is the
 * catch: voices come from the operating system, so what is on offer differs
 * between a phone, a desktop and an e-reader, and a few platforms only ship
 * voices that fetch audio over the network.
 */
export interface SpeechItem { verse: number; text: string }

const RATE_KEY = 'mvb-speech-rate'
const VOICE_KEY = 'mvb-speech-voice'
const CONTINUE_KEY = 'mvb-speech-continue'

/** Long utterances get cut off in some engines, so speak in shorter pieces. */
function chunk(text: string, max = 220): string[] {
  if (text.length <= max) return [text]
  const out: string[] = []
  let rest = text
  while (rest.length > max) {
    // Prefer a sentence end, then a clause, then any space.
    const window = rest.slice(0, max)
    const cut = Math.max(
      window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '),
      window.lastIndexOf('; '), window.lastIndexOf(', '), window.lastIndexOf(' ')
    )
    const at = cut > max * 0.4 ? cut + 1 : max
    out.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) out.push(rest)
  return out
}

interface Piece { verse: number; text: string }

export function useSpeech(onVerse?: (v: number | null) => void, onFinished?: () => void) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const supported = !!synth

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState(() => localStorage.getItem(VOICE_KEY) || '')
  const [rate, setRate] = useState(() => Number(localStorage.getItem(RATE_KEY)) || 1)
  const [autoContinue, setAutoContinue] = useState(() => localStorage.getItem(CONTINUE_KEY) === '1')
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)

  const queue = useRef<Piece[]>([])
  const index = useRef(0)
  const stopped = useRef(false)

  useEffect(() => { localStorage.setItem(RATE_KEY, String(rate)) }, [rate])
  useEffect(() => { localStorage.setItem(VOICE_KEY, voiceURI) }, [voiceURI])
  useEffect(() => { localStorage.setItem(CONTINUE_KEY, autoContinue ? '1' : '0') }, [autoContinue])

  // Voices arrive asynchronously on most platforms.
  useEffect(() => {
    if (!synth) return
    const load = () => setVoices(synth.getVoices())
    load()
    synth.addEventListener?.('voiceschanged', load)
    return () => synth.removeEventListener?.('voiceschanged', load)
  }, [synth])

  const stop = useCallback(() => {
    stopped.current = true
    queue.current = []
    index.current = 0
    synth?.cancel()
    setSpeaking(false)
    setPaused(false)
    onVerse?.(null)
  }, [synth, onVerse])

  // Stop speaking if the reader goes away mid-sentence.
  useEffect(() => () => { synth?.cancel() }, [synth])

  const speakNext = useCallback(() => {
    if (!synth || stopped.current) return
    const piece = queue.current[index.current]
    if (!piece) {
      setSpeaking(false)
      onVerse?.(null)
      onFinished?.()
      return
    }
    onVerse?.(piece.verse)
    const u = new SpeechSynthesisUtterance(piece.text)
    u.rate = rate
    const voice = synth.getVoices().find(v => v.voiceURI === voiceURI)
    if (voice) u.voice = voice
    u.onend = () => {
      if (stopped.current) return
      index.current++
      speakNext()
    }
    u.onerror = () => {
      if (stopped.current) return
      index.current++
      speakNext()
    }
    synth.speak(u)
  }, [synth, rate, voiceURI, onVerse, onFinished])

  const play = useCallback((items: SpeechItem[], fromVerse?: number) => {
    if (!synth) return
    synth.cancel()
    stopped.current = false
    const start = fromVerse ? items.findIndex(i => i.verse === fromVerse) : 0
    const from = start >= 0 ? start : 0
    queue.current = items.slice(from).flatMap(i =>
      chunk(i.text).map(text => ({ verse: i.verse, text })))
    index.current = 0
    setSpeaking(true)
    setPaused(false)
    speakNext()
  }, [synth, speakNext])

  const pause = useCallback(() => { synth?.pause(); setPaused(true) }, [synth])
  const resume = useCallback(() => { synth?.resume(); setPaused(false) }, [synth])

  // Chrome stops speaking after about fifteen seconds unless nudged.
  useEffect(() => {
    if (!synth || !speaking || paused) return
    const t = setInterval(() => { if (!stopped.current) synth.resume() }, 10000)
    return () => clearInterval(t)
  }, [synth, speaking, paused])

  return {
    supported, voices, voiceURI, setVoiceURI, rate, setRate,
    autoContinue, setAutoContinue, speaking, paused,
    play, pause, resume, stop
  }
}
