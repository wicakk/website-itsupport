import { X } from 'lucide-react'
import { T } from '../../theme'

const Modal = ({ title, subtitle, onClose, children, width = 640 }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
  }}>
    <div style={{ width: '100%', maxWidth: width, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: T.text, fontWeight: 700, fontSize: 16 }}>{title}</h2>
          {subtitle && <p style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
        </div>
        <button onClick={onClose}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = T.danger }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.textMuted }}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ padding: 24, maxHeight: '72vh', overflowY: 'auto' }}>{children}</div>
    </div>
  </div>
)
export default Modal
