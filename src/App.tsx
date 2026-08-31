import { useEffect, useState } from 'react'
import { onJump } from './lib/nav'
import { BUILD_ID, applyUpdate, onUpdateWaiting } from './lib/pwa'
import ReaderView from './views/ReaderView'
import ChronoView from './views/ChronoView'
import SearchView from './views/SearchView'
import CollectionsView from './views/CollectionsView'
import VersionsView from './views/VersionsView'
import StudyView from './views/StudyView'
import SermonView from './views/SermonView'
import PrintView from './views/PrintView'
import AccountView from './views/AccountView'

type Tab = 'read' | 'story' | 'search' | 'sermon' | 'study' | 'lists' | 'versions' | 'print' | 'account'

interface TabDef { id: Tab; label: string; icon: string; note?: string }

// The five things done while reading or listening live on the bar; everything
// that is set up once and then left alone lives behind More, so a phone is not
// asked to fit nine targets across its width.
const MAIN_TABS: TabDef[] = [
  { id: 'read', label: 'Read', icon: '📖' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'sermon', label: 'Sermon', icon: '🎤' },
  { id: 'study', label: 'Study', icon: '✏️' }
]

const MORE_TABS: TabDef[] = [
  { id: 'story', label: 'Story', icon: '🕰️', note: 'Read the Bible in the order it happened' },
  { id: 'lists', label: 'Lists', icon: '🔖', note: 'Verse collections and memorisation' },
  { id: 'versions', label: 'Versions', icon: '⬇️', note: 'Download translations, cross references, lexicon' },
  { id: 'print', label: 'Print', icon: '🖨️', note: 'Compile your notes into a study book' },
  { id: 'account', label: 'Sync', icon: '☁️', note: 'Sign in to sync across devices' }
]

const TAB_KEY = 'mvb-tab'
const ALL_TABS = [...MAIN_TABS, ...MORE_TABS]

export default function App() {
  // Reopen on whichever tab was last used, so the app comes back where you left it.
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem(TAB_KEY) as Tab | null
    return saved && ALL_TABS.some(t => t.id === saved) ? saved : 'read'
  })
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => { localStorage.setItem(TAB_KEY, tab) }, [tab])
  // A jump requested from search or a cross reference opens the reader.
  useEffect(() => onJump(() => { setTab('read'); setMoreOpen(false) }), [])
  // A new build waiting behind the service worker, announced rather than forced.
  const [updateReady, setUpdateReady] = useState(false)
  useEffect(() => onUpdateWaiting(setUpdateReady), [])

  const inMore = MORE_TABS.some(t => t.id === tab)
  const current = ALL_TABS.find(t => t.id === tab)

  function go(next: Tab) {
    setTab(next)
    setMoreOpen(false)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <div className="topbar no-print">
        <h1>MyVersionBible</h1>
        <div className="spacer" />
        <span className="buildstamp" title={`Build ${BUILD_ID}`}>{BUILD_ID}</span>
      </div>

      {updateReady && (
        <div className="updatebar no-print">
          <span>A newer version of the app is ready.</span>
          <button className="btn small" onClick={applyUpdate}>Update now</button>
          <button className="btn secondary small" onClick={() => setUpdateReady(false)}>Later</button>
        </div>
      )}

      <div className="main">
        {tab === 'read' && <ReaderView />}
        {tab === 'story' && <ChronoView />}
        {tab === 'search' && <SearchView />}
        {tab === 'sermon' && <SermonView />}
        {tab === 'study' && <StudyView />}
        {tab === 'lists' && <CollectionsView />}
        {tab === 'versions' && <VersionsView />}
        {tab === 'print' && <PrintView />}
        {tab === 'account' && <AccountView />}
      </div>

      {moreOpen && (
        <>
          <div className="sheet-scrim no-print" onClick={() => setMoreOpen(false)} />
          <div className="sheet no-print" role="menu">
            {MORE_TABS.map(t => (
              <button
                key={t.id}
                className={`sheet-item ${tab === t.id ? 'active' : ''}`}
                onClick={() => go(t.id)}
              >
                <span className="icon">{t.icon}</span>
                <span>
                  <span className="sheet-label">{t.label}</span>
                  {t.note && <span className="sheet-note">{t.note}</span>}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <nav className="tabbar no-print">
        {MAIN_TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
            <span className="icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button
          className={inMore || moreOpen ? 'active' : ''}
          onClick={() => setMoreOpen(o => !o)}
          aria-expanded={moreOpen}
          aria-label="More"
        >
          <span className="icon">{inMore && current ? current.icon : '☰'}</span>
          {inMore && current ? current.label : 'More'}
        </button>
      </nav>
    </>
  )
}
