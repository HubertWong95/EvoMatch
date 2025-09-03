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
import { getSocket, disconnectSocket } from "@/lib/socket";
import { generateTrivia } from "@/utils/generateTrivia";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const inDemoMode = useMemo(() => !token, [token]);

  // 🔄 Reset all state when the logged-in user changes
  useEffect(() => {
    setQueueState("idle");
    setOpponent(null);
    setSessionId(null);
    setQuestions([]);
    setQuestionIndex(0);
    setTotalQuestions(10);
    setMyScore(0);
    setOppScore(0);

    // hard reset socket as well
    disconnectSocket();
  }, [user?.id]);

  // Socket setup
  useEffect(() => {
    if (!token) return;

    const s = getSocket(token);
    socketRef.current = s;
    setSocketConnected(s.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    const onMatched = (payload: { sessionId: string; opponent: Opponent }) => {
      setOpponent(payload.opponent);
      setSessionId(payload.sessionId);
      setQueueState("matched");
      setMyScore(0);
      setOppScore(0);
      setQuestionIndex(0);
      setTotalQuestions(10);
    };

    const onStarted = (payload: { sessionId: string; total?: number }) => {
      if (payload.total && payload.total > 0) setTotalQuestions(payload.total);
    };

    const onQuestion = (payload: {
      index: number;
      text: string;
      total?: number;
    }) => {
      if (payload.total && payload.total > 0) setTotalQuestions(payload.total);
      setQuestions((prev) => {
        const next = [...prev];
        next[payload.index] = payload.text;
        return next;
      });
      setQuestionIndex(payload.index);
      setQueueState("in-session");
    };

    const onScore = (payload: { scoreA: number; scoreB: number }) => {
      setMyScore(payload.scoreA);
      setOppScore(payload.scoreB);
    };

    const onComplete = (_payload: {
      matched?: boolean;
      finalScore?: number;
    }) => {
      // Small delay for UX, then go to matches
      setTimeout(() => navigate("/matches"), 800);
    };

    const onEnded = () => {
      // if opponent leaves, bring user back to idle
      setQueueState("idle");
      setOpponent(null);
      setSessionId(null);
      setQuestions([]);
      setQuestionIndex(0);
      setTotalQuestions(10);
      setMyScore(0);
      setOppScore(0);
    };

    const onQueueError = () => setQueueState("idle");

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("queue:matched", onMatched);
    s.on("session:started", onStarted);
    s.on("session:question", onQuestion);
    s.on("session:score", onScore);
    s.on("session:complete", onComplete);
    s.on("session:ended", onEnded);
    s.on("queue:error", onQueueError);

    const leave = () => s.emit("queue:leave");
    window.addEventListener("beforeunload", leave);

    return () => {
      try {
        s.emit("queue:leave");
      } catch {}
      window.removeEventListener("beforeunload", leave);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("queue:matched", onMatched);
      s.off("session:started", onStarted);
      s.off("session:question", onQuestion);
      s.off("session:score", onScore);
      s.off("session:complete", onComplete);
      s.off("session:ended", onEnded);
      s.off("queue:error", onQueueError);
    };
  }, [token, navigate]);

  const handleFindOpponent = useCallback(() => {
    if (queueState === "searching") return;

    if (inDemoMode) {
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

      const qs = generateTrivia(10);
      setQuestions(qs);
      setQuestionIndex(0);
      setMyScore(0);
      setOppScore(0);
      setTotalQuestions(10);
      return;
    }

    if (!socketConnected) {
      setTimeout(() => {
        if (socketRef.current && !inDemoMode) {
          doJoin();
        }
      }, 300);
    } else {
      doJoin();
    }

    function doJoin() {
      const payload: Record<string, any> = {};
      if (user?.hobbies && user.hobbies.length > 0) {
        payload.hobbyFilters = user.hobbies;
      }
      setQueueState("searching");
      socketRef.current?.emit("queue:join", payload);
    }
  }, [inDemoMode, queueState, socketConnected, user?.hobbies]);

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
      return;
    }
    if (!sessionId) return;
    socketRef.current?.emit("session:ready", { sessionId });
  }, [inDemoMode, sessionId]);

  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!sessionId) return;

      if (inDemoMode) {
        const similar = Math.random() > 0.4;
        setMyScore((s) => s + (similar ? 1 : -1));
        setOppScore((s) => s + (similar ? 1 : -1));
        const next = questionIndex + 1;
        if (next < totalQuestions) setQuestionIndex(next);
        return;
      }

      socketRef.current?.emit("session:answer", {
        sessionId,
        questionIndex,
        text: answer,
      });
    },
    [inDemoMode, questionIndex, sessionId, totalQuestions]
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
            Mode:{" "}
            {inDemoMode
              ? "Demo (no server)"
              : socketConnected
              ? "Live"
              : "Connecting…"}
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
          total={totalQuestions}
          myScore={myScore}
          oppScore={oppScore}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
    </div>
  );
}
