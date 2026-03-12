import { T } from '../../theme'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useApp } from '../../context/AppContext'
import { NAV_ITEMS } from '../../data/mockData'

const AppLayout = ({ children }) => {
  const { setNotifOpen } = useApp()
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.bg }} onClick={() => setNotifOpen(false)}>
      <Sidebar navItems={NAV_ITEMS} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main className="page-enter" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
