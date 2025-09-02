// src/features/discover/TriviaBox.tsx
import React, { useState } from "react";

type Opponent = {
  id: string;
  name: string;
  avatarUrl?: string;
  figurineUrl?: string;
};

export default function TriviaBox({
  opponent,
  sessionId,
  question,
  index,
  total,
  myScore,
  oppScore,
  onSubmitAnswer,
}: {
  opponent: Opponent;
  sessionId: string;
  question?: string;
  index: number;
  total: number;
  myScore: number;
  oppScore: number;
  onSubmitAnswer: (answer: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      onSubmitAnswer(answer.trim());
      setAnswer("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
      <header className="mb-4 flex items-center gap-3">
        <img
          src={opponent.figurineUrl || opponent.avatarUrl || "/favicon.svg"}
          alt={opponent.name}
          className="h-10 w-10 rounded-md border-2 border-black object-cover"
        />
        <div>
          <div className="font-pixel text-sm">Playing vs {opponent.name}</div>
          <div className="font-pixel text-xs opacity-70">
            Session: {sessionId}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md border-2 border-black bg-game-green px-2 py-1 font-pixel text-xs">
            You: {myScore}
          </span>
          <span className="rounded-md border-2 border-black bg-game-pink px-2 py-1 font-pixel text-xs">
            Opp: {oppScore}
          </span>
        </div>
      </header>

      <div className="mb-3 rounded-md border-2 border-black bg-game-yellow/60 p-3">
        <div className="mb-1 font-pixel text-xs opacity-70">
          Question {index + 1} / {Math.max(total, index + 1)}
        </div>
        <div className="font-pixel text-base">
          {question ?? "Waiting for question…"}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-md border-2 border-black px-3 py-2 focus:outline-none"
          placeholder="Type your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!question}
        />
        <button
          type="submit"
          disabled={!question || submitting}
          className="rounded-md border-2 border-black bg-game-blue px-4 py-2 font-pixel text-game-white shadow hover:translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit"}
        </button>
      </form>

      <p className="mt-3 font-pixel text-xs opacity-70">
        +1 similar • −1 mismatch • Match at ≥ 5 points.
      </p>
    </section>
  );
}
