import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MatchConfirm from "../components/MatchConfirm";
import { mockProfiles } from "../mock/mockProfiles";
import bg from "./discoverBckgrd.png";
import HobbyBadge from "@/components/HobbyBadge";

const DiscoverPage = () => {
  const [opponentIndex, setOpponentIndex] = useState(0);
  const opponent = mockProfiles[opponentIndex];
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleConfirm = () => {
    navigate("/messages");
  };

  const handleCancel = () => {
    setOpponentIndex((prev) => (prev + 1) % mockProfiles.length);
  };

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
          {opponent.avatar && (
            <img
              src={opponent.avatar}
              alt={`${opponent.name}'s avatar`}
              className="w-12 h-12 rounded mb-2 border-[2px] border-black"
            />
          )}

          {/* Name and Age */}
          <p className="font-pixel mb-1">
            {opponent.name}, {opponent.age}
          </p>

          {/* Hobby badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {opponent.hobbies.map((hobby) => (
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
        {opponent.figurine && (
          <img
            src={opponent.figurine}
            alt={`${opponent.name}'s figurine`}
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
            Victoria, 24
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

      <Navbar />
    </div>
  );
};

export default DiscoverPage;