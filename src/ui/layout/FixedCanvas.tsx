import { type PropsWithChildren, useEffect, useState } from 'react'
import { canvasScale, type DisplayMode } from './displayMode'

function viewportSize() {
  const viewport = window.visualViewport
  // Follow the keyboard, not pinch zoom. Zoom remains under the user's control.
  return { width: window.innerWidth, height: viewport?.scale === 1 ? viewport.height : window.innerHeight }
}

/** Same React tree in both modes: switching/resizing never recreates a match. */
export function FixedCanvas({ children, mode = 'physical' }: PropsWithChildren<{ mode?: DisplayMode }>) {
  const [size, setSize] = useState(viewportSize)

  useEffect(() => {
    const updateScale = () => setSize(viewportSize())
    window.addEventListener('resize', updateScale)
    window.addEventListener('orientationchange', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)
    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('orientationchange', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [])

  return (
    <div className={`canvas-viewport ${mode === 'adaptive' ? 'adaptive-viewport' : 'physical-viewport'}`} style={mode === 'adaptive' ? { height: size.height } : undefined}>
      <div
        className={`fixed-canvas ${mode === 'adaptive' ? 'adaptive-canvas' : 'physical-canvas'}`}
        style={mode === 'physical' ? { transform: `scale(${canvasScale(size.width, size.height)})` } : undefined}
        aria-label={mode === 'physical' ? 'Lienzo de simulación de 800 por 480 píxeles' : 'Marcador adaptable a la pantalla'}
      >
        {children}
      </div>
    </div>
  )
}
