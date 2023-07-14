import { gameStateAtom } from "@/lib/store";
import { useAtom } from "jotai";

export default async function Results() {
  // const [gameState, setGameState] = useAtom(gameStateAtom); //placeholder
  const drawings = 100; //placeholder
  const time = 10; //placeholder
  return (
    <div className="flex flex-col h-[calc(100vh-40px)] justify-center items-center bg-slate-700">
      <p className="text-6xl p-3 bg-secondary rounded-lg m-3 text-black"><strong>WINNER</strong></p>
      <div className="flex flex-col items-center justify-center">
        <canvas
          height={300}
          width={300}
          className='bg-white duration-200 mb-3 border-8 rounded-lg border-slate-900 border-solid'
        />
        <div className="stats lg:stats-horizontal shadow bg-slate-800">
          <div className="stat">
            <div className="stat-title">Audience</div>
            {/* <div className="stat-value">{gameState.clients.length}</div> */}
            <div className="stat-desc"># of people that voted</div>
          </div>
          <div className="stat">
            <div className="stat-title">Time</div>
            <div className="stat-value">{time} min</div>
            <div className="stat-desc">AI assessment time</div>
          </div>
        </div>
      </div>
    </div>
  )
}