import { cn } from "./../lib/utils";

type HobbyBadgeProps = {
  hobby: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  readOnly?: boolean;
};

const HobbyBadge = ({
  hobby,
  active = false,
  onClick,
  className,
  readOnly = false,
}: HobbyBadgeProps) => {
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

  const baseStyles = cn(
    "px-3 py-1 text-xs font-pixel text-white transition-all border-2 m-border-black shadow-[3px_3px_0px_0px_black]",
    active
      ? `${bgColor} pixel-borders`
      : "bg-gray-200 border-2 border-gray-400",
    "hover:translate-y-[1px]",
    className
  );

  if (readOnly) {
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
  }

  return (
    <button onClick={onClick} className={baseStyles}>
      {hobby}
    </button>
  );
};

export default HobbyBadge;