'use client'
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { Provider, useAtom } from "jotai";
import { GameState, IGameState, IPing, Ping, ServerMessageType, Stage } from "@/lib/schemas";
import { gameStateAtom } from "@/lib/store";
import { deserialize } from "@/utils/bopUtils";

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const [audience, setAudience] = useState(0);
  const router = useRouter();
  const [gameState, setGameState] = useAtom(gameStateAtom);

  function handlePing(ping: IPing) {
    console.log({ping});
  }
  function handleGameState(gameState: IGameState) {
    console.log({gameState});
    setGameState(gameState);
  }

  const message = async (event: MessageEvent<Blob>) => {
    const { type, data } = await deserialize(event);
    switch (type) {
      case ServerMessageType.Ping: 
        handlePing(Ping.decode(data));
        return;
      case ServerMessageType.GameState:
        console.log("GAME STATE" + data);
        handleGameState(GameState.decode(data));
        return;

    }
  }

  const error = (event: Event) => {
    console.error('WebSocket error:', error);
  }

  const matches = useMediaQuery("(min-width: 343px)");
  useEffect(() => {
    const openConnection = () => {
      console.log('OPENED CONN');
    }
    window.SCRIBBLE_SOCK.addEventListener('open', openConnection);
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    window.SCRIBBLE_SOCK.addEventListener('error', error);

    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('open', openConnection);
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
      window.SCRIBBLE_SOCK.removeEventListener('error', error);
      window.SCRIBBLE_SOCK.close();
    }
  }, [])

  return (
    <section className="flex flex-col item-center lg:justify-center">
      <div className="flex flex-col lg:justify-center">
        {matches &&
          <ul className="steps m-3 overflow-clip">
            <li className={`step ${gameState.stage == Stage.GamerSelect && 'step-secondary'}`}>Start</li>
            <li className={`step ${gameState.stage == Stage.Drawing && 'step-secondary'}`}>Drawing</li>
            <li className={`step ${gameState.stage == Stage.Voting && 'step-secondary'}`}>Voting</li>
            <li className={`step ${gameState.stage == Stage.Judging && 'step-secondary'}`}>Judging</li>
            <li className={`step ${gameState.stage == Stage.Results && 'step-secondary'}`}>Results</li>
          </ul>
        }
        {!matches &&
          <ul className="steps m-3 overflow-clip">
            <div className="flex justify-center items-center space-x-4">
              <p className="p-2 bg-secondary text-black rounded-lg">Phase</p>
              <code className="p-1 rounded-md bg-primary">Start</code>
            </div>
          </ul>
        }
        <p className="text-sm pb-2 bg-black rounded-lg text-center">
          <code className="bg-secondary text-black rounded-lg p-1">{audience}</code> people in audience
        </p>
      </div>
      <Provider>
        {children}
      </Provider>
    </section>
  )
}

