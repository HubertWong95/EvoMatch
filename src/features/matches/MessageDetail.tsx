// src/features/matches/MessageDetail.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/features/auth/useAuth";
import { getSocket } from "@/lib/socket";
import MessageBox from "./MessageBox";

type ChatMessage = {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
};
type Opponent = {
  id: string;
  name: string;
  avatarUrl?: string;
  figurineUrl?: string;
};

export default function MessageDetail() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const inDemoMode = useMemo(() => !token, [token]);

  // Load history
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<{ opponent: Opponent; messages: ChatMessage[] }>(
          `/api/messages?matchId=${matchId}`
        );
        if (!active) return;
        setOpponent(res.opponent);
        setMessages(res.messages);
      } catch {
        if (!active) return;
        // demo seed
        setOpponent({
          id: "demo-2",
          name: "Jordan (demo)",
          figurineUrl:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
        });
        setMessages([
          {
            id: "demo-msg-1",
            fromId: "demo-2",
            toId: "me",
            body: "Hey! That trivia round was fun 😄",
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId]);

  // Live updates via socket
  useEffect(() => {
    if (!token) return; // demo mode without socket
    const s = getSocket(token);
    const onNew = (payload: { matchId: string; message: ChatMessage }) => {
      if (payload.matchId !== matchId) return;
      setMessages((m) => [...m, payload.message]);
    };
    s.on("message:new", onNew);
    return () => {
      s.off("message:new", onNew);
    };
  }, [matchId, token]);

  // autoscroll
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (!user || !opponent) return;

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      fromId: user.id,
      toId: opponent.id,
      body: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);

    if (inDemoMode) {
      // simple echo in demo
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          {
            id: `echo-${Date.now()}`,
            fromId: opponent.id,
            toId: user.id,
            body: "👍",
            createdAt: new Date().toISOString(),
          },
        ]);
      }, 600);
      return;
    }

    try {
      // Prefer socket
      const s = getSocket(token!);
      s.emit("message:send", { matchId, toId: opponent.id, body: text });
      // Or REST: await api("/api/messages", { method: "POST", body: JSON.stringify({ matchId, toId: opponent.id, body: text }) })
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border-4 border-black bg-white p-6 font-pixel shadow">
        Loading…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center gap-3">
        <img
          src={opponent?.figurineUrl || opponent?.avatarUrl || "/favicon.svg"}
          alt={opponent?.name}
          className="h-10 w-10 rounded-md border-2 border-black object-cover"
        />
        <h2 className="font-pixel text-lg">{opponent?.name}</h2>
      </header>

      <section
        ref={scrollerRef}
        className="h-[55vh] overflow-y-auto rounded-xl border-4 border-black bg-white p-4 shadow"
      >
        <ul className="space-y-2">
          {messages.map((msg) => {
            const mine = msg.fromId === user?.id || msg.fromId === "me";
            return (
              <li
                key={msg.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-md border-2 border-black px-3 py-2 font-pixel text-sm shadow ${
                    mine ? "bg-game-green" : "bg-game-yellow"
                  }`}
                  title={new Date(msg.createdAt).toLocaleString()}
                >
                  {msg.body}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <MessageBox onSend={handleSend} />
    </div>
  );
}
