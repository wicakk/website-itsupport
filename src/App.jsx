// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom"
import { AppProvider, useAuth } from "./context/AppContext"
import AppLayout from "./components/layout/AppLayout"
import LoginPage from "./pages/LoginPage"
import { ThemeProvider } from "./context/ThemeContext"
import CanAccess from "./components/ui/CanAccess"
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
  KnowledgeDetailPage,
} from "./pages"
import RolesPage from "./pages/RolesPage"

function ProtectedRoutes() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/tickets"    element={<TicketsPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/assets"     element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/knowledge"  element={<KnowledgePage />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/reports"    element={<ReportsPage />} />
        <Route path="/users"      element={<UsersPage />} />
        <Route path="/settings"   element={<SettingsPage />} />

        {/* ── Role Management — hanya super_admin ── */}
        <Route
          path="/roles"
          element={
            <CanAccess role="super_admin" redirect="/dashboard">
              <RolesPage />
            </CanAccess>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AppLayout>
  )
}

function Router() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </ThemeProvider>
  )
}
