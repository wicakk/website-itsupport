import { useState } from 'react'
import { T } from '../../theme'

const Card = ({ children, style = {}, hover = false, onClick }) => {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background: T.surfaceAlt, borderRadius: 16, transition: 'all 0.2s ease',
        border: `1px solid ${hov ? T.borderAccent : T.border}`,
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  )
}
export default Card
