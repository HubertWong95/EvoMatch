import React, { useState } from "react";
import { useAuth } from "./useAuth";
import { cn } from "@/lib/utils";

export default function Login() {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, name.trim() || undefined);
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur rounded-2xl shadow-xl p-6 border border-white/10">
        <div className="flex justify-center gap-4 mb-6">
          <button
            className={cn(
              "px-4 py-2 rounded-xl transition",
              mode === "login" ? "bg-white text-slate-900" : "bg-slate-800"
            )}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={cn(
              "px-4 py-2 rounded-xl transition",
              mode === "register" ? "bg-white text-slate-900" : "bg-slate-800"
            )}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm mb-1">
                Display name (optional)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
                placeholder="Jordan"
              />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              placeholder="Alex"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2"
              placeholder="••••••"
              required
            />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-xl bg-emerald-400 text-slate-900 px-4 py-2 font-medium hover:brightness-95 disabled:opacity-60"
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
