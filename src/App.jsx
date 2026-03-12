import { AppProvider, useApp, useAuth, useNav } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import {
  DashboardPage, TicketsPage, AssetsPage, KnowledgePage,
  MonitoringPage, ReportsPage, UsersPage, SettingsPage,
} from './pages'

// ─── Page registry ────────────────────────────────────────────────────────────
const PAGES = {
  dashboard:  DashboardPage,
  tickets:    TicketsPage,
  assets:     AssetsPage,
  knowledge:  KnowledgePage,
  monitoring: MonitoringPage,
  reports:    ReportsPage,
  users:      UsersPage,
  settings:   SettingsPage,
}

// ─── Router ───────────────────────────────────────────────────────────────────
const Router = () => {
  const { page }  = useNav()
  const { user }  = useAuth()

  if (!user) return <LoginPage />

  const PageComponent = PAGES[page] ?? DashboardPage
  return (
    <AppLayout>
      <PageComponent />
    </AppLayout>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}
