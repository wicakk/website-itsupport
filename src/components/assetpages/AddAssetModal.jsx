import { useState } from 'react'
import { Modal, PrimaryButton, Input } from '../ui'
import QRCanvas from './QRCanvas'

const AddAssetModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('')
  const [serial, setSerial] = useState('')

  const handleSave = () => {
    onSave({ name, serial })
    setName('')
    setSerial('')
    onClose()
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Tambah Aset">
      <Input label="Nama Aset" value={name} onChange={e => setName(e.target.value)} />
      <Input label="Serial Number" value={serial} onChange={e => setSerial(e.target.value)} />
      {serial && <QRCanvas value={serial} size={100} />}
      <PrimaryButton onClick={handleSave}>Simpan</PrimaryButton>
    </Modal>
  )
}

export default AddAssetModal