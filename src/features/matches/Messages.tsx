// web/src/features/messages/Messages.tsx
import React, { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/features/auth/useAuth";

type Message = {
  id: string;
  matchId: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
};

type Props = {
  matchId: string;
  otherUserId: string;
};

export default function Messages({ matchId, otherUserId }: Props) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // (optional) load history
    (async () => {
      try {
        const resp = await fetch(
          `/api/messages?matchId=${encodeURIComponent(matchId)}`,
          {
            credentials: "include",
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          setMsgs(data.messages || []);
        }
      } catch (e) {
        console.warn("load messages failed", e);
      }
    })();
  }, [matchId]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const s = getSocket(token);

    const onMsg = (m: Message) => {
      if (m.matchId !== matchId) return;
      setMsgs((prev) => [...prev, m]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    s.on("chat:message", onMsg);
    return () => {
      s.off("chat:message", onMsg);
    };
  }, [matchId]);

  const send = () => {
    if (!text.trim() || !user) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const s = getSocket(token);
    s.emit("chat:send", { matchId, toUserId: otherUserId, text: text.trim() });
    setText("");
  };

  return (
    <div className="flex h-full flex-col rounded-xl border-4 border-black bg-white">
      <div className="flex-1 overflow-y-auto p-3">
        {msgs.map((m) => {
          const mine = m.fromId === user?.id;
          return (
            <div
              key={m.id}
              className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-md border-2 border-black p-2 font-pixel ${
                  mine ? "bg-game-green/80" : "bg-game-yellow/60"
                }`}
              >
                <div className="text-xs opacity-70">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t-4 border-black p-2">
        <input
          className="flex-1 rounded-md border-2 border-black p-2 font-pixel"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="rounded-md border-2 border-black bg-game-blue px-4 py-2 font-pixel text-white"
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}
