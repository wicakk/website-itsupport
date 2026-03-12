import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

const QRCanvas = ({ value, size = 128 }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size })
        .catch(err => console.error(err))
    }
  }, [value, size])

  return <canvas ref={canvasRef} />
}

export default QRCanvas