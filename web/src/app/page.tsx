import Link from 'next/link'

export default function Home() {
  const game = true; // placeholder
  return (
    <main className="flex h-[calc(100vh-56px)] flex-col items-center justify-center space-y-24 p-24 bg-slate-700">
      {game &&
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
      }
      <div className='flex flex-col'>
        {/* USE A TAG HERE INSTEAD OF LINK AND REPLACE SO THAT WE DONT ROUTE BACK TO GAME INDEX */}
        <a href="/game" >game</a>
        <Link href="/game/audience">audience</Link>
        <Link href="/game/image-gamer">(image) gamer</Link>
        <Link href="/results">results</Link>
        <Link href="/admin">admin</Link>
      </div>
    </main>
  )
}