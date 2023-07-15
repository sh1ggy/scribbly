'use client'
import { useContainerSize } from "@/hooks/useContainerSize";
import { useDraw } from "@/hooks/useDraw";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWindowSize } from "@/hooks/useWindowSize";
import { ICursorLocation, ServerMessageType, DrawUpdate, IDrawUpdate, GamerChoice, ClientMessageType, CursorLocation, IVote, Vote, GameState, IGameState } from "@/lib/schemas";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { Draw, drawLine } from "@/utils/drawLine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Audience() {
  const [voting, setVoting] = useState(false);
  const router = useRouter();

  const [color, setColor] = useState<string>('#000')
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(500);
  const matchesMd = useMediaQuery("(min-width: 768px)");
  const { containerRef, size: containerSize } = useContainerSize();
  const canvasRefA = useRef<HTMLCanvasElement>(null)
  const canvasRefB = useRef<HTMLCanvasElement>(null)

  function handleAudienceDrawing(drawData: IDrawUpdate) {
    if (drawData.gamer == GamerChoice.GamerA) {
      const canvas = canvasRefA.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawLine({ prevPoint: drawData.prevPoint, currentPoint: drawData.currentPoint, ctx, color })
    }
    if (drawData.gamer == GamerChoice.GamerB) {
      const canvas = canvasRefB.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawLine({ prevPoint: drawData.prevPoint, currentPoint: drawData.currentPoint, ctx, color })
    }
  }

  function handleSendVote(userChoice: GamerChoice) {
    const sendVote = Vote.encode({
      choice: userChoice,
    });
    window.SCRIBBLE_SOCK.send(getDTOBuffer(sendVote, ClientMessageType.Vote));
  }

  function handleGameState(gameState: IGameState) {
    gameState.drawings.forEach((d, i) => {
      let canvas = i == 0 ? canvasRefA.current : canvasRefB.current
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // DO DRAW HERE 
    })
  }

  useEffect(() => {
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.DrawUpdate:
          console.log("DRAWING" + data);
          handleAudienceDrawing(DrawUpdate.decode(data));
          return;
        case ServerMessageType.VotingSTG:
          console.log("COMMENCE VOTING" + data);
          setVoting(true);
          return;
        case ServerMessageType.GameState:
          handleGameState(GameState.decode(data));
          return;
      }
    }
    window.SCRIBBLE_SOCK.addEventListener('message', message);
    return () => {
      window.SCRIBBLE_SOCK.removeEventListener('message', message);
    }
  }, [])

  useEffect(() => {
    if (containerSize.height < containerSize.width)
      setCanvasSize(containerSize.height * 0.7)
    else
      setCanvasSize(containerSize.width * 0.5 * 0.8)
  }, [matchesMd, containerSize])

  return (
    <div
      className='h-[calc(100vh-157px)] bg-slate-700 flex justify-center items-center'>
      <div
        ref={containerRef}
        className={`flex ${containerSize.width > containerSize.height ? "flex-row" : "flex-col"} justify-center items-center lg:space-x-6 w-full h-full`}>
        <div className="flex flex-col">
          <canvas
            ref={canvasRefA}
            height={canvasSize}
            width={canvasSize}
            className='bg-white border-8 rounded-lg border-secondary border-solid'
          />
          {voting &&
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSendVote(GamerChoice.GamerA);
              }}
              className="btn border-none text-xs md:text-md">Vote</button>
          }
        </div>
        <div className="flex flex-col">
          <canvas
            ref={canvasRefB}
            height={canvasSize}
            width={canvasSize}
            className='bg-white duration-200 border-8 rounded-lg border-red-400 border-solid'
          />
          {voting &&
            <button
              onClick={(e) => {
                e.preventDefault();
                handleSendVote(GamerChoice.GamerB);
              }}
              className="btn border-none text-xs md:text-md">Vote</button>
          }
        </div>
      </div>
    </div >
  )
}