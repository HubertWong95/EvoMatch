// src/features/discover/MatchConfirm.tsx
import React from "react";

type Opponent = {
  id: string;
  name: string;
  avatarUrl?: string;
  figurineUrl?: string;
  hobbies?: string[];
  location?: string;
};

export default function MatchConfirm({
  opponent,
  onStart,
}: {
  opponent: Opponent;
  onStart: () => void;
}) {
  return (
    <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <img
          src={opponent.figurineUrl || opponent.avatarUrl || "/favicon.svg"}
          alt={opponent.name}
          className="h-16 w-16 rounded-md border-2 border-black object-cover"
        />
        <div>
          <h3 className="font-pixel text-lg">{opponent.name}</h3>
          <p className="text-sm opacity-70">
            {opponent.location ?? "Somewhere nearby"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(opponent.hobbies ?? []).map((h) => (
              <span
                key={h}
                className="rounded-full border-2 border-black bg-game-yellow px-3 py-1 font-pixel text-xs"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={onStart}
            className="rounded-md border-2 border-black bg-game-orange px-4 py-2 font-pixel shadow hover:translate-y-0.5"
          >
            Start Match
          </button>
        </div>
      </div>
    </section>
  );
}
