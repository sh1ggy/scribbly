'use client'
import { IPing, Ping, ServerMessageType } from "@/lib/schemas";
import { deserialize } from "@/utils/bopUtils";
import { useEffect } from "react";

export default function Admin() {
  function handleGame() {

  }
  function handleAdmin(msg: IPing) {

  }
  useEffect(() => {
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.ClientTypeDTO:
          handleAdmin(Ping.decode(data));
      }
    }
    window.SLUGMA_SOCK.addEventListener('message', message);
    return () => {
      window.SLUGMA_SOCK.removeEventListener('message', message);
    }
  }, [])

  return (
    <main className="flex flex-col gap-4 h-[calc(100vh-56px)] p-24 bg-slate-700">
      <h1 className="text-4xl text-center rounded-lg bg-primary py-3">Admin Page</h1>
      <div className="flex flex-col space-y-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            handleGame();
          }}
          className="btn">Start/Restart Game</button>
        <button className="btn">Switch Stage</button>
        <button className="btn">Change Game Mode</button>
      </div>
    </main>
  )
}