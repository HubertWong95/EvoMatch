// src/features/auth/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/discover", { replace: true });
    } catch {
      // error is already set in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="rounded-xl border-4 border-black bg-white p-6 shadow">
        <h1 className="mb-6 font-pixel text-2xl text-game-black">
          EvoMatch Login
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block font-pixel text-sm">Username</span>
            <input
              type="text"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none"
              placeholder="e.g. Alex"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-pixel text-sm">Password</span>
            <input
              type="password"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="rounded-md border-2 border-black bg-game-yellow p-3 font-pixel text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || submitting}
            className="w-full translate-y-0 rounded-md border-2 border-black bg-game-green px-4 py-3 font-pixel text-game-black shadow transition-transform hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center font-pixel text-xs opacity-70">
          Don’t have an account? (Sign-up coming soon)
        </p>
      </div>
    </div>
  );
}
