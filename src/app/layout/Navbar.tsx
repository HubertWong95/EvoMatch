import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

/**
 * Pixel-style top nav. Shows Discover/Matches/Profile when logged in.
 * Uses your .font-pixel and token colors from styles/index.css.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkBase =
    "px-3 py-2 rounded-md border-2 border-black shadow hover:translate-y-0.5 transition-transform";
  const active = "bg-game-yellow";
  const inactive = "bg-white";

  return (
    <header className="sticky top-0 z-40 border-b-4 border-black bg-game-blue">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
        <Link
          to={user ? "/discover" : "/"}
          className="font-pixel text-lg text-game-white"
        >
          EvoMatch
        </Link>

        {!user ? (
          <nav className="flex items-center gap-2">
            <Link to="/" className={`${linkBase} ${inactive} font-pixel`}>
              Login
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <NavLink
              to="/discover"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive} font-pixel`
              }
            >
              Discover
            </NavLink>
            <NavLink
              to="/matches"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive} font-pixel`
              }
            >
              Matches
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? active : inactive} font-pixel`
              }
            >
              Profile
            </NavLink>

            <button
              onClick={() => {
                logout();
                navigate("/", { replace: true });
              }}
              className={`${linkBase} bg-game-red font-pixel text-game-white`}
            >
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
