'use client'
import Link from 'next/link'

export default async function Game() {
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
