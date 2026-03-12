import { Settings } from 'lucide-react'
import { T } from '../theme'
import { Card, PageHeader } from '../components/ui'

const SettingsPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <PageHeader title="Settings" subtitle="Konfigurasi sistem IT Support" />
    <Card style={{ padding: 48 }}>
      <div style={{ textAlign: 'center', color: T.textMuted }}>
        <Settings size={36} style={{ marginBottom: 12, opacity: .25 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>Halaman Settings</p>
        <p style={{ fontSize: 12 }}>Fitur konfigurasi akan segera tersedia.</p>
      </div>
    </Card>
  </div>
)

export default SettingsPage
