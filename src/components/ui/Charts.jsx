import { T } from '../../theme'

export const BarChart = ({ data }) => {
  const max = Math.max(...data.flatMap(d => [d.o, d.r]))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 120, width: '100%', paddingBottom: 20 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 90 }}>
            <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg,#3B8BFF,#1a5ccc)', opacity: .85, height: `${(d.o / max) * 100}%`, minHeight: 3 }} />
            <div style={{ flex: 1, borderRadius: '3px 3px 0 0', background: 'linear-gradient(180deg,#10B981,#059669)', opacity: .85, height: `${(d.r / max) * 100}%`, minHeight: 3 }} />
          </div>
          <span style={{ fontSize: 9, color: T.textDim, marginTop: 5 }}>{d.m}</span>
        </div>
      ))}
    </div>
  )
}

export const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0)
  const R = 38, CX = 50, CY = 50, ST = 13
  let cum = 0
  const polar = a => ({ x: CX + R * Math.cos(((a - 90) * Math.PI) / 180), y: CY + R * Math.sin(((a - 90) * Math.PI) / 180) })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={110} height={110} viewBox="0 0 100 100">
        {data.map((d, i) => {
          const a = (d.count / total) * 360, s = polar(cum), e = polar(cum + a)
          const path = `M ${s.x} ${s.y} A ${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
          cum += a
          return <path key={i} d={path} fill="none" stroke={d.color} strokeWidth={ST} strokeLinecap="round" opacity={.9} />
        })}
        <circle cx={CX} cy={CY} r={R - ST / 2 - 2} fill={T.surface} />
        <text x={CX} y={CY - 4}  textAnchor="middle" fill={T.text}     fontSize={13} fontWeight={700}>{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill={T.textMuted} fontSize={7}>tiket</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
            <span style={{ fontSize: 11, color: T.textMuted, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
