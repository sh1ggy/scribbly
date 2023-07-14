import { Draw, Point } from '@/utils/drawLine'
import { useEffect, useRef, useState } from 'react'

export const useDraw = (onDraw: ({ ctx, currentPoint, prevPoint }: Draw) => void) => {
  const [mouseDown, setMouseDown] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevPoint = useRef<null | Point>(null)

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    const mouseHandler = (e: MouseEvent) => {
      if (!mouseDown) return
      const x = e.pageX;
      const y = e.pageY;
      const currentPoint = computePointInCanvas(x, y);

      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !currentPoint) return

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current })
      prevPoint.current = currentPoint
    }

    const touchHandler = (e: TouchEvent) => {
      e.preventDefault();
      const x = e.changedTouches[0].pageX;
      const y = e.changedTouches[0].pageY;
      const currentPoint = computePointInCanvas(x, y);

      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !currentPoint) return

      onDraw({ ctx, currentPoint, prevPoint: prevPoint.current })
      prevPoint.current = currentPoint
    }

    const computePointInCanvas = (pointerX: number, pointerY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = pointerX - rect.left
      const y = pointerY - rect.top

      return { x, y }
    }

    const cursorUpHandler = () => {
      setMouseDown(false)
      prevPoint.current = null
    }

    const cursorDownHandler = (e: { preventDefault: () => void }) => {
      
      setMouseDown(true)
    }

    // Add event listeners
    canvasRef.current?.addEventListener('mousemove', mouseHandler)
    window.addEventListener('mouseup', cursorUpHandler);
    // canvasRef.current?.addEventListener('mousedown', (e)=> {})
    canvasRef.current?.addEventListener('mousedown', cursorDownHandler)

    canvasRef.current?.addEventListener('touchmove', touchHandler);
    canvasRef.current?.addEventListener('touchstart', cursorDownHandler);
    canvasRef.current?.addEventListener('touchend', cursorUpHandler);
    canvasRef.current?.addEventListener('touchcancel', cursorUpHandler);

    // Remove event listeners
    return () => {
      canvasRef.current?.removeEventListener('mousemove', mouseHandler)
      window.removeEventListener('mouseup', cursorUpHandler)

      canvasRef.current?.removeEventListener('touchmove', touchHandler)
      canvasRef.current?.removeEventListener('touchstart', cursorDownHandler);
      canvasRef.current?.removeEventListener('touchend', cursorUpHandler);
      canvasRef.current?.removeEventListener('touchcancel', cursorUpHandler);
    }
  }, [onDraw])

  return { canvasRef, clear }
}