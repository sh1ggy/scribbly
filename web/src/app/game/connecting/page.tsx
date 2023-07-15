'use client'
import { IClientTypeDTO, ClientType, ServerMessageType, ClientTypeDTO, IPing, Ping, GameState, IGameState, AUDIENCE_LOBBY_TIME, Stage } from '@/lib/schemas';
import { gameStateAtom, userStateAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { deserialize } from '@/utils/bopUtils';
import { useTimer } from 'react-timer-hook';
import Timer from '@/components/Timer';


export default function Game() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [user, setUser] = useAtom(userStateAtom);
  const router = useRouter();

  function handlePing(ping: IPing) {
    console.log({ ping });
  }

  const handleClientType = (dto: IClientTypeDTO) => {
    console.log({ dto });
    setUser(dto);
  }

  useEffect(() => {
    if (!gameState) return;
    if (gameState.stage == Stage.Drawing) {
      if (user.ctype == ClientType.Unknown) router.push(`/`); // send user back to home if unknown?
      if (user.ctype == ClientType.Audience) router.push(`/game/audience`)
      if (user.ctype == ClientType.Gamer) router.push(`/game/gamer`)
    }

  }, [gameState])

  useEffect(() => {
    console.log({ user });

  }, [user])

  

  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket(process.env.NEXT_PUBLIC_WS);

    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
        case ServerMessageType.ClientTypeDTO:
          handleClientType(ClientTypeDTO.decode(data));
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])
  if (!user) return ( <></>)

  return (
    <main className="flex h-[calc(100vh-56px)] flex-col items-center justify-center space-y-24 p-24 bg-slate-700">
      <>


        <p>You are player type: {ClientType[user.ctype]}</p>
        {user.ctype == ClientType.Unknown ?

          <p className='text-4xl'>Loading...</p> :
          <p className='text-4xl'>Waiting on players</p>}
      </>
    </main>
  )
}
