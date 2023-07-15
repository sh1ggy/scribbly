'use client'
import { IClientTypeDTO, ClientType, ServerMessageType, ClientTypeDTO, IPing, Ping, GameState, IGameState, AUDIENCE_LOBBY_TIME } from '@/lib/schemas';
import { gameStateAtom, userStateAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deserialize } from '@/utils/bopUtils';
import { useTimer } from 'react-timer-hook';
import Timer from '@/components/Timer';


export default async function Game() {
  const [noGameState, setNoGameState] = useState(false);
  const [gameState, setGameState] = useAtom(gameStateAtom);
  // Get the atom for user
  const [user, setUser] = useAtom(userStateAtom);
  const router = useRouter();

  function handlePing(ping: IPing) {
    console.log({ ping });
  }

  function handleClientType(dto: IClientTypeDTO) {
    console.log(dto);
    setUser(dto);
    return;
  }

  function onDrawStage() {
    if (user.ctype == ClientType.Unknown) router.push(`/`); // send user back to home if unknown?
    if (user.ctype == ClientType.Audience) router.push(`/game/audience`)
    if (user.ctype == ClientType.Gamer) router.push(`/game/gamer`)
  }

  function handleGameState(gameState: IGameState) {
    console.log({ gameState });
    setGameState(gameState);
  }

  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket(process.env.NEXT_PUBLIC_WS);
    console.log(process.env.NEXT_PUBLIC_WS);

    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
        case ServerMessageType.Restart:
          console.log("START");
          router.push("/");
          return;
        case ServerMessageType.GameState:
          handleGameState(GameState.decode(data));
          return;
        case ServerMessageType.ClientTypeDTO:
          handleClientType(ClientTypeDTO.decode(data));
          return;
        case ServerMessageType.NoGameState:
          setNoGameState(true);
          timer = setTimeout(() => {
            router.push('/');
            setNoGameState(false);
          }, 5000);
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      clearTimeout(timer);
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])

  useEffect(() => {
    if (!gameState) return;
    onDrawStage();
  }, [gameState])
  return (
    <main className="flex h-[calc(100vh-56px)] flex-col items-center justify-center space-y-24 p-24 bg-slate-700">
      <>
        {/* <Timer expiryTimestamp={time} /> */}

        {/* <p>{lobbyTimer} seconds left</p> */}
        <p className='text-4xl'>Waiting on players</p>
      </>
    </main>
  )
}
