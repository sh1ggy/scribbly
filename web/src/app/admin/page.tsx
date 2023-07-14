'use client'
import { ClientMessageType, GameState, IGameState, IPing, Ping, ServerMessageType } from "@/lib/schemas";
import { gameStateAtom } from "@/lib/store";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function Admin() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  function handlePing(msg: IPing) {
    console.log({ msg });
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
  function handleStageChange() {
    console.log("client changing stage from admin");
    let sendStageChange = new Uint8Array();
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendStageChange, ClientMessageType.StageChangeADM))
  }
  function handleGameState(state: IGameState) {
    console.log({state});
    setGameState(state);
  }
  useEffect(() => {
    window.SCRIBBLE_SOCK = new WebSocket('ws://localhost:8001');
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
        case ServerMessageType.GameState:
          handleGameState(GameState.decode(data));
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
        <p>{gameState.id.toString()}</p>
        <p>{gameState.stage}</p>
        <p>{gameState.clients}</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleStartGame();
          }}
          className="btn">Start/Restart Game</button>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleStageChange();
          }}
          className="btn">Switch Stage</button>
        <button className="btn">Change Game Mode</button>
      </div>
    </main>
  )
}