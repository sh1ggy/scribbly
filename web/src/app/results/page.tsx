'use client'
import { gameStateAtom } from "@/lib/store";
import { useAtom } from "jotai";
import { useRef } from "react";

export default async function Results() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const canvasRefA = useRef<HTMLCanvasElement>(null);
  const canvasRefB = useRef<HTMLCanvasElement>(null); // need to draw this in with game state
  
  return (
    <div className="flex flex-col h-[calc(100vh-40px)] justify-center items-center bg-slate-700">
      <p className="text-6xl p-3 bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
      <div className="flex md:flex-col items-center justify-center">
        <canvas
          ref={canvasRefA}
          height={300}
          width={300}
          className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
        />
        <canvas
          ref={canvasRefB}
          height={300}
          width={300}
          className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
        />
        <div className="stats lg:stats-horizontal shadow bg-slate-800">
          <div className="stat">
            <div className="stat-title">Audience</div>
            <div className="stat-value">{gameState.clients.length}</div>
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