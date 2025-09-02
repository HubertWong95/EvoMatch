// src/features/matches/Messages.tsx
// Optional "all conversations" screen. If you don't need it, you can remove this route.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";

type Thread = {
  id: string; // matchId
  opponentName: string;
  preview: string;
  updatedAt: string;
};

export default function Messages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api<{ threads: Thread[] }>("/api/messages/threads");
        if (active) setThreads(res.threads);
      } catch {
        if (active) {
          setThreads([
            {
              id: "demo-m1",
              opponentName: "Jordan (demo)",
              preview: "See you at the gallery!",
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
      <h2 className="mb-4 font-pixel text-xl">Messages</h2>
      {loading ? (
        <div className="font-pixel">Loading…</div>
      ) : threads.length === 0 ? (
        <p className="font-pixel text-sm opacity-70">No conversations yet.</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                to={`/messages/${t.id}`}
                className="flex items-center justify-between rounded-xl border-4 border-black bg-white p-3 shadow hover:translate-y-0.5"
              >
                <div>
                  <div className="font-pixel">{t.opponentName}</div>
                  <div className="text-sm opacity-70">{t.preview}</div>
                </div>
                <div className="font-pixel text-xs opacity-70">
                  {new Date(t.updatedAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
