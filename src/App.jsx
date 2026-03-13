import { AppProvider, useApp, useAuth, useNav } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import { PAGE_PERMISSIONS } from "./config/navPermissions"

import {
  DashboardPage, TicketsPage, AssetsPage, KnowledgePage,
  MonitoringPage, ReportsPage, UsersPage, SettingsPage,
} from './pages'

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

const Router = () => {
  const { page, setPage } = useNav()
  const { user } = useAuth()

  // belum login
  if (!user) return <LoginPage />

  const allowedRoles = PAGE_PERMISSIONS[page] || []
  const hasAccess = allowedRoles.includes(user.role)

  // jika tidak punya akses → redirect ke dashboard
  if (!hasAccess) {
    setPage("dashboard")
    return null
  }

  const PageComponent = PAGES[page] ?? DashboardPage

  return (
    <AppLayout>
      <PageComponent />
    </AppLayout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}