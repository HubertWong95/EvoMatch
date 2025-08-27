import { useEffect, useState } from "react";
import PixelButton from "@/components/PixelButton";

export interface TriviaQuestion {
  question: string;
  opponentAnswer: string;
}

interface TriviaBoxProps {
  question: TriviaQuestion;
  onAnswerSubmit: (isCorrect: boolean) => void;
}

const TriviaBox = ({ question, onAnswerSubmit }: TriviaBoxProps) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [phase, setPhase] = useState<"answering" | "revealing">("answering");
  const [wasCorrect, setWasCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (phase === "answering") {
        submitAnswer();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, phase]);

  // Auto move to next question after reveal
  useEffect(() => {
    if (phase === "revealing") {
      const revealTimer = setTimeout(() => {
        onAnswerSubmit(wasCorrect);
        setUserAnswer("");
        setWasCorrect(false);
        setPhase("answering");
        setTimeLeft(5);
      }, 5000);
      return () => clearTimeout(revealTimer);
    }
  }, [phase, wasCorrect, onAnswerSubmit]);

  const submitAnswer = () => {
    const trimmed = userAnswer.trim();
    const isCorrect =
      trimmed.toLowerCase() === question.opponentAnswer.toLowerCase();
    setWasCorrect(isCorrect);
    setPhase("revealing");
    setTimeLeft(3);
  };

  return (
    <div className="bg-white border-4 border-black p-8 text-center space-y-6 shadow-[4px_4px_0_#000] font-pixel text-black max-w-lg w-full">
      {/* Countdown Number */}
      <div className="flex justify-center">
        <div
          key={timeLeft}
          className={`
            text-6xl
            ${timeLeft <= 3 ? "animate-shake" : ""}
            animate-pulseScale
            transition-all duration-100
          `}
        >
          {timeLeft}
        </div>
      </div>

      <h2 className="text-lg">Trivia Time!</h2>
      <p className="text-base">{question.question}</p>

      {phase === "answering" ? (
        <>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer"
            className="pixel-input w-full bg-gray-100 text-black border border-black p-2"
          />
          <PixelButton onClick={submitAnswer} className="mt-4">
            Submit
          </PixelButton>
        </>
      ) : (
        <div className="space-y-2">
          <p>
            <strong>Your Answer:</strong>{" "}
            {userAnswer.trim() === "" ? "(No answer)" : userAnswer}
          </p>
          <p>
            <strong>Their Answer:</strong> {question.opponentAnswer}
          </p>
        </div>
      )}
    </div>
  );
};

export default TriviaBox;
