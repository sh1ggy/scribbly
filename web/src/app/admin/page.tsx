'use client'
import { ClientMessageType, GameState, IGameState, IPing, Ping, ServerMessageType } from "@/lib/schemas";
import { gameStateAtom } from "@/lib/store";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

export default function Admin() {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [noGameState, setNoGameState] = useState(false);
  function handlePing(msg: IPing) {
    console.log({ msg });
    let sendPing = Ping.encode({
      msg: `sup from client`,
      test: false
    });
    window.ADMIN_SOCK.send(getDTOBuffer(sendPing, ClientMessageType.Ping))
  }
  function handleOpen() {
    let sendAdminAuth = new Uint8Array();
    window.ADMIN_SOCK.send(getDTOBuffer(sendAdminAuth, ClientMessageType.AuthADM));
  }
  function handleStartGame() {
    console.log("client starting game from admin");
    let sendStart = new Uint8Array();
    window.ADMIN_SOCK.send(getDTOBuffer(sendStart, ClientMessageType.StartADM))
  }
  function handleStageChange() {
    console.log("client changing stage from admin");
    let sendStageChange = new Uint8Array();
    window.ADMIN_SOCK.send(getDTOBuffer(sendStageChange, ClientMessageType.StageChangeADM))
  }
  function handleGameMode() {
    console.log("CHANGING GAME MODE");
    let sendStageChange = new Uint8Array();
    window.ADMIN_SOCK.send(getDTOBuffer(sendStageChange, ClientMessageType.GameModeADM))
  }
  async function handleGameState(state: IGameState) {
    console.log({ state });
    await setGameState(state);
  }
  useEffect(() => {
    window.ADMIN_SOCK = new WebSocket('ws://localhost:8001');
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.Ping:
          handlePing(Ping.decode(data));
          return;
        case ServerMessageType.GameState:
          handleGameState(GameState.decode(data));
          setNoGameState(false);
          return;
        case ServerMessageType.NoGameState:
          setNoGameState(true);
          return;
      }
    }
    window.ADMIN_SOCK.addEventListener('open', handleOpen);
    window.ADMIN_SOCK.addEventListener('message', message);
    return () => {
      window.ADMIN_SOCK.removeEventListener('open', handleOpen);
      window.ADMIN_SOCK.removeEventListener('message', message);
      window.ADMIN_SOCK.close();
    }
  }, [])

  return (
    <main className="flex flex-col gap-4 h-[calc(100vh-56px)] p-24 bg-slate-700">
      <h1 className="text-4xl text-center rounded-lg bg-primary py-3">Admin Page</h1>
      <div className="flex flex-col space-y-4">
        {gameState &&
          <>
            <p>{gameState.id.toString()}</p>
            <p>{gameState.stage}</p>
            <p>{gameState.clients}</p>
          </>
        }
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
        <button
          onClick={(e) => {
            e.preventDefault();
            handleGameMode();
          }} 
          className="btn">Change Game Mode</button>
      </div>
    </main >
  )
}