'use client'
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { ClientType, ClientTypeDTO, GameState, GamerChoice, IGameState, IPing, IResultsSTG, Ping, ResultsSTG, STgResults, ServerMessageType, Stage } from "@/lib/schemas";
import { finalState, gameStateAtom, resultsAtom, userStateAtom, winnerAtom } from "@/lib/store";
import { deserialize } from "@/utils/bopUtils";
import { useTimer } from "react-timer-hook";

export interface ResultsSum {
  result: IResultsSTG,
  newGameState: IGameState
}
export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  const [audience, setAudience] = useState(0);
  const router = useRouter();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [user, setUser] = useAtom(userStateAtom);
  const [results, setResults] = useAtom(resultsAtom);
  const [winner, setWinner] = useAtom(winnerAtom);
  const [finalResult, setFinalResult] = useAtom(finalState);
  const [voteCount, setVoteCount] = useState(0);

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
  function handleResults(resultsSTG: IResultsSTG) {
    // if (!gameState) return;
    console.log({ resultsSTG })

    let voteCountA = 0;
    let voteCountB = 0;

    let scoreA = 0;
    let scoreB = 0;

    resultsSTG.gamerAKVals.forEach((gamerAK, i) => {
      if (gamerAK == gameState?.prompt.class) {
        scoreA = scoreA + 30;
      }
    })
    resultsSTG.gamerBKVals.forEach((gamerBK, i) => {
      if (gamerBK == gameState?.prompt.class) {
        scoreA = scoreB + 30;
      }
    })
    resultsSTG.votes.forEach((vote, i) => {
      if (vote == GamerChoice.GamerA) voteCountA++;
      if (vote == GamerChoice.GamerB) voteCountB++;
    })
    if (voteCountA > voteCountB) {
      scoreA = scoreA + 50
    }
    else {
      scoreB = scoreB + 50
    }
    if (scoreA > scoreB) {
      setWinner(GamerChoice.GamerA)
    }
    else {
      setWinner(GamerChoice.GamerB)
    }
    console.log({winner})
    const sum: ResultsSum  = {
      newGameState: gameState!,
      result: resultsSTG,

    }
    setGameState(gameState);
    setResults(resultsSTG);
    setFinalResult(sum);

    console.log({results})
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
      // setGameState(null);
      window.SCRIBBLE_SOCK.close();
    }
  }, [])

  useEffect(() => {
    if (!gameState) return;
    let clientArray = Array.from(gameState?.clients)
    let audienceCount = 0;
    clientArray.filter((client) => {
      if (client[1] == ClientType.Audience) {
        audienceCount++;
      }
    })
    console.log("AUDIENCE COUNT !!!", audienceCount);
    setAudience(audienceCount); // minus two for gamers
  }, [gameState])

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

