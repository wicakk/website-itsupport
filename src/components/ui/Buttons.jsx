import { T } from '../../theme'

export const PrimaryButton = ({ children, icon: Icon, onClick, style = {} }) => (
  <button onClick={onClick}
    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: `linear-gradient(135deg,${T.accent},${T.accentDark})`, border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: `0 4px 16px ${T.accentGlow}`, fontFamily: "'Sora',sans-serif", transition: 'opacity 0.2s', ...style }}>
    {Icon && <Icon size={14} />}{children}
  </button>
)

export const GhostButton = ({ children, onClick, style = {} }) => (
  <button onClick={onClick}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.text }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = T.textMuted }}
    style={{ padding: '9px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, borderRadius: 10, color: T.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Sora',sans-serif", transition: 'all 0.2s', ...style }}>
    {children}
  </button>
)
