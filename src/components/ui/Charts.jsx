
import { T } from '../../theme'

export const BarChart = ({ data }) => {
  const max = Math.max(...data.flatMap(d => [d.o, d.r]))

  return (
    <div className="flex items-end gap-[7px] h-[120px] w-full pb-5">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
          
          <div className="w-full flex items-end gap-[2px] h-[90px]">

            <div
              className="flex-1 rounded-t-[3px] min-h-[3px] opacity-85"
              style={{
                background: 'linear-gradient(180deg,#3B8BFF,#1a5ccc)',
                height: `${(d.o / max) * 100}%`
              }}
            />

            <div
              className="flex-1 rounded-t-[3px] min-h-[3px] opacity-85"
              style={{
                background: 'linear-gradient(180deg,#10B981,#059669)',
                height: `${(d.r / max) * 100}%`
              }}
            />

          </div>

          <span
            className="text-[9px] mt-[5px]"
            style={{ color: T.textDim }}
          >
            {d.m}
          </span>

        </div>
      ))}
    </div>
  )
}


export const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0)

  const R = 38
  const CX = 50
  const CY = 50
  const ST = 13

  let cum = 0

  const polar = a => ({
    x: CX + R * Math.cos(((a - 90) * Math.PI) / 180),
    y: CY + R * Math.sin(((a - 90) * Math.PI) / 180)
  })

  return (
    <div className="flex items-center gap-5">

      <svg width={110} height={110} viewBox="0 0 100 100">

        {data.map((d, i) => {
          const a = (d.count / total) * 360
          const s = polar(cum)
          const e = polar(cum + a)

          const path = `M ${s.x} ${s.y} A ${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${e.x} ${e.y}`

          cum += a

          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={d.color}
              strokeWidth={ST}
              strokeLinecap="round"
              opacity={0.9}
            />
          )
        })}

        <circle
          cx={CX}
          cy={CY}
          r={R - ST / 2 - 2}
          fill={T.surface}
        />

        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          fill={T.text}
          fontSize={13}
          fontWeight={700}
        >
          {total}
        </text>

        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fill={T.textMuted}
          fontSize={7}
        >
          tiket
        </text>

      </svg>

      <div className="flex flex-col gap-[6px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">

            <div
              className="w-2 h-2 rounded-[2px]"
              style={{ background: d.color }}
            />

            <span
              className="text-[11px] flex-1"
              style={{ color: T.textMuted }}
            >
              {d.label}
            </span>

            <span
              className="text-[11px] font-semibold"
              style={{ color: T.text }}
            >
              {d.count}
            </span>

          </div>
        ))}
      </div>

    </div>
  )
}
