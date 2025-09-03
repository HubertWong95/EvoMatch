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

  // trivia state
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const mountedRef = useRef(true);

  const inDemoMode = useMemo(() => !token, [token]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Socket setup (singleton)
  useEffect(() => {
    if (!token) return;

    const s = getSocket(token);
    socketRef.current = s;

    setSocketConnected(s.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    // --- Matching (support new and legacy events) ---
    const onMatched = (payload: { sessionId: string; opponent: Opponent }) => {
      if (!mountedRef.current) return;
      setOpponent(payload.opponent);
      setSessionId(payload.sessionId);
      setQueueState("matched");
    };

    const onMatchedLegacy = (payload: {
      opponentId: string;
      sessionId: string;
    }) => {
      if (!mountedRef.current) return;
      setOpponent({ id: payload.opponentId, name: "Opponent" });
      setSessionId(payload.sessionId);
      setQueueState("matched");
    };

    // Ready-up: server will emit this after both clicked Start
    const onStarted = (payload: { sessionId: string }) => {
      // We actually flip to "in-session" on first question;
      // this event is informational (useful for a spinner if desired).
      // console.debug("[discover] session:started", payload);
    };

    // Questions (accept {text} or {question})
    const onQuestion = (payload: {
      sessionId?: string;
      index?: number;
      text?: string;
      question?: string;
    }) => {
      const idx = typeof payload.index === "number" ? payload.index : 0;
      const qText =
        typeof payload.text === "string"
          ? payload.text
          : typeof payload.question === "string"
          ? payload.question
          : undefined;
      if (!mountedRef.current || !qText) return;

      setQuestions((prev) => {
        const next = [...prev];
        next[idx] = qText;
        return next;
      });
      setQuestionIndex(idx);
      setQueueState("in-session"); // enter gameplay only when a question arrives
    };

    const onScore = (payload: { scoreA?: number; scoreB?: number }) => {
      if (!mountedRef.current) return;
      if (typeof payload.scoreA === "number") setMyScore(payload.scoreA);
      if (typeof payload.scoreB === "number") setOppScore(payload.scoreB);
    };

    const onComplete = (payload: any) => {
      // console.debug("[discover] session:complete", payload);
      // Optional: navigate to /matches or show a summary
    };

    const onEnded = (payload: { reason: string; sessionId: string }) => {
      if (!mountedRef.current) return;
      // Opponent left or session cancelled; reset
      setQueueState("idle");
      setOpponent(null);
      setSessionId(null);
      setQuestions([]);
      setQuestionIndex(0);
      setMyScore(0);
      setOppScore(0);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("queue:matched", onMatched);
    s.on("match:found", onMatchedLegacy); // legacy compatibility
    s.on("session:started", onStarted);
    s.on("session:question", onQuestion);
    s.on("session:score", onScore);
    s.on("session:complete", onComplete);
    s.on("session:ended", onEnded);

    // leave queue on tab close
    const leave = () => s.emit("queue:leave");
    window.addEventListener("beforeunload", leave);

    return () => {
      window.removeEventListener("beforeunload", leave);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("queue:matched", onMatched);
      s.off("match:found", onMatchedLegacy);
      s.off("session:started", onStarted);
      s.off("session:question", onQuestion);
      s.off("session:score", onScore);
      s.off("session:complete", onComplete);
      s.off("session:ended", onEnded);
    };
  }, [token]);

  // Join queue (server) or run demo
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
      return;
    }

    const payload: Record<string, any> = {};
    if (user?.hobbies && user.hobbies.length > 0) {
      payload.hobbyFilters = user.hobbies;
    }

    setQueueState("searching");
    socketRef.current?.emit("queue:join", payload);
  }, [inDemoMode, queueState, user?.hobbies]);

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

  // ✅ Ready-up: tell the server we’re ready; wait for first question to switch UI
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
        if (next < questions.length) setQuestionIndex(next);
        return;
      }

      // Server accepts either {index} or {questionIndex}
      socketRef.current?.emit("session:answer", {
        sessionId,
        index: questionIndex,
        questionIndex: questionIndex,
        text: answer,
      });
    },
    [inDemoMode, questionIndex, questions.length, sessionId]
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
          total={questions.length || 10}
          myScore={myScore}
          oppScore={oppScore}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
    </div>
  );
}
