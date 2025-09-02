// src/features/discover/Discover.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MatchConfirm from "./MatchConfirm";
import TriviaBox from "./TriviaBox";
import { useAuth } from "@/features/auth/useAuth";
import { getSocket } from "@/lib/socket";
import { generateTrivia } from "@/utils/generateTrivia";

// Basic shapes for local state
type Opponent = {
  id: string;
  name: string;
  avatarUrl?: string;
  figurineUrl?: string;
  hobbies?: string[];
  location?: string;
};

type QueueState = "idle" | "searching" | "matched" | "in-session";

export default function Discover() {
  const { user } = useAuth();
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // trivia pipeline (client fallback; server will drive this later)
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const inDemoMode = useMemo(() => {
    // If we cannot connect a socket (no backend yet), we run demo flow.
    return !token;
  }, [token]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    try {
      const s = getSocket(token);
      socketRef.current = s;

      // Matched event -> show opponent card then start session
      s.on(
        "queue:matched",
        (payload: { sessionId: string; opponent: Opponent }) => {
          setOpponent(payload.opponent);
          setSessionId(payload.sessionId);
          setQueueState("matched");
        }
      );

      // Server sends question text
      s.on("session:question", (payload: { index: number; text: string }) => {
        setQuestions((prev) => {
          const next = [...prev];
          next[payload.index] = payload.text;
          return next;
        });
        setQuestionIndex(payload.index);
        setQueueState("in-session");
      });

      // Server updates score after comparing both answers
      s.on("session:score", (payload: { scoreA: number; scoreB: number }) => {
        // Assume current user is A; server can send a role flag if needed
        setMyScore(payload.scoreA);
        setOppScore(payload.scoreB);
      });

      // Session complete
      s.on(
        "session:complete",
        (payload: { matched: boolean; finalScore: number }) => {
          // You can navigate or show a modal here; for now just log
          // In a real flow, redirect to /matches if matched
          console.log("session complete", payload);
        }
      );
    } catch {
      // If socket fails, remain in demo mode
    }

    return () => {
      socketRef.current?.off("queue:matched");
      socketRef.current?.off("session:question");
      socketRef.current?.off("session:score");
      socketRef.current?.off("session:complete");
    };
  }, [token]);

  // Join queue (server) or start demo
  const handleFindOpponent = useCallback(() => {
    if (inDemoMode) {
      // Demo: fake opponent + local questions
      const demoOpponent: Opponent = {
        id: "demo-2",
        name: "Jordan (demo)",
        figurineUrl:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
        hobbies: ["Art", "Music", "Reading"],
        location: "Portland, OR",
      };
      setOpponent(demoOpponent);
      setQueueState("matched");
      setSessionId("demo-session");

      const qs = generateTrivia(10); // fallback questions
      setQuestions(qs);
      setQuestionIndex(0);
      setMyScore(0);
      setOppScore(0);
      return;
    }

    // Real queue
    setQueueState("searching");
    socketRef.current?.emit("queue:join", {
      hobbyFilters: user?.hobbies ?? [],
    });
  }, [inDemoMode, user?.hobbies]);

  const handleCancelQueue = useCallback(() => {
    if (inDemoMode) {
      setQueueState("idle");
      setOpponent(null);
      return;
    }
    socketRef.current?.emit("queue:leave");
    setQueueState("idle");
    setOpponent(null);
  }, [inDemoMode]);

  const handleStartMatch = useCallback(() => {
    if (inDemoMode) {
      setQueueState("in-session");
      // in demo, questions are already generated
      return;
    }
    // With a real server, the server will push the first question automatically.
    // If you need to trigger it, you can emit: socket.emit("session:start", { sessionId });
    setQueueState("in-session");
  }, [inDemoMode]);

  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!sessionId) return;

      if (inDemoMode) {
        // Local similarity: naive compare to a fake opponent answer
        // (For demo we just randomly decide similarity)
        const similar = Math.random() > 0.4; // ~60% agree
        setMyScore((s) => s + (similar ? 1 : -1));
        setOppScore((s) => s + (similar ? 1 : -1));

        const next = questionIndex + 1;
        if (next < questions.length) {
          setQuestionIndex(next);
        } else {
          // end of session
          // In real flow you'd persist and route to /matches if >=5
          console.log("Demo session complete. Final score:", myScore);
        }
        return;
      }

      socketRef.current?.emit("session:answer", {
        sessionId,
        questionIndex,
        text: answer,
      });
    },
    [inDemoMode, questionIndex, questions.length, sessionId, myScore]
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
        <h2 className="mb-4 font-pixel text-xl">Find someone by hobby</h2>
        <div className="flex flex-wrap items-center gap-3">
          {queueState === "idle" || queueState === "searching" ? (
            <>
              <button
                onClick={handleFindOpponent}
                disabled={queueState === "searching"}
                className="rounded-md border-2 border-black bg-game-green px-4 py-2 font-pixel shadow hover:translate-y-0.5 disabled:opacity-60"
              >
                {queueState === "searching" ? "Searching…" : "Find Opponent"}
              </button>
              {queueState === "searching" && (
                <button
                  onClick={handleCancelQueue}
                  className="rounded-md border-2 border-black bg-game-red px-4 py-2 font-pixel text-game-white shadow hover:translate-y-0.5"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleCancelQueue}
              className="rounded-md border-2 border-black bg-game-red px-4 py-2 font-pixel text-game-white shadow hover:translate-y-0.5"
            >
              Leave
            </button>
          )}

          <span className="font-pixel text-sm opacity-70">
            Mode: {inDemoMode ? "Demo (no server)" : "Live"}
          </span>
        </div>
      </section>

      {queueState === "matched" && opponent && (
        <MatchConfirm opponent={opponent} onStart={handleStartMatch} />
      )}

      {queueState === "in-session" && opponent && (
        <TriviaBox
          opponent={opponent}
          sessionId={sessionId!}
          question={questions[questionIndex]}
          index={questionIndex}
          total={questions.length || 10}
          myScore={myScore}
          oppScore={oppScore}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
    </div>
  );
}
