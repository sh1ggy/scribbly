'use client'
import Link from "next/link";
import { useDraw } from "@/hooks/useDraw";
import { Draw, Point, drawLine } from '@/utils/drawLine'
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ClientMessageType, ClientTypeDTO, CursorLocation, GameState, ServerMessageType, Stage } from "@/lib/schemas";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { useAtom } from "jotai";
import { gameStateAtom } from "@/lib/store";
import { useRouter } from "next/navigation";

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

  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [judgement, setJudgement] = useState(false);

  const router = useRouter();

  // Countdown timer
  // TODO: invoke event to submit drawing on timeout
  const TIMER_DELAY = 1000;
  const [drawTimer, setDrawTimer] = useState(30);

  function cursorUp() {
    if (!gameState || gameState.stage != Stage.Drawing) return
    if (gameState.stage = Stage.Drawing) {
      const sendStroke = new Uint8Array();
      window.SCRIBBLE_SOCK.send(getDTOBuffer(sendStroke, ClientMessageType.FinishStroke))
      console.log("STROKE COMPLETE")
    }
  }

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    if (!gameState || gameState.stage != Stage.Drawing) return
    console.log("DRAW LINE");
    console.log({ gameState });
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


  useEffect(() => {
    if (gameState?.stage == Stage.Voting) setJudgement(true);
    else if (!gameState || gameState.stage != Stage.Drawing) return;
    drawTimer > 0 && setTimeout(() => setDrawTimer(drawTimer - 1), TIMER_DELAY);
    console.log(gameState);
  }, [gameState])

  return (
    // The absolute value offsets have to be absolutely correct otherwise the scrollbars appear, calc based on header + Link
    <div ref={canvasContainerRef} className='
        flex 
        flex-col 
        w-screen
        max-h-[calc(100vh-188.5px)]
        h-[calc(100vh-157px)]
        bg-slate-700
        justify-center
        items-center
        '
    >
      {/* <div ref={canvasContainerRef} className='flex flex-col w-screen max-h-full h-full bg-slate-700 justify-center items-center'> */}
      <div>
        {gameState?.stage == Stage.Drawing &&
          <>
            <p className="text-4xl p-2 bg-black w-full text-center">{drawTimer}</p>
            {/* The line becomes offset and incorrect when the page is able to scroll */}
            <canvas
              ref={canvasRef}
              height={canvasSize}
              width={canvasSize}
              className={`bg-white ${gameState?.stage != Stage.Drawing && "cursor-not-allowed pointer-events-none"}`}
            />
            <button type='button' className='btn hover:bg-slate-500 border-none transition-colors p-2 w-full rounded-b-md rounded-t-none' onClick={clear}>
              Clear canvas
            </button>
          </>
        }
        {gameState && gameState?.stage < Stage.Drawing &&
          <>
            <p className="text-4xl p-2 w-full text-center">Loading</p>
          </>
        }
        {gameState && gameState?.stage > Stage.Drawing &&
          <>
            <p className="text-4xl p-2 w-full text-center">Awaiting judgement</p>
          </>
        }
      </div>
    </div >
  )
}
