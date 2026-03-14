import { Routes, Route, Navigate } from "react-router-dom"
import { AppProvider, useAuth } from "./context/AppContext"

import AppLayout from "./components/layout/AppLayout"
import LoginPage from "./pages/LoginPage"

import {
  DashboardPage,
  TicketsPage,
  AssetsPage,
  KnowledgePage,
  MonitoringPage,
  ReportsPage,
  UsersPage,
  SettingsPage,
  TicketDetailPage,
  AssetDetailPage,
} from "./pages"

function ProtectedRoutes() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" />} />

        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
      </Routes>
    </AppLayout>
  )
}

function Router() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />

      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  )
}