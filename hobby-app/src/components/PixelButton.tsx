import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./../lib/utils";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "danger"
    | "neutral";
  size?: "sm" | "md" | "lg";
  isActive?: boolean;
}

const PixelButton = ({
  children,
  variant = "primary",
  size = "md",
  className,
  isActive = false,
  ...props
}: PixelButtonProps) => {
  const variantClasses = {
    primary: "bg-game-blue text-white",
    secondary: "bg-game-purple text-white",
    accent: "bg-game-yellow text-game-black",
    success: "bg-game-green text-white",
    danger: "bg-game-red text-white",
    neutral: "bg-gray-200 text-game-black",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "font-pixel border-2 border-b-4 border-r-4 border-game-black",
        "hover:translate-y-[2px] hover:border-b-2 hover:border-r-2",
        "active:translate-y-[4px] active:border-b-0 active:border-r-0",
        "transition-all duration-100 focus:outline-none border-2 m-border-black shadow-[3px_3px_0px_0px_black]",
        variantClasses[variant],
        sizeClasses[size],
        isActive && "translate-y-[2px] border-b-2 border-r-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default PixelButton;
