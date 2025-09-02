// src/features/matches/Matches.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/features/auth/useAuth";

type MatchRow = {
  id: string; // matchId
  opponent: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    figurineUrl?: string;
  };
  lastMessage?: {
    body: string;
    createdAt: string;
  };
  score?: number;
};

export default function Matches() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // GET /api/matches -> { matches: MatchRow[] }
        const res = await api<{ matches: MatchRow[] }>("/api/matches");
        if (active) setRows(res.matches);
      } catch {
        // demo fallback if backend not ready
        if (active) {
          setRows([
            {
              id: "demo-m1",
              opponent: {
                id: "demo-2",
                name: "Jordan (demo)",
                figurineUrl:
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
              },
              lastMessage: {
                body: "See you at the gallery!",
                createdAt: new Date().toISOString(),
              },
              score: 6,
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
    <div className="grid gap-6">
      <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
        <h2 className="mb-4 font-pixel text-xl">Your matches</h2>

        {loading ? (
          <div className="font-pixel">Loading…</div>
        ) : rows.length === 0 ? (
          <p className="font-pixel text-sm opacity-70">
            No matches yet — try{" "}
            <Link to="/discover" className="underline">
              Discover
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/messages/${m.id}`}
                  className="flex items-center gap-4 rounded-xl border-4 border-black bg-white p-3 shadow hover:translate-y-0.5"
                >
                  <img
                    src={
                      m.opponent.figurineUrl ||
                      m.opponent.avatarUrl ||
                      "/favicon.svg"
                    }
                    alt={m.opponent.name}
                    className="h-12 w-12 rounded-md border-2 border-black object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate font-pixel">
                        {m.opponent.name || m.opponent.username}
                      </h3>
                      {typeof m.score === "number" && (
                        <span className="ml-3 rounded-md border-2 border-black bg-game-yellow px-2 py-1 font-pixel text-xs">
                          Score {m.score}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm opacity-70">
                      {m.lastMessage?.body ?? "Say hi!"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
