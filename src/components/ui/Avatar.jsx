import { T } from '../../theme'

const Avatar = ({ initials, size = 32, color = T.accent }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.35),
    background: `${color}20`, border: `1px solid ${color}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.31, fontWeight: 700, color, flexShrink: 0, userSelect: 'none',
  }}>
    {initials}
  </div>
)
export default Avatar
