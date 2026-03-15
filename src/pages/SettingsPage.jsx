import { Settings } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

const SettingsPage = () => (
  <div className="flex flex-col gap-5">
    <PageHeader title="Settings" subtitle="Konfigurasi sistem IT Support" />
    <Card className="flex items-center justify-center py-12 sm:py-16 px-6">
      <div className="flex flex-col items-center text-center">
        <Settings size={36} className="text-gray-500 opacity-25 mb-3" />
        <p className="text-sm font-semibold text-gray-200 mb-1.5">Halaman Settings</p>
        <p className="text-xs text-gray-500">Fitur konfigurasi akan segera tersedia.</p>
      </div>
    </Card>
  </div>
)

export default SettingsPage