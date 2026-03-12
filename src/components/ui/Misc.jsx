import { T } from '../../theme'

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
    <div>
      <h1 style={{ color: T.text, fontWeight: 800, fontSize: 22 }}>{title}</h1>
      {subtitle && <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
)

export const SectionHeader = ({ title, action, actionLabel = 'Lihat Semua' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>{title}</h3>
    {action && <button onClick={action} style={{ color: T.accent, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{actionLabel} →</button>}
  </div>
)

export const FilterTabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {tabs.map(tab => (
      <button key={tab} onClick={() => onChange(tab)} style={{ padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', border: active === tab ? 'none' : `1px solid ${T.border}`, background: active === tab ? T.accent : 'rgba(255,255,255,0.04)', color: active === tab ? '#fff' : T.textMuted }}>
        {tab}
      </button>
    ))}
  </div>
)

export const StatCard = ({ label, value, change, positive, icon: Icon, iconColor }) => (
  <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: '0 16px 0 70px', background: `${iconColor}08`, pointerEvents: 'none' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${iconColor}15`, border: `1px solid ${iconColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={iconColor} />
      </div>
      {change != null && <span style={{ fontSize: 11, fontWeight: 600, color: positive ? T.success : T.danger }}>{positive ? '↑' : '↓'} {change}</span>}
    </div>
    <div style={{ color: T.text, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    <div style={{ color: T.textMuted, fontSize: 12, marginTop: 5 }}>{label}</div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${iconColor}55,transparent)` }} />
  </div>
)

export const EmptyState = ({ icon: Icon, message }) => (
  <div style={{ padding: '52px 0', textAlign: 'center', color: T.textDim }}>
    <Icon size={28} style={{ marginBottom: 10, opacity: .3 }} />
    <p style={{ fontSize: 13 }}>{message}</p>
  </div>
)
