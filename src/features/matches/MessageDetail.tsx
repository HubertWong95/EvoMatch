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
  clientNonce?: string; // <<— NEW
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

  // Track seen IDs to avoid duplicates from multiple events
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Track our own pending nonces for optimistic replacement
  const myNoncesRef = useRef<Set<string>>(new Set());

  // Load history
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api<{ opponent: Opponent; messages: ChatMessage[] }>(
          `/messages?matchId=${matchId}`
        );
        if (!alive) return;
        setOpponent(res.opponent);
        setMessages(res.messages);
        // seed seenIds with existing messages
        const next = new Set<string>();
        for (const m of res.messages) if (m.id) next.add(m.id);
        seenIdsRef.current = next;
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      seenIdsRef.current.clear();
      myNoncesRef.current.clear();
    };
  }, [matchId]);

  // Socket listeners — handle BOTH events but dedupe
  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);

    const normalize = (payload: any): ChatMessage | null => {
      if (!payload) return null;
      const msg = payload.message || payload;
      const body = msg.body ?? msg.text;
      if (!body) return null;
      return {
        id: msg.id,
        fromId: msg.fromId,
        toId: msg.toId,
        body,
        createdAt: msg.createdAt,
        clientNonce: msg.clientNonce,
      };
    };

    const appendOrReplace = (msg: ChatMessage) => {
      // 1) If server echoes our nonce, replace optimistic message
      if (msg.clientNonce && myNoncesRef.current.has(msg.clientNonce)) {
        setMessages((prev) => {
          const localId = `local-${msg.clientNonce}`;
          const idx = [...prev].reverse().findIndex((m) => m.id === localId);
          if (idx !== -1) {
            const realIdx = prev.length - 1 - idx;
            const next = prev.slice();
            next[realIdx] = msg;
            seenIdsRef.current.add(msg.id);
            myNoncesRef.current.delete(msg.clientNonce!);
            return next;
          }
          // If we didn't find a matching optimistic message, just dedupe by id:
          if (msg.id && seenIdsRef.current.has(msg.id)) return prev;
          seenIdsRef.current.add(msg.id);
          return [...prev, msg];
        });
        return;
      }

      // 2) Otherwise, dedupe by server id (covers double events)
      if (msg.id && seenIdsRef.current.has(msg.id)) return;
      seenIdsRef.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    };

    const onChat = (p: any) => {
      if (p.matchId !== matchId) return;
      const n = normalize(p);
      if (!n) return;
      appendOrReplace(n);
    };

    const onNew = (p: any) => {
      if (p.matchId !== matchId) return;
      const n = normalize(p);
      if (!n) return;
      appendOrReplace(n);
    };

    s.on("chat:message", onChat);
    s.on("message:new", onNew);
    return () => {
      s.off("chat:message", onChat);
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
    const clientNonce = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    myNoncesRef.current.add(clientNonce);

    // optimistic
    const optimistic: ChatMessage = {
      id: `local-${clientNonce}`,
      fromId: user.id,
      toId: opponent.id,
      body: text,
      createdAt: new Date().toISOString(),
      clientNonce,
    };
    setMessages((m) => [...m, optimistic]);

    if (inDemoMode) return;

    try {
      const s = getSocket(token!);
      s.emit("chat:send", {
        matchId,
        toUserId: opponent.id,
        text,
        clientNonce, // <<— send nonce so server echoes it back
      });
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
