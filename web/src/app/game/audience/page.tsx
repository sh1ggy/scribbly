'use client'
import { useContainerSize } from "@/hooks/useContainerSize";
import { useDraw } from "@/hooks/useDraw";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWindowSize } from "@/hooks/useWindowSize";
import { ICursorLocation, ServerMessageType, DrawUpdate, IDrawUpdate, GamerChoice, ClientMessageType, CursorLocation, IVote, Vote, GameState, IGameState, Coord, ICoord, Stage, FinishStroke, IFinishStroke, Clear, IClear } from "@/lib/schemas";
import { gameStateAtom } from "@/lib/store";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { Draw, drawLine } from "@/utils/drawLine";
import { useAtom } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
export default function Audience() {
  const CANVAS_SIZE = 400
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const router = useRouter();

  const [color, setColor] = useState<string>('#000')
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // const [canvasSize, setCanvasSize] = useState(300);
  const matchesMd = useMediaQuery("(min-width: 768px)");
  const { containerRef, size: containerSize } = useContainerSize();
  const canvasRefA = useRef<HTMLCanvasElement>(null)
  const canvasRefB = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useAtom(gameStateAtom);

  const [horizontal, setHorizontal] = useState(false);
  // use ref instead of usestate as per instruction of usedraw for prevpoints because the function doesn't curry state
  // const prevPointA = useRef<ICoord | null>(null);
  // const prevPointB = useRef<ICoord | null>(null);

  const handleAudienceDrawing = (drawData: IDrawUpdate) => {
    console.log({ drawData })
    let canvas = drawData.gamer == GamerChoice.GamerA ? canvasRefA.current : canvasRefB.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // let prevPoint = drawData.gamer == GamerChoice.GamerA ? prevPointA.current : prevPointB.current;
    // if (prevPoint) {
    //   prevPoint = { x: prevPoint.x * CANVAS_SIZE, y: prevPoint.y * CANVAS_SIZE };
    // }

    // const prevPoint: ICoord = { x: drawData.prevPoint.x * canvasSize, y: drawData.prevPoint.y * canvasSize }
    // const currentPoint: ICoord = { x: drawData.currentPoint.x * canvasSize, y: drawData.currentPoint.y * canvasSize }
    // console.log("DRAW: ", { prevPoint, currentPoint });
    const currentPoint: ICoord = { x: drawData.currentPoint.x * CANVAS_SIZE, y: drawData.currentPoint.y * CANVAS_SIZE }
    const prevPoint: ICoord = { x: drawData.prevPoint.x * CANVAS_SIZE, y: drawData.prevPoint.y * CANVAS_SIZE }
    // debugger;
    // console.log({ prevPoint: prevPoint, currentPoint: currentPoint, ctx, color })
    console.log("DRAW: ", {prevPoint, currentPoint});
    drawLine({ prevPoint: prevPoint, currentPoint: currentPoint, ctx, color })
    // if (drawData.gamer == GamerChoice.GamerA) {
    //   prevPointA.current = drawData.currentPoint;
    // }
    // else {
    //   prevPointB.current = drawData.currentPoint;
    // }
  };

  function handleSendVote(userChoice: GamerChoice) {
    const sendVote = Vote.encode({
      choice: userChoice,
    });
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendVote, ClientMessageType.Vote));
    setVoted(true);
  }

  function handleGameState() {
    if (!gameState) return;
    gameState.drawings.forEach((drawing, i) => {
      let canvas = i == 0 ? canvasRefA.current : canvasRefB.current
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawing.strokes.forEach((stroke) => {
        stroke.forEach((coord, i) => {
          const prevX = i == 0 ? stroke[i].x : stroke[i - 1].x
          const prevY = i == 0 ? stroke[i].y : stroke[i - 1].y
          const prevPoint: ICoord = { x: prevX * CANVAS_SIZE, y: prevY * CANVAS_SIZE }
          const currentPoint: ICoord = { x: coord.x * CANVAS_SIZE, y: coord.y * CANVAS_SIZE }
          drawLine({ prevPoint: prevPoint, currentPoint: currentPoint, ctx, color })
        })
      })
    })
  }

  function handleFinishStroke(finishStroke: IFinishStroke) {
    // if (!gameState) return;
    // console.log("FINISH STROKE", { finishStroke })
    // if (finishStroke.gamer == GamerChoice.GamerA) {
    //   prevPointA.current = null
    // }
    // if (finishStroke.gamer == GamerChoice.GamerB) {
    //   prevPointB.current = null
    // }
  }

  function handleClear(clearData: IClear) {
    console.log({clearData});
    let canvas;
    if (clearData.gamer == GamerChoice.GamerA) {
      canvas = canvasRefA.current;
    }
    if (clearData.gamer == GamerChoice.GamerB) {
      canvas = canvasRefB.current;
    }
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.DrawUpdate:
          handleAudienceDrawing(DrawUpdate.decode(data));
          return;
        case ServerMessageType.FinishStroke:
          handleFinishStroke(FinishStroke.decode(data));
          return;
        case ServerMessageType.Clear:
          handleClear(Clear.decode(data));
          return          
      }
    }
    if (window.innerWidth > window.innerHeight) setHorizontal(true);
    if (window.innerHeight > window.innerWidth) setHorizontal(false);
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])

  useEffect(() => {
    if (!gameState) return;
    handleGameState();
    if (gameState.stage == Stage.Voting) {
      setVoting(true);
    }
  }, [gameState])

  return (
    <div
      className='h-[calc(100vh-188.5px)] bg-slate-700 flex justify-center items-center'>
      {voted ?
        <p className="text-4xl p-2 w-full text-center">Awaiting judgement</p>
        :
        <div
          ref={containerRef}
          className={`flex flex-col mt-[188.5px] lg:mt-0 lg:flex-row justify-center items-center w-full h-full`}>
          <div className="flex flex-col">
            <canvas
              ref={canvasRefA}
              height={CANVAS_SIZE}
              width={CANVAS_SIZE}
              className='lg:scale-100 bg-white border-8 rounded-lg border-secondary border-solid'
            />
            {voting &&
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSendVote(GamerChoice.GamerA);
                }}
                className="scale-75 lg:scale-100 btn border-none text-xs md:text-md">Vote</button>
            }
          </div>
          <div className="flex flex-col">
            <canvas
              ref={canvasRefB}
              height={CANVAS_SIZE}
              width={CANVAS_SIZE}
              className='lg:scale-100 bg-white duration-200 border-8 rounded-lg border-red-400 border-solid'
            />
            {voting &&
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSendVote(GamerChoice.GamerB);
                }}
                className="scale-75 lg:scale-100 btn border-none text-xs md:text-md">Vote</button>
            }
          </div>
        </div>
      }
    </div >
  )
}