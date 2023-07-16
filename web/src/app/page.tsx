'use client'
import { ClientType } from '@/lib/schemas';
import { userStateAtom } from '@/lib/store';
import { useAtom } from 'jotai';
import Link from 'next/link'
import QRCode from "react-qr-code";

export default function Home() {
  const [user, setUser] = useAtom(userStateAtom);
  return (
    <main className="flex h-[calc(100vh-56px)] flex-col items-center justify-center space-y-24 p-24 bg-slate-700">
      {/* {game &&
        <div>
          <div className='flex flex-col items-center space-y-3 mb-6'>
            <h1 className='cursor-pointer hover:bg-lime-300 text-center transition-colors duration-500 text-lg rounded-lg p-2 bg-secondary text-black'>Game Active</h1>
          </div>
          <p className='bg-primary animate-pulse p-2 mx-1 rounded-lg text-center'>Joining active game</p>
        </div>
      }
      {!game &&
        <div className='flex flex-col items-center space-y-3 mb-6'>
          <h1 className='cursor-pointer hover:bg-red-300 transition-colors duration-500 text-lg rounded-lg p-2 bg-red-400 text-black'>No Active Game</h1>
        </div>
      } */}
      {/* {user.ctype == ClientType.Admin && */}
        <QRCode value={window && `${window.location.origin}/game/connection`} className='w-44 h-44' />
      {/* } */}
      <div className='flex flex-col'>
        {/* USE A TAG HERE INSTEAD OF LINK AND REPLACE SO THAT WE DONT ROUTE BACK TO GAME INDEX */}
        <a className="text-xl p-2 text-center bg-primary rounded-lg" href="/game/connecting" >Proceed to game!</a>
        <Link href="/results">results</Link>
        <Link href="/admin">admin</Link>
      </div>
    </main>
  )
}