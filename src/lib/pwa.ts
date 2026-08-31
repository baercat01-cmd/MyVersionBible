import { registerSW } from 'virtual:pwa-register'

/**
 * Keeping an installed copy up to date.
 *
 * The app is installed to a home screen and then opened for weeks without a
 * normal page load, so a new build can sit behind the service worker unseen —
 * which looks exactly like a feature never shipping. So the worker is asked for
 * an update whenever the app comes back to the foreground, and the waiting
 * version is announced rather than swapped in silently: a reload in the middle
 * of a sermon is not something to do without asking.
 */

type Listener = (waiting: boolean) => void

const listeners = new Set<Listener>()
let waiting = false
let apply: ((reload: boolean) => Promise<void>) | null = null

const HOUR = 60 * 60 * 1000

export function startUpdates(): void {
  apply = registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => { if (navigator.onLine) reg.update().catch(() => { /* offline is fine */ }) }
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check() })
      window.addEventListener('online', check)
      setInterval(check, HOUR)
    },
    onNeedRefresh() {
      waiting = true
      listeners.forEach(l => l(true))
    }
  })
}

export function onUpdateWaiting(fn: Listener): () => void {
  listeners.add(fn)
  fn(waiting)
  return () => { listeners.delete(fn) }
}

/** Take the waiting version — the page reloads into it. */
export function applyUpdate(): void {
  apply?.(true)
}

export const BUILD_ID: string = __BUILD_ID__
