import { useState } from 'react'
import ReaderView from './views/ReaderView'
import VersionsView from './views/VersionsView'
import StudyView from './views/StudyView'
import PrintView from './views/PrintView'
import AccountView from './views/AccountView'

type Tab = 'read' | 'study' | 'versions' | 'print' | 'account'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'read', label: 'Read', icon: '📖' },
  { id: 'study', label: 'Study', icon: '✏️' },
  { id: 'versions', label: 'Versions', icon: '⬇️' },
  { id: 'print', label: 'Print', icon: '🖨️' },
  { id: 'account', label: 'Sync', icon: '☁️' }
]

export default function App() {
  const [tab, setTab] = useState<Tab>('read')

  return (
    <>
      <div className="topbar no-print">
        <h1>MyVersionBible</h1>
        <div className="spacer" />
      </div>
      <div className="main">
        {tab === 'read' && <ReaderView />}
        {tab === 'study' && <StudyView />}
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
