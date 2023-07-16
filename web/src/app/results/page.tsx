'use client'
import { GameState, ICoord, IGameState, ServerMessageType } from "@/lib/schemas";
import { gameStateAtom, resultsAtom } from "@/lib/store";
import { drawLine } from "@/utils/drawLine";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { deserialize } from "@/utils/bopUtils";
import { useContainerSize } from "@/hooks/useContainerSize";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default async function Results() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const color = '#000'
  const matchesMd = useMediaQuery("(min-width: 768px)");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRefB = useRef<HTMLCanvasElement>(null); // need to draw this in with game state
  const [results, setResults] = useAtom(resultsAtom);
  const [canvasSize, setCanvasSize] = useState(0);

  function handleDrawResult() {
    if (!gameState || !results) return;
    gameState.drawings.forEach((drawing, i) => {
      let canvas = i == results.outcome && canvasRef.current
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawing.strokes.forEach((stroke) => {
        stroke.forEach((coord, i) => {
          const prevX = i == 0 ? stroke[i].x : stroke[i - 1].x
          const prevY = i == 0 ? stroke[i].y : stroke[i - 1].y
          const prevPoint: ICoord = {x: prevX * canvasSize, y: prevY * canvasSize}
          const currentPoint: ICoord = {x: coord.x * canvasSize, y: coord.y * canvasSize}
          drawLine({ prevPoint: prevPoint, currentPoint: currentPoint, ctx, color })
        })
      })
    })
  }
  useEffect(() => {
    handleDrawResult();
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] justify-center items-center bg-slate-700">
      {results &&
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="flex flex-col w-full h-full">
              <p className="text-xl p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
              <p className="text-md p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>{results.outcome}</strong></p>
              <canvas
                ref={canvasRef}
                height={canvasSize}
                width={canvasSize}
                className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
              />
            </div>
          </div>
          <div className="stats lg:stats-horizontal shadow bg-slate-800">
            <div className="stat">
              <div className="stat-title">Audience</div>
              <div className="stat-value">{`${results.votes} / ${results.clients.size}`}</div>
              <div className="stat-desc">/ of people that voted</div>
            </div>
            <div className="stat">
              <div className="stat-title">Prompt</div>
              <div className="stat-value">{results.prompt}</div>
              <div className="stat-desc">What had to be drawn</div>
            </div>
          </div>
          <div className="text-sm text-black">P.S. Thank you for the data...</div>
        </div>
      }
    </div>
  )
}