// src/features/auth/Login.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/apiClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // if a token already exists, try hydrating
    const token = localStorage.getItem("token");
    if (token) {
      loginWithToken(token).then(
        () => navigate("/profile"),
        () => {}
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // IMPORTANT: apiClient already prefixes /api
      const res = await api<{ token: string }>("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res?.token) {
        localStorage.setItem("token", res.token);
        await loginWithToken(res.token);
        navigate("/profile");
      } else {
        setError("Invalid credentials");
      }
    } catch (err: any) {
      if (err?.status === 401) setError("Invalid credentials");
      else setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md animate-[fadeIn_300ms]">
      <div className="rounded-2xl border-4 border-black bg-[#0c1422] p-6 text-white shadow-[6px_6px_0_#000]">
        <header className="mb-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-md border-2 border-black bg-amber-300" />
          <h1 className="font-pixel text-2xl">Welcome back!</h1>
        </header>

        {error && (
          <div className="mb-4 rounded-md border-2 border-red-700 bg-red-100 p-3 font-pixel text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onLogin} className="space-y-4" aria-busy={busy}>
          <label className="block">
            <span className="font-pixel text-sm">Username</span>
            <input
              className="mt-1 w-full rounded-md border-2 border-black bg-[#0c1422] p-3 font-pixel text-white outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Alex"
              required
            />
          </label>
          <label className="block">
            <span className="font-pixel text-sm">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-md border-2 border-black bg-[#0c1422] p-3 font-pixel text-white outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-md border-2 border-black bg-emerald-400 px-4 py-3 font-pixel text-black shadow hover:translate-y-0.5 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center font-pixel text-sm opacity-80">
          Don’t have an account?{" "}
          <Link to="/register" className="underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
