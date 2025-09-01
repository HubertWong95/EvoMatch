export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        jersey: ['"Jersey 10"', "cursive"], // pixelated font
      },
      colors: {
        "game-green": "#59B26C", // custom green
        "game-black": "#222222",
        "game-blue": "#3b82f6",
        "game-red": "#B9645E",
        "game-white": "#DDEEEB",
      },
      boxShadow: {
        pixel: "4px 4px 0 #000",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
        pulseScale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.7)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out infinite",
        pulseScale: "pulseScale 1s ease-in-out",
      },
    },
  },
  plugins: [],
};
