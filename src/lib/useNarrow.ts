import { useEffect, useState } from 'react'

/** True on a phone-width screen, where the notes and the passage take turns. */
export function useNarrow(query = '(max-width: 900px)'): boolean {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return narrow
}
