import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import MatchConfirm from "../components/MatchConfirm";
import { mockProfiles, UserProfile } from "@/mock/mockProfiles";
import bg from "./discoverBckgrd.png";
import HobbyBadge from "@/components/HobbyBadge";
import TriviaBox from "@/components/TriviaBox";
import { triviaQuestions } from "@/mock/triviaQuestions";
import { getCurrentUser, updateUser } from "@/lib/userService";

const DiscoverPage = () => {
  // Use a single index for tracking the current profile
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [inTrivia, setInTrivia] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  
  // Get current opponent from the filtered profiles array
  const currentOpponent = profiles.length > currentProfileIndex ? profiles[currentProfileIndex] : null;

  useEffect(() => {
    // If there's a current user, filter out already matched profiles
    if (currentUser && currentUser.matching) {
      // Filter profiles to remove those that are already matched
      const filteredProfiles = mockProfiles.filter(
        profile => !currentUser.matching?.includes(profile.id)
      );
      setProfiles(filteredProfiles);
      console.log('Filtered profiles:', filteredProfiles.length, 'Available to match');
    } else {
      // No user or no matches, just show all profiles
      setProfiles(mockProfiles);
    }
    
    // Reset index when profiles change
    setCurrentProfileIndex(0);
  }, [currentUser]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Get the current profile for the trivia game
  const currentProfile = profiles[currentProfileIndex];

  const handleConfirm = () => {
    if (!currentOpponent) return; // Don't proceed if opponent is null
    setInTrivia(true);
    setQuestionIndex(0);
    setScore(0);
  };

  const handleCancel = () => {
    // Don't do anything if no profiles
    if (profiles.length === 0) return;
    
    // Move to next opponent
    const nextIndex = (currentProfileIndex + 1) % profiles.length;
    setCurrentProfileIndex(nextIndex);
    
    // Log for debugging
    console.log('Moving to next profile:', nextIndex, 'Name:', profiles[nextIndex]?.name);
  };

  const addMatchToSession = (profile: UserProfile) => {
    if (!currentUser) return;
    
    // Log for debugging
    console.log('Adding match:', profile.name, 'with ID:', profile.id);
    
    // Initialize matching array if it doesn't exist
    if (!currentUser.matching) {
      currentUser.matching = [];
    }
    
    // Add profile ID to matching if not already there
    if (!currentUser.matching.includes(profile.id)) {
      // Create a new matching array with the new ID added
      const updatedMatching = [...currentUser.matching, profile.id];
      
      // Update the user
      const updatedUser = {
        ...currentUser,
        matching: updatedMatching
      };
      
      // Save the updated user
      updateUser(updatedUser);
      setCurrentUser(updatedUser);
      
      // Confirm match was added
      console.log('Match added to user:', currentUser.name, 'Updated matching IDs:', updatedMatching);
    }
  };

  const handleTriviaAnswer = (isCorrect: boolean) => {
    const newScore = Math.max(0, isCorrect ? score + 1 : score - 1);
    setScore(newScore);

    if (questionIndex < triviaQuestions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      // Trivia complete, check score
      console.log('Trivia complete! Score:', newScore);
      
      // Check if scored high enough (5+) to create a match
      if (newScore >= 5 && currentOpponent) {
        console.log('Score high enough to match with:', currentOpponent.name);
        // Add the opponent (the visible player) to matches
        addMatchToSession(currentOpponent);
      } else {
        console.log('Score not high enough for match or no opponent');
      }
      moveToNextProfile();
    }
  };

  const moveToNextProfile = () => {
    if (currentProfileIndex < profiles.length - 1) {
      // Update the index to the next profile
      const nextIndex = currentProfileIndex + 1;
      setCurrentProfileIndex(nextIndex);
      console.log('Moving to next profile after trivia:', nextIndex, 'Name:', profiles[nextIndex]?.name);
    } else {
      // No more profiles to show
      console.log('No more profiles to show');
      setProfiles([]);
    }
    setInTrivia(false);
    setScore(0);
    setQuestionIndex(0);
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
      {/* Background image */}
      <div
        className="fixed inset-0 bg-contain bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url(${bg})`,
          imageRendering: "pixelated",
          overflow: "hidden",
        }}
      />

      <main>
        {inTrivia && currentProfile ? (
          <div className="flex justify-center items-start gap-4 mt-6">
            <TriviaBox
              question={triviaQuestions[questionIndex]}
              onAnswerSubmit={handleTriviaAnswer}
            />
            {renderMatchMeter()}
          </div>
        ) : currentOpponent ? (
          <>
            {/* Opponent Speech Bubble */}
            <div className="fixed max-w-sm top-4 left-[450px] z-10">
              {/* Speech Bubble Box */}
              <div
                className="bg-game-white text-black p-4 "
                style={{
                  boxShadow: "4px 4px 0 #333",
                }}
              >
                {/* Avatar */}
                {currentOpponent.avatar && (
                  <img
                    src={currentOpponent.avatar}
                    alt={`${currentOpponent.name}'s avatar`}
                    className="w-12 h-12 rounded mb-2 border-[2px] border-black"
                  />
                )}

                {/* Name and Age */}
                <p className="font-pixel mb-1">
                  {currentOpponent.name}, {currentOpponent.age}
                </p>

                {/* Hobby badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentOpponent.hobbies.map((hobby) => (
                    <HobbyBadge key={hobby} hobby={hobby} readOnly />
                  ))}
                </div>
              </div>

              {/* Tail triangle on bottom-right */}
              <div
                className="absolute -bottom-2 right-4 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #DDEEEB", // matches bubble color
                  filter: "drop-shadow(4px 4px 0 #333)",
                }}
              />
            </div>

            <div className="fixed bottom-[260px] right-[360px]">
              {/* Figurine */}
              {currentOpponent.figurine && (
                <img
                  src={currentOpponent.figurine}
                  alt={`${currentOpponent.name}'s figurine`}
                  className="w-96 h-96"
                />
              )}
            </div>

            {/* User Speech Bubble */}
            <div className="fixed max-w-sm bottom-[240px] right-[450px]">
              {/* Speech Bubble Box */}
              <div
                className="bg-game-white text-black p-4 "
                style={{
                  boxShadow: "4px 4px 0 #333",
                }}
              >
                {/* Name and Age */}
                <p className="font-pixel mb-1">
                  {currentUser ? `${currentUser.name}, ${currentUser.age}` : "Player"}
                </p>
              </div>

              {/* Tail triangle on bottom-right */}
              <div
                className="absolute -bottom-2 left-4 w-0 h-0"
                style={{
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "10px solid #DDEEEB", // matches bubble color
                  filter: "drop-shadow(4px 4px 0 #333)",
                }}
              />
            </div>

            {/* User figurine */}
            <div className="fixed bottom-[40px] left-[240px] p-4">
              <img
                src="https://play.pokemonshowdown.com/sprites/ani-back/pikachu.gif"
                alt="Pikachu back sprite"
                className="w-96 h-96"
              />
            </div>

            {/* Match Confirmation Box */}
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