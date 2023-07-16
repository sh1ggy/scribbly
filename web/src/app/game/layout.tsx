'use client'
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { ClientType, ClientTypeDTO, GameState, IGameState, IPing, IResultsSTG, Ping, ResultsSTG, STgResults, ServerMessageType, Stage } from "@/lib/schemas";
import { gameStateAtom, resultsAtom, userStateAtom } from "@/lib/store";
import { deserialize } from "@/utils/bopUtils";

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const [audience, setAudience] = useState(0);
  const router = useRouter();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [userState, setUserState] = useAtom(userStateAtom);
  const [results, setResults] = useAtom(resultsAtom);
  const [voteCount, setVoteCount] = useState(0);

  function handlePing(ping: IPing) {
    console.log({ ping });
  }
  function handleGameState(gameState: IGameState) {
    console.log("FROM LAYOUT NEW GAME STATE", { gameState });
    setGameState(gameState);
  }
  function handleResults(results: IResultsSTG) {
    setResults(results);
    router.push('/results');
  }

  const message = async (event: MessageEvent<Blob>) => {
    const { type, data } = await deserialize(event);
    switch (type) {
      case ServerMessageType.Ping:
        handlePing(Ping.decode(data));
        return;
      case ServerMessageType.GameState:
        handleGameState(GameState.decode(data));
        return;
      case ServerMessageType.ResultsSTG:
        handleResults(ResultsSTG.decode(data));
        return;
      case ServerMessageType.VoteUpdate:
        setVoteCount(voteCount + 1);
        return;
      case ServerMessageType.Restart:
        // TODO: Toast
        router.push("/");
        return;
      case ServerMessageType.NoGameState:
        // TODO: toast
        router.push('/');
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
    if (window.SCRIBBLE_SOCK == undefined) {
      router.push('/')
      return;
    }
    window.SCRIBBLE_SOCK.addEventListener('open', openConnection);
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    window.SCRIBBLE_SOCK.addEventListener('error', error);

    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('open', openConnection);
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
      window.SCRIBBLE_SOCK.removeEventListener('error', error);
      setGameState(null);
      window.SCRIBBLE_SOCK.close();
      router.push('/');
    }
  }, [])

  return (
    <section className="flex flex-col item-center lg:justify-center">
      {gameState &&
        <div className="flex flex-col lg:justify-center bg-black">
          {matches ?
            <>
              <code className="bg-secondary text-black text-center p-1">You are {userState.ctype == ClientType.Gamer ? `drawing ${(gameState && gameState.stage == Stage.Drawing) ? gameState.prompt : ""}` : "spectating"}</code>
              <ul className="steps m-3 overflow-clip bg-black">
                <li className={`step ${gameState.stage >= Stage.AudienceLobby && 'step-secondary'}`}>Start</li>
                <li className={`step ${gameState.stage >= Stage.Drawing && 'step-secondary'}`}>Drawing</li>
                <li className={`step ${gameState.stage >= Stage.Voting && 'step-secondary'}`}>Voting</li>
                <li className={`step ${gameState.stage >= Stage.Judging && 'step-secondary'}`}>Judging</li>
                <li className={`step ${gameState.stage >= Stage.Results && 'step-secondary'}`}>Results</li>
              </ul>
            </>
            :
            <ul className="steps m-3 overflow-clip">
              <div className="flex justify-center items-center space-x-4">
                <p className="p-2 bg-secondary text-black rounded-lg">Phase</p>
                <code className="p-1 rounded-md bg-primary">{gameState && Stage[gameState?.stage]}</code>
              </div>
            </ul>
          }
          <p className="space-x-3 text-sm pb-2 bg-black rounded-lg text-center">
            <code className="bg-secondary text-black rounded-lg p-1">{audience}</code> people in audience
            <code className="text-secondary rounded-lg p-1">{gameState && gameState?.stage == Stage.Voting && `${voteCount}/${gameState.clients.size} votes`}</code>
          </p>
        </div>
      }
      {children}
    </section >
  )
}

