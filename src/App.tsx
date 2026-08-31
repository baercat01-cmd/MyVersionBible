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

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'read', label: 'Read', icon: '📖' },
  { id: 'story', label: 'Story', icon: '🕰️' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'sermon', label: 'Sermon', icon: '🎤' },
  { id: 'study', label: 'Study', icon: '✏️' },
  { id: 'lists', label: 'Lists', icon: '🔖' },
  { id: 'versions', label: 'Versions', icon: '⬇️' },
  { id: 'print', label: 'Print', icon: '🖨️' },
  { id: 'account', label: 'Sync', icon: '☁️' }
]

const TAB_KEY = 'mvb-tab'

export default function App() {
  // Reopen on whichever tab was last used, so the app comes back where you left it.
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem(TAB_KEY) as Tab | null
    return saved && TABS.some(t => t.id === saved) ? saved : 'read'
  })
  useEffect(() => { localStorage.setItem(TAB_KEY, tab) }, [tab])
  // A jump requested from search or a cross reference opens the reader.
  useEffect(() => onJump(() => setTab('read')), [])
  // A new build waiting behind the service worker, announced rather than forced.
  const [updateReady, setUpdateReady] = useState(false)
  useEffect(() => onUpdateWaiting(setUpdateReady), [])

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
      <nav className="tabbar no-print">
        {TABS.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
