import { cn } from "./../lib/utils";

type PixelAvatarProps = {
  src?: string;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const PixelAvatar = ({
  src,
  alt = "User avatar",
  className,
  size = "md",
}: PixelAvatarProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden pixel-borders bg-game-yellow",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div className="w-full h-full bg-game-blue flex items-center justify-center text-white font-pixel text-sm">
          {alt.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default PixelAvatar;
