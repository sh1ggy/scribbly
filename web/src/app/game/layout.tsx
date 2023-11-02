'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { ClientType, GameState, GamerChoice, IGameState, IPing, IResultsSTG, Ping, ResultsSTG, ServerMessageType, Stage } from "@/lib/schemas";
import { resultsAtom, gameStateAtom, userStateAtom, audienceCountAtom } from "@/lib/store";
import { deserialize } from "@/utils/bopUtils";
import { useTimer } from "react-timer-hook";
import { useToast } from "@/hooks/useToast";
import { useError } from "@/hooks/useError";
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export interface Results {
  innerResult: IResultsSTG,
  gameState: IGameState,
}

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [user, setUser] = useAtom(userStateAtom);
  const [results, setResults] = useAtom(resultsAtom);
  const [voteCount, setVoteCount] = useState(0);
  const setErrorMessage = useError();
  const setToast = useToast();
  const audience = useAtomValue(audienceCountAtom);

  const {
    seconds,
    restart,
  } = useTimer({ expiryTimestamp: new Date(), onExpire: () => console.warn('onExpire called') });

  function handlePing(ping: IPing) {
    console.log({ ping });
  }
  function handleGameState(gameState: IGameState) {
    console.log("FROM LAYOUT NEW GAME STATE", { gameState });
    setGameState(gameState);
    restart(new Date(Number(gameState.stageFinishTime)));
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
      case ServerMessageType.VoteUpdate:
        setVoteCount(voteCount + 1);
        return;
      case ServerMessageType.Restart:
        setToast("Restarting game");
        router.push("/");
        return;
      case ServerMessageType.NoGameState:
        setToast("No game found redirecting to home page");
        router.push('/');
        return;
      case ServerMessageType.ServerError:
        console.log('Server error');
        setErrorMessage('Server error');
        router.push('/');
        return;
    }
  }

  const timerShown = useMemo(() => {
    switch (gameState?.stage) {
      case Stage.Drawing:
        return true;
      case Stage.Voting:
        return true;
      case Stage.AudienceLobby:
        return true;
      default:
        return false;
    }
  }, [gameState?.stage]);

  const error = (event: Event) => {
    console.error('WebSocket error:', {event});
    // Defs doesnt contain very much relevant info actually, only status codes and if its an ending frame
    setErrorMessage('WebSocket error');
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
      // setGameState(null);
      window.SCRIBBLE_SOCK.close();
    }
  }, [])


  // Usecallback doesnt work in this situation since it needs to affect both handleResults and onMessage not just one
  // UseEffect used to curry the value of gameState without it getting stale
  useEffect(() => {
    if (!gameState || !window.SCRIBBLE_SOCK) return;


    async function handleResults(resultsSTG: IResultsSTG) {
      console.log({ resultsSTG, gameState })

      const results: Results = {
        gameState: gameState!,
        innerResult: resultsSTG,
      }
      setResults(results);
      console.log({ results })
      await sleep(1000);
      router.push('/results');
    }


    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.ResultsSTG:
          console.log({ gameState });
          await handleResults(ResultsSTG.decode(data)!);
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);

    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }

  }, [gameState]);



  return (
    <section className="flex flex-col item-center lg:justify-center">
      {gameState &&
        <div className="flex flex-col lg:justify-center bg-black">
          {matches ?
            <>
              <code className="bg-secondary text-black text-center p-1">You are {user.ctype == ClientType.Gamer ? `drawing ${(gameState.stage == Stage.Drawing) ? gameState.prompt.name : ""}` : `spectating people drawing ${gameState.prompt.name}`}</code>
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
                <code className="p-1 rounded-md bg-primary">{gameState && Stage[gameState.stage]}</code>
              </div>
            </ul>
          }
          <p className="space-x-3 text-sm pb-2 bg-black rounded-lg text-center">
            {
              timerShown &&
              <>
                <code>{seconds}s left in {gameState && Stage[gameState.stage]}</code>
              </>
            }
            <code className="bg-secondary text-black rounded-lg p-1">{audience}</code> people in audience
            <code className="text-secondary rounded-lg p-1">{gameState?.stage == Stage.Voting && `${voteCount}/${audience} votes`}</code>
          </p>
        </div>
      }
      {children}
    </section >
  )
}

