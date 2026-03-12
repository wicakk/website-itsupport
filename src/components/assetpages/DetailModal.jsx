import { useState } from 'react'
import { Modal, Tabs, Tab } from '../ui'
import QRCanvas from './QRCanvas'

const DetailModal = ({ isOpen, onClose, asset }) => {
  const [activeTab, setActiveTab] = useState('qr')

  if (!asset) return null

  return (
    <Modal open={isOpen} onClose={onClose} title={`Detail ${asset.name}`}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="qr" label="QR Code">
          <QRCanvas value={asset.serial} size={150} />
        </Tab>
        <Tab value="depreciation" label="Depresiasi">
          <div>Nilai awal: {asset.value}</div>
          <div>Depresiasi: {asset.depreciation}</div>
        </Tab>
        <Tab value="pm" label="PM">
          <div>Jadwal PM:</div>
          <ul>
            {asset.pm_schedules?.map((pm, i) => (
              <li key={i}>{pm.next_date} - {pm.status}</li>
            ))}
          </ul>
        </Tab>
      </Tabs>
    </Modal>
  )
}

export default DetailModal