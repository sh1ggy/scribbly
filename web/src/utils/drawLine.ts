export type Draw = {
  ctx: CanvasRenderingContext2D
  currentPoint: Point
  prevPoint: Point | null
}

export type Point = { x: number; y: number }


type DrawLineProps = Draw & {
  color: string
}

export const drawLine = ({ prevPoint, currentPoint, ctx, color }: DrawLineProps) => {
  const { x: currX, y: currY } = currentPoint
  const lineColor = color
  const lineWidth = 5

  // If no previous point, draw from current to current 
  let startPoint = prevPoint ?? currentPoint
  ctx.beginPath()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = lineColor
  ctx.moveTo(startPoint.x, startPoint.y)
  ctx.lineTo(currX, currY)
  ctx.stroke()

  ctx.fillStyle = lineColor
  ctx.beginPath()
  ctx.arc(startPoint.x, startPoint.y, 2, 0, 2 * Math.PI)
  ctx.fill()
}