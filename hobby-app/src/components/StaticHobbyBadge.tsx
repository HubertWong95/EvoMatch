import { cn } from "./../lib/utils";

type StaticHobbyBadgeProps = {
  hobby: string;
  className?: string;
};

const StaticHobbyBadge = ({ hobby, className }: StaticHobbyBadgeProps) => {
  const colorMap: Record<string, string> = {
    Gaming: "bg-game-blue",
    Hiking: "bg-game-green",
    Cooking: "bg-game-orange",
    Art: "bg-game-purple",
    Music: "bg-game-pink",
    Reading: "bg-game-yellow",
    Sports: "bg-game-red",
    Photography: "bg-game-blue",
    Gardening: "bg-game-green",
    Crafting: "bg-game-orange",
    Dancing: "bg-game-purple",
    Writing: "bg-game-pink",
  };

  const defaultColor = "bg-game-blue";
  const bgColor = colorMap[hobby] || defaultColor;

  return (
    <div
      className={cn(
        "px-3 py-1 text-xs font-pixel text-white border-2 border-black shadow-[3px_3px_0px_0px_black]",
        bgColor,
        className
      )}
    >
      {hobby}
    </div>
  );
};

export default StaticHobbyBadge;