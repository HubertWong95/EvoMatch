import { useState } from "react";
import PixelAvatar from "./PixelAvatar";
import HobbyBadge from "./HobbyBadge";
import PixelButton from "./PixelButton";
import { Heart, X, MessageCircle, Trash } from "lucide-react";

export type UserProfile = {
  id: string;
  name: string;
  age: string;
  bio: string;
  avatar?: string;
  hobbies: string[];
  location: string;
};

type ProfileCardProps = {
  profile: UserProfile;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
  onMessage?: (id: string) => void;
  onRemove?: (id: string) => void; // Make sure onRemove is passed as a prop
  showActions?: boolean;
  showConnect?: boolean;
};

const ProfileCard = ({
  profile,
  onLike,
  onPass,
  onMessage,
  onRemove,
  showActions = true,
  showConnect = false,
}: ProfileCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | "">("");

  const handleLike = () => {
    setDirection("right");
    setIsAnimating(true);
    setTimeout(() => {
      onLike(profile.id);
      setIsAnimating(false);
      setDirection("");
    }, 500);
  };

  const handlePass = () => {
    setDirection("left");
    setIsAnimating(true);
    setTimeout(() => {
      onPass(profile.id);
      setIsAnimating(false);
      setDirection("");
    }, 500);
  };

  const handleMessage = () => {
    onMessage?.(profile.id);
  };

  const handleRemove = () => {
    if (onRemove) onRemove(profile.id); // Call the onRemove handler
  };

  return (
    <div
      className={`pixel-card w-full max-w-sm mx-auto transition-all duration-500 
        ${
          isAnimating
            ? `transform ${
                direction === "right"
                  ? "translate-x-full opacity-0"
                  : "translate-x-[-100%] opacity-0"
              }`
            : ""
        }
        bg-white border border-gray-300 shadow-lg rounded-xl p-4`}
    >
      <div className="flex items-center gap-4 mb-5">
        <PixelAvatar src={profile.avatar} alt={profile.name} size="lg" />
        <div>
          <h3 className="font-pixel text-3 mb-2 text-game-black">
            {profile.name}, {profile.age}
          </h3>
          <p className="font-pixel text- mt-3 text-game-black">
            {profile.location}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <p className="font-pixel text-sm mb-2 text-game-black">{profile.bio}</p>
      </div>

      <div className="mb-40">
        <h4 className="font-pixel text-sm mb-5 text-game-black">HOBBIES</h4>
        <div className="bg-[#BCD8C1] p-4 rounded-xl">
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((hobby) => (
              <HobbyBadge
                key={hobby}
                hobby={hobby}
                active
                className="bg-[#7FB069]"
              />
            ))}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex justify-center gap-6">
          <PixelButton
            variant="danger"
            onClick={handlePass}
            className="rounded-full flex items-center justify-center w-12 h-12 p-0 bg-red-500 hover:bg-red-600 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </PixelButton>

          <PixelButton
            variant="success"
            onClick={handleLike}
            className="rounded-full flex items-center justify-center w-12 h-12 p-0 bg-green-500 hover:bg-green-600 transition-all"
          >
            <Heart className="w-6 h-6 text-white" />
          </PixelButton>
        </div>
      )}

      {showConnect && (
        <div className="flex justify-center mt-4 gap-4">
          <PixelButton
            variant="primary"
            onClick={handleMessage}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </PixelButton>

          {onRemove && (
            <PixelButton
              variant="danger"
              onClick={handleRemove}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash className="w-4 h-4" /> Remove
            </PixelButton>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
