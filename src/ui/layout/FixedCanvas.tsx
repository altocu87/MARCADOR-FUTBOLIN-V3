import { type PropsWithChildren, useEffect, useState } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 480

function getScale(): number {
  return Math.min(1, window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT)
}

/** Mantiene el espacio de diseño en 800 × 480 y lo reduce si no cabe, sin recortarlo. */
export function FixedCanvas({ children }: PropsWithChildren) {
  const [scale, setScale] = useState(getScale)

  useEffect(() => {
    const updateScale = () => setScale(getScale())
    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
    }
  }, [])

  return (
    <div className="canvas-viewport">
      <div
        className="fixed-canvas"
        style={{ transform: `scale(${scale})` }}
        aria-label="Lienzo de simulación de 800 por 480 píxeles"
      >
        {children}
      </div>
    </div>
  )
}
