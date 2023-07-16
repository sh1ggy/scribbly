'use client'
import { ClientType, GameState, GamerChoice, ICoord, IGameState, ServerMessageType } from "@/lib/schemas";
import { finalState, gameStateAtom, resultsAtom, winnerAtom } from "@/lib/store";
import { drawLine } from "@/utils/drawLine";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { deserialize } from "@/utils/bopUtils";
import { useContainerSize } from "@/hooks/useContainerSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";
// import Confetti from 'react-confetti'
import { useWindowSize } from "@/hooks/useWindowSize";

export default function Results() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const color = '#000'
  const matchesMd = useMediaQuery("(min-width: 768px)");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useAtom(resultsAtom);
  const [final, setFinal] = useAtom(finalState);
  const CANVAS_SIZE = 400;
  const { width, height } = useWindowSize()
  const [winner, setWinner] = useAtom(winnerAtom);
  const [audience, setAudience] = useState(0);

  function handleDrawResult() {
    // if (!gameState || !results) return;
    console.log(gameState?.drawings)
    gameState?.drawings.forEach((drawing, i) => {
      let canvas = i == winner && canvasRef.current
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
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
  useEffect(() => {
    if (!gameState) return;
    let clientArray = Array.from(gameState.clients)
    let audienceCount = 0;
    clientArray.filter((client) => {
      if (client[1] == ClientType.Audience) {
        audienceCount++;
      }
    })
    console.log("AUDIENCE COUNT !!!", audienceCount);
    setAudience(audienceCount); // minus two for gamers
    handleDrawResult();
    console.log({ winner, final })
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] justify-center items-center bg-slate-700">
      {/* <Confetti
        width={width}
        height={height}
        confettiSource={{
          w: 10,
          h: 10,
          x: width / 2,
          y: height / 2,
        }}
      /> */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row items-center justify-center">
          <div className="flex flex-col w-full h-full">
            <p className="text-xl p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
            <p className="text-md p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>{winner && GamerChoice[winner]}</strong></p>
            <canvas
              ref={canvasRef}
              height={CANVAS_SIZE}
              width={CANVAS_SIZE}
              className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
            />
          </div>
        </div>
        <div className="stats lg:stats-horizontal shadow bg-slate-800">
          <div className="stat">
            <div className="stat-title">Audience</div>
            <div className="stat-value">{`${final?.result.votes.length} / ${audience}`}</div>
            <div className="stat-desc">/ of people that voted</div>
          </div>
          <div className="stat">
            <div className="stat-title">Prompt</div>
            <div className="stat-value">{gameState?.prompt.name}</div>
            <div className="stat-desc">What had to be drawn</div>
          </div>
        </div>
        <div className="text-sm text-white my-3">P.S. Thank you for the data...</div>
      </div>
    </div>
  )
}