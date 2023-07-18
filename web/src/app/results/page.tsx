'use client'
import { ClientType, GamerChoice, ICoord } from "@/lib/schemas";
import { gameStateAtom, getAudienceFromGameState, resultsAtom } from "@/lib/store";
import { drawLine } from "@/utils/drawLine";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
// import Confetti from 'react-confetti'

type ScoreDict = Record<GamerChoice, number>;



export default function Results() {
  const CANVAS_SIZE = 400;
  const color = '#000'
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useAtom(resultsAtom);

  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState<ScoreDict>({ [GamerChoice.GamerA]: 0, [GamerChoice.GamerB]: 0, [GamerChoice.Neither]: 0 });
  const [winner, setWinner] = useState<GamerChoice>(GamerChoice.Neither);

  function handleGameResult() {
    if (!results) return;
    let scoreA = 0;
    let scoreB = 0;
    let winner: GamerChoice = GamerChoice.Neither;

    const totalVotes = results?.innerResult.votes.length;
    const cumPoints = 90 / 0.3;
    const voteValue = (cumPoints * 0.7) / totalVotes;
    results.innerResult.votes.forEach((vote, i) => {
      if (vote == GamerChoice.GamerA) {
        scoreA += voteValue;
        return
      }
      else if (vote == GamerChoice.GamerB) {
        scoreB += voteValue;
        return;
      }
      else {
        return;
      }
    })

    if (scoreA > scoreB) {
      winner = GamerChoice.GamerA
      console.log("WINNER A")
    }
    else if (scoreA < scoreB) {
      winner = GamerChoice.GamerB;
      console.log("WINNER B")
    }
    else {
      winner = GamerChoice.Neither;
      setIsDraw(true);
      console.log("NEITHER");
    }
    console.log(scoreA, scoreB)
    setScores({
      [GamerChoice.GamerA]: scoreA, [GamerChoice.GamerB]: scoreB,
      [GamerChoice.Neither]: 0
    });

    setWinner(winner);

    console.log(results.gameState.drawings)

    if (winner == GamerChoice.Neither) return;
    let drawing = winner == GamerChoice.GamerA ? results.gameState.drawings[0] : results.gameState.drawings[1];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawing.strokes.forEach((stroke) => {
      stroke.forEach((coord, i) => {
        const prevX = i == 0 ? stroke[i].x : stroke[i - 1].x
        const prevY = i == 0 ? stroke[i].y : stroke[i - 1].y
        const prevPoint: ICoord = { x: prevX * CANVAS_SIZE, y: prevY * CANVAS_SIZE }
        const currentPoint: ICoord = { x: coord.x * CANVAS_SIZE, y: coord.y * CANVAS_SIZE }
        drawLine({ prevPoint: prevPoint, currentPoint: currentPoint, ctx, color })
      })
    })

  }

  useEffect(() => {
    handleGameResult();
  }, [results]);

  const votedForWinnerCount = useMemo(() => {
    return results && results.innerResult.votes.filter((v) => v == winner).length;
  }, [results]);


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
              <p className="text-xl p-3 text-center bg-secondary rounded-lg m-3 text-black"><strong>{!isDraw ? "WINNER" : "DRAW"}</strong></p>
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
              <div className="stat-value">{`${votedForWinnerCount} / ${getAudienceFromGameState(results.gameState)}`}</div>
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