'use client'
import Link from "next/link";
import { useDraw } from "@/hooks/useDraw";
import { Draw, Point, drawLine } from '@/utils/drawLine'
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

export default function Gamer() {
  const [color, setColor] = useState<string>('#000')
  const { canvasRef, clear } = useDraw(createLine);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(0);

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    // socket.emit('draw-line', { prevPoint, currentPoint, color })
    console.log("DRAW LINE")
    drawLine({ prevPoint, currentPoint, ctx, color })
  }

  useLayoutEffect(() => {
    const calcResize = () => {
      const canvasParentDims = canvasContainerRef.current?.getBoundingClientRect();
      if (!canvasParentDims) return
      setCanvasSize(Math.min(canvasParentDims?.width, canvasParentDims?.height) * 0.7);
    }
    calcResize();

    window
      .addEventListener('resize', calcResize);
    return () => {
      window
        .removeEventListener('resize', calcResize)
    }
  }, []);

  // Countdown timer
  // TODO: invoke event to submit drawing on timeout
  const TIMER_DELAY = 1000;
  const [drawTimer, setDrawTimer] = useState(30);
  useEffect(() => {
    drawTimer > 0 && setTimeout(() => setDrawTimer(drawTimer - 1), TIMER_DELAY);
  }, [drawTimer])

  return (
    // The absolute value offsets have to be absolutely correct otherwise the scrollbars appear, calc based on header + Link
    <div ref={canvasContainerRef} className='
        flex 
        flex-col 
        w-screen
        max-h-[calc(100vh-157px)]
        h-[calc(100vh-157px)]
        bg-slate-700
        justify-center
        items-center
        '
    >
      {/* <div ref={canvasContainerRef} className='flex flex-col w-screen max-h-full h-full bg-slate-700 justify-center items-center'> */}
      <div>
        <p className="text-4xl p-2 bg-black w-full rounded-t-md text-center">{drawTimer}</p>
        {/* The line becomes offset and incorrect when the page is able to scroll */}
        <canvas
          ref={canvasRef}
          height={canvasSize}
          width={canvasSize}
          className='bg-white'
        />
        <button type='button' className='btn hover:bg-slate-500 border-none transition-colors p-2 w-full rounded-b-md rounded-t-none' onClick={clear}>
          Clear canvas
        </button>
      </div>
    </div>
  )
}