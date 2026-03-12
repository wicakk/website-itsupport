import { T } from '../../theme'

const ProgressBar = ({ value }) => {
  const color = value >= 85 ? T.danger : value >= 70 ? T.warning : T.success
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg,${color}88,${color})`, transition: 'width 0.7s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "'Sora',monospace", color, minWidth: 32, textAlign: 'right' }}>{value}%</span>
    </div>
  )
}
export default ProgressBar
