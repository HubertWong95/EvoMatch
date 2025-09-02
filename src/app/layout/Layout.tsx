import React from "react";
import Navbar from "./Navbar";

/**
 * App shell that wraps all pages.
 * Keeps the pixel font + token colors you already defined in styles/index.css.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-game-black">
      <Navbar />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
