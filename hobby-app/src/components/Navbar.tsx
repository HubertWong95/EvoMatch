import { Link, useLocation } from "react-router-dom";
import { Heart, Search, User } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    {
      icon: <Search className="w-6 h-6" />,
      label: "Discover",
      path: "/discover",
    },
    { icon: <Heart className="w-6 h-6" />, label: "Matches", path: "/matches" },
    { icon: <User className="w-6 h-6" />, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white pixel-borders border-b-0 border-l-0 border-r-0 pb-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 ${
                isActive ? "text-game-blue" : "text-gray-500"
              }`}
            >
              <div
                className={`p-2 ${isActive ? "bg-game-blue/10 rounded" : ""}`}
              >
                {item.icon}
              </div>
              <span className="text-xs font-pixel mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
