import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import MatchConfirm from "../components/MatchConfirm";
import { mockProfiles, UserProfile } from "@/mock/mockProfiles";
import bg from "./discoverBckgrd.png";
import HobbyBadge from "@/components/HobbyBadge";
import TriviaBox from "@/components/TriviaBox_with_api";
// import { getCurrentUser } from "@/lib/userService";
import { generateTriviaQuestion } from "@/utils/generateTrivia";
import { TriviaQuestion } from "@/mock/triviaQuestions";
import { isAnswerSimilar } from "@/utils/isAnswerSimilar";
import { mockOpponentAnswers } from "@/mock/mockOpponentAnswers";
import { getCurrentUser, updateUser } from "@/lib/userService";

const DiscoverPage = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [inTrivia, setInTrivia] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [yourHobbies, setYourHobbies] = useState<string[]>([]);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [loadingTrivia, setLoadingTrivia] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);

  const currentProfile = profiles[currentProfileIndex];

  useEffect(() => {
    setProfiles(mockProfiles);
    const user = getCurrentUser();
    if (user?.hobbies) setYourHobbies(user.hobbies);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleConfirm = async () => {
    if (!currentProfile || yourHobbies.length === 0) return;

    setInTrivia(true);
    setQuestionIndex(0);
    setScore(0);
    setLoadingTrivia(true);
    setGenerationFailed(false);

    const opponentHobbies = currentProfile.hobbies;
    const generatedQuestions: TriviaQuestion[] = [];

    for (let i = 0; i < 10; i++) {
      try {
        const aiQuestion = await generateTriviaQuestion(
          yourHobbies,
          opponentHobbies
        );
        generatedQuestions.push({
          question: aiQuestion.question,
          opponentAnswer: mockOpponentAnswers[i] || "Pizza",
        });
      } catch (err) {
        console.error("Trivia generation failed:", err);
      }
    }

    if (generatedQuestions.length === 0) {
      setGenerationFailed(true);
      setInTrivia(false);
    } else {
      setTriviaQuestions(generatedQuestions);
    }

    setLoadingTrivia(false);
  };

  const handleCancel = () => {
    setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
  };

  const addMatchToSession = (profile: UserProfile) => {
    const user = getCurrentUser();
    if (!user) return;

    const alreadyMatched = user.matching?.includes(profile.id);
    if (alreadyMatched) return;

    const updatedUser = {
      ...user,
      matching: [...(user.matching || []), profile.id],
    };

    updateUser(updatedUser);
    console.log("✅ Match added:", profile.name);
  };

  const handleTriviaAnswer = async (userAnswer: string) => {
    const opponentAnswer = triviaQuestions[questionIndex].opponentAnswer;

    const isCorrect = await isAnswerSimilar(userAnswer, opponentAnswer);
    const newScore = Math.max(0, isCorrect ? score + 1 : score - 1);
    setScore(newScore);

    if (questionIndex < triviaQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      if (newScore >= 5 && currentProfile) {
        addMatchToSession(currentProfile);
      }
      moveToNextProfile();
    }
  };

  const moveToNextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex((prev) => prev + 1);
    } else {
      setProfiles([]);
    }
    setInTrivia(false);
    setScore(0);
    setQuestionIndex(0);
    setTriviaQuestions([]);
  };

  const renderMatchMeter = () => (
    <div className="flex justify-center mb-4">
      <div className="relative flex flex-col-reverse h-64 w-8 border-4 border-game-black bg-white shadow-[4px_4px_0_#000] p-1 gap-[2px]">
        {[...Array(10)].map((_, i) => {
          let colorClass = "bg-gray-200";

          if (i < score) {
            if (score >= 5) {
              colorClass = "bg-game-green";
            } else if (score === 4) {
              colorClass = "bg-game-yellow";
            } else {
              colorClass = "bg-game-red";
            }
          }

          return (
            <div
              key={i}
              className={`flex-1 w-full ${colorClass} transition-all duration-300`}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full">
      <div
        className="fixed inset-0 bg-contain bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url(${bg})`,
          imageRendering: "pixelated",
          overflow: "hidden",
        }}
      />

      <main>
        {inTrivia && currentProfile && triviaQuestions.length > 0 ? (
          <div className="flex justify-center items-start gap-4 mt-6">
            <TriviaBox
              question={triviaQuestions[questionIndex]}
              onAnswerSubmit={handleTriviaAnswer}
            />
            {renderMatchMeter()}
          </div>
        ) : loadingTrivia ? (
          <div className="text-center mt-60 font-pixel text-5xl text-game-white">
            Let's get Started!
          </div>
        ) : generationFailed ? (
          <div className="text-center mt-10 font-pixel text-xl text-red-600">
            Trivia generation failed. Please try again later.
          </div>
        ) : currentProfile ? (
          <>
            {/* Opponent Info */}
            <div className="fixed max-w-sm top-4 left-[450px] z-10">
              <div
                className="bg-game-white text-black p-4"
                style={{ boxShadow: "4px 4px 0 #333" }}
              >
                {currentProfile.avatar && (
                  <img
                    src={currentProfile.avatar}
                    alt={`${currentProfile.name}'s avatar`}
                    className="w-12 h-12 rounded mb-2 border-[2px] border-black"
                  />
                )}
                <p className="font-pixel mb-1">
                  {currentProfile.name}, {currentProfile.age}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentProfile.hobbies.map((hobby) => (
                    <HobbyBadge key={hobby} hobby={hobby} readOnly />
                  ))}
                </div>
              </div>
              <div
                className="absolute -bottom-2 right-4 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #DDEEEB",
                  filter: "drop-shadow(4px 4px 0 #333)",
                }}
              />
            </div>

            <div className="fixed bottom-[260px] right-[360px]">
              {currentProfile.figurine && (
                <img
                  src={currentProfile.figurine}
                  alt={`${currentProfile.name}'s figurine`}
                  className="w-96 h-96"
                />
              )}
            </div>

            {/* User (you) */}
            <div className="fixed max-w-sm bottom-[240px] right-[450px]">
              <div
                className="bg-game-white text-black p-4"
                style={{ boxShadow: "4px 4px 0 #333" }}
              >
                <p className="font-pixel mb-1">Victoria, 24</p>
              </div>
              <div
                className="absolute -bottom-2 left-4 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #DDEEEB",
                  filter: "drop-shadow(4px 4px 0 #333)",
                }}
              />
            </div>

            <div className="fixed bottom-[40px] left-[240px] p-4">
              <img
                src="https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif"
                alt="Pikachu back sprite"
                className="w-96 h-96"
              />
            </div>

            <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2">
              <MatchConfirm onConfirm={handleConfirm} onCancel={handleCancel} />
            </div>
          </>
        ) : (
          <div className="text-center mt-20 font-pixel text-xl text-game-black">
            No more profiles!
          </div>
        )}
      </main>

      {!inTrivia && <Navbar />}
    </div>
  );
};

export default DiscoverPage;
