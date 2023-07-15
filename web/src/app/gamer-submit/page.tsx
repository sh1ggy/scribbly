'use client'
import { useDraw } from "@/hooks/useDraw";
import { Draw, Point, drawLine } from '@/utils/drawLine'
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ClientMessageType, ClientTypeDTO, CursorLocation, IClientTypeDTO, IPing, Ping, ServerMessageType } from "@/lib/schemas";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

export default function Gamer() {
  const [color, setColor] = useState<string>('#000')
  const { canvasRef, clear } = useDraw(createLine, cursorUp);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(0);

  function cursorUp() {
    console.log("STROKE COMPLETE")
    const sendStroke = new Uint8Array();
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendStroke, ClientMessageType.FinishStroke))
  }

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    console.log("DRAW LINE");
    drawLine({ prevPoint, currentPoint, ctx, color });
    const cursorLocation = CursorLocation.encode({
      currentPoint: {
        x: currentPoint.x / canvasSize,
        y: currentPoint.y / canvasSize
      }
    })
    window.SCRIBBLE_SOCK.send(getDTOBuffer(cursorLocation, ClientMessageType.CursorLocation));
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

  function handlePing(ping: IPing) {

  }

  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket(`ws://${process.env.NEXT_PUBLIC_IP}:8001`);
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);

    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])

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
      <div>
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
