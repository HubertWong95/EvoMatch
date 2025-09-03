// web/src/features/discover/TriviaBox.tsx
import React, { useMemo, useState } from "react";

type Props = {
  opponent: { id: string; name: string; avatarUrl?: string };
  sessionId: string;
  question: string | undefined;
  index: number;
  total: number;
  myScore: number;
  oppScore: number;
  onSubmitAnswer: (answer: string) => void;
};

function onlyText(q: string | undefined): string {
  if (!q) return "";
  const t = q.trim();

  // If someone stored a JSON blob or stringified object, extract text/question
  if (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        for (const x of parsed) {
          if (typeof x === "string") return x;
          if (typeof x?.text === "string") return x.text;
          if (typeof x?.question === "string") return x.question;
        }
        return "";
      }
      if (typeof parsed === "string") return parsed;
      if (typeof parsed?.text === "string") return parsed.text;
      if (typeof parsed?.question === "string") return parsed.question;
    } catch {
      // Not valid JSON—fall through
    }
  }

  // strip a "Question: " prefix if presents
  return t.replace(/^Question:\s*/i, "");
}

function scoreColor(score: number) {
  if (score >= 5) return "bg-green-500";
  if (score >= 3) return "bg-yellow-400";
  if (score >= 1) return "bg-orange-500";
  return "bg-red-500";
}

export default function TriviaBox({
  opponent,
  sessionId,
  question,
  index,
  total,
  myScore,
  oppScore,
  onSubmitAnswer,
}: Props) {
  const [answer, setAnswer] = useState("");
  const qText = useMemo(() => onlyText(question), [question]);

  // single shared score (they move together)
  const sharedScore = Math.min(myScore, oppScore);
  const canSubmit = qText.length > 0 && answer.trim().length > 0;

  return (
    <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-pixel text-lg">
          Question {index + 1} / {total || 10}
        </div>
        <div className="flex items-center gap-2">
          {opponent.avatarUrl && (
            <img
              src={opponent.avatarUrl}
              alt={opponent.name}
              className="h-8 w-8 rounded-full border border-black object-cover"
            />
          )}
          <span className="font-pixel text-sm opacity-80">
            vs {opponent.name}
          </span>
        </div>
      </div>

      <p className="mb-4 rounded-md border-2 border-black bg-game-yellow/30 p-3 font-pixel">
        {qText || "Loading question…"}
      </p>

      {/* Energy bar: single shared score */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs font-pixel opacity-75">
          <span>Match energy</span>
          <span>{sharedScore} / 10</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-black bg-gray-200">
          <div
            className={`h-full ${scoreColor(sharedScore)} transition-all`}
            style={{ width: `${Math.max(0, Math.min(10, sharedScore)) * 10}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border-2 border-black p-2 font-pixel"
          placeholder="Type your answer…"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!qText}
        />
        <button
          className="rounded-md border-2 border-black bg-game-green px-4 py-2 font-pixel shadow disabled:opacity-60"
          onClick={() => {
            if (!canSubmit) return;
            onSubmitAnswer(answer.trim());
            setAnswer("");
          }}
          disabled={!canSubmit}
        >
          Submit
        </button>
      </div>
    </section>
  );
}
