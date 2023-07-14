'use client'
import { useContainerSize } from "@/hooks/useContainerSize";
import { useDraw } from "@/hooks/useDraw";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWindowSize } from "@/hooks/useWindowSize";
import { IStroke, ICursorLocation, ServerMessageType, DrawUpdate, IDrawUpdate, GamerChoice, ClientMessageType, CursorLocation, IVote, Vote } from "@/lib/schemas";
import { deserialize, getDTOBuffer } from "@/utils/bopUtils";
import { Draw, drawLine } from "@/utils/drawLine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Audience() {
  const [color, setColor] = useState<string>('#000')
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(500);

  const router = useRouter();

  const matchesMd = useMediaQuery("(min-width: 768px)");
  const { containerRef, size: containerSize } = useContainerSize();
  const canvasRef1 = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)

  const [voting, setVoting] = useState(false);

  function handleAudienceDrawing(drawData: IDrawUpdate) {
    if (drawData.gamer == GamerChoice.GamerA) {
      const canvas = canvasRef1.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawLine({ prevPoint: drawData.prevPoint, currentPoint: drawData.currentPoint, ctx, color })
    }
    if (drawData.gamer == GamerChoice.GamerB) {
      const canvas = canvasRef2.current;
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

  useEffect(() => {
    const message = async (event: MessageEvent<Blob>) => {
      const { type, data } = await deserialize(event);
      switch (type) {
        case ServerMessageType.DrawUpdate:
          console.log("DRAWING" + data);
          handleAudienceDrawing(DrawUpdate.decode(data));
        case ServerMessageType.VotingSTG:
          console.log("COMMENCE VOTING" + data);
          setVoting(true);
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
            ref={canvasRef1}
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
            ref={canvasRef2}
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