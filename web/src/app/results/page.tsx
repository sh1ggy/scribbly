'use client'
import { ClientType, GamerChoice, ICoord } from "@/lib/schemas";
import { resultsAtom } from "@/lib/store";
import { drawLine } from "@/utils/drawLine";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
// import Confetti from 'react-confetti'

export default function Results() {
  const CANVAS_SIZE = 400;
  const color = '#000'
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useAtom(resultsAtom);
  const [audience, setAudience] = useState(0);

  function handleDrawResult() {
    if (!results) return;
    console.log(results.gameState.drawings)
    results.gameState.drawings.forEach((drawing, i) => {
      let canvas = i == results.winner && canvasRef.current
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
    if (!results) return;
    let clientArray = Array.from(results.gameState.clients)
    let audienceCount = 0;
    clientArray.filter((client) => {
      if (client[1] == ClientType.Audience) {
        audienceCount++;
      }
    })
    console.log("AUDIENCE COUNT !!!", audienceCount);
    setAudience(audienceCount);
    handleDrawResult();
    console.log({ results })
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
      {results &&
        <div className="flex flex-col items-center justify-center">
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="flex flex-col w-full h-full">
              <p className="text-xl p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
              <p className="text-md p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>{results.winner && GamerChoice[results.winner]}</strong></p>
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
              <div className="stat-value">{`${results?.innerResult.votes.length} / ${audience}`}</div>
              <div className="stat-desc">/ of people that voted</div>
            </div>
            <div className="stat">
              <div className="stat-title">Prompt</div>
              <div className="stat-value">{results.gameState.prompt.name}</div>
              <div className="stat-desc">What had to be drawn</div>
            </div>
          </div>
          <div className="text-sm text-white my-3">P.S. Thank you for the data...</div>
        </div>
      }
    </div>
  )
}