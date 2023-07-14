'use client'
import { IClientTypeDTO, ClientType, ServerMessageType, ClientTypeDTO, IPing, Ping } from '@/lib/schemas';
import { gameStateAtom, userStateAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { deserialize } from '@/utils/bopUtils';

export default async function Game() {
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
    if (dto.ctype == ClientType.Audience) router.push(`/game/audience`)
    if (dto.ctype == ClientType.Gamer) router.push(`/game/gamer`)
    return;
  }

  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket('ws://localhost:8001');

    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
        case ServerMessageType.ClientTypeDTO:
          handleClientType(ClientTypeDTO.decode(data));
          return;
        case ServerMessageType.Restart:
          console.log("START");
          router.push("/");
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])
  return (
    <main className="flex h-[calc(100vh-56px)] flex-col items-center justify-center space-y-24 p-24 bg-slate-700">
      <p className='text-4xl'>LOADING</p>
      <div className='flex flex-col'>
        <Link href="/game/audience">audience</Link>
        <Link href="/game/gamer">gamer</Link>
      </div>
    </main>
  )
}
