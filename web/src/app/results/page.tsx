'use client'
import { GameState, IGameState, ServerMessageType } from "@/lib/schemas";
import { gameStateAtom } from "@/lib/store";
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

  function handleGameState() {
    if (!gameState) return;
    gameState.drawings.forEach((d, i) => {
      let canvas = i == 0 ? canvasRef.current : canvasRefB.current
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      d.strokes.forEach((s) => {
        s.forEach((c, i) => {
          drawLine({ prevPoint: s[i - 1], currentPoint: c, ctx, color })
        })
      })
    })
  }
  useEffect(() => {
    handleGameState()
  }, [gameState])

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] justify-center items-center bg-slate-700">
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col md:flex-row items-center justify-center">
          <div className="flex flex-col w-full h-full">
            <p className="text-xl p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
            <canvas
              ref={canvasRef}
              height={300}
              width={300}
              className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
            />
          </div>

        </div>
        <div className="stats lg:stats-horizontal shadow bg-slate-800">
          <div className="stat">
            <div className="stat-title">Audience</div>
            <div className="stat-value">{gameState && gameState.clients.size}</div>
            <div className="stat-desc"># of people that voted</div>
          </div>
          <div className="stat">
            <div className="stat-title"></div>
            <div className="stat-value"></div>
            <div className="stat-desc"></div>
          </div>
        </div>
      </div>
    </div>
  )
}