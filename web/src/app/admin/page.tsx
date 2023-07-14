'use client'
import { ClientMessageType, IPing, Ping, ServerMessageType } from "@/lib/schemas";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { useEffect } from "react";

export default function Admin() {
  function handlePing(msg: IPing) {
    console.log({msg});
    let sendPing = Ping.encode({
      msg: `sup from client`,
      test: false
    }); 
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendPing, ClientMessageType.Ping))
  }
  function handleOpen() {
    let sendAdminAuth = new Uint8Array();
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendAdminAuth, ClientMessageType.AuthADM));
  }
  function handleStartGame() {
    console.log("client starting game from admin");
    let sendStart = new Uint8Array();
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendStart, ClientMessageType.StartADM))
  }
  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket('ws://localhost:8001');
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('open', handleOpen);
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])

  return (
    <main className="flex flex-col gap-4 h-[calc(100vh-56px)] p-24 bg-slate-700">
      <h1 className="text-4xl text-center rounded-lg bg-primary py-3">Admin Page</h1>
      <div className="flex flex-col space-y-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            handleStartGame();
          }}
          className="btn">Start/Restart Game</button>
        <button className="btn">Switch Stage</button>
        <button className="btn">Change Game Mode</button>
      </div>
    </main>
  )
}