const Badge = ({ label, cfg, dot = false, pulse = false }) => (
  <span style={{
    background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    letterSpacing: '0.02em', whiteSpace: 'nowrap', userSelect: 'none',
  }}>
    {dot && (
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: cfg.dot ?? cfg.text,
        display: 'inline-block',
        animation: pulse ? 'itsPulse 1.4s ease-in-out infinite' : 'none',
      }} />
    )}
    {label}
  </span>
)
export default Badge
