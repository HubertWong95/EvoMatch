// src/features/auth/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WebcamCapture from "@/features/webcam/WebcamCapture";
import { generatePixelAvatar } from "@/utils/generatePixelAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("register");

  // shared
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // register-only
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);

  // If you want to default to the last used tab per session:
  useEffect(() => {
    const saved = sessionStorage.getItem("authTab");
    if (saved === "login" || saved === "register") setActiveTab(saved);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("authTab", activeTab);
  }, [activeTab]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      if (res?.token) {
        localStorage.setItem("token", res.token);
        loginWithToken(res.token);
        navigate("/profile"); // or "/discover"
      } else {
        setError("Invalid credentials");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/register", {
        username,
        password,
        name: name || undefined,
        avatarUrl: avatarUrl || undefined, // send to backend
      });
      if (res?.token) {
        localStorage.setItem("token", res.token);
        loginWithToken(res.token);
        navigate("/profile"); // or "/discover"
      } else {
        setError("Registration failed");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border-4 border-black bg-[#0c1422] p-6 text-white">
      <div className="mb-6 flex gap-2">
        <button
          className={`rounded-full px-5 py-2 font-pixel ${
            activeTab === "login" ? "bg-white text-black" : "bg-white/10"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          className={`rounded-full px-5 py-2 font-pixel ${
            activeTab === "register" ? "bg-white text-black" : "bg-white/10"
          }`}
          onClick={() => setActiveTab("register")}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border-2 border-red-700 bg-red-100 p-3 font-pixel text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "login" ? (
        <form onSubmit={onLogin} className="space-y-4">
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
            className="mt-2 w-full rounded-md border-2 border-black bg-emerald-400 px-4 py-3 font-pixel text-black disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRegister} className="space-y-4">
          <label className="block">
            <span className="font-pixel text-sm">Display name (optional)</span>
            <input
              className="mt-1 w-full rounded-md border-2 border-black bg-[#0c1422] p-3 font-pixel text-white outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan"
            />
          </label>
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

          {/* Avatar */}
          <div className="text-center">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="mx-auto mb-2 h-24 w-24 rounded-lg border-2 border-black object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="rounded-md border-2 border-black bg-amber-300 px-3 py-2 font-pixel text-black"
            >
              {avatarUrl ? "Retake Avatar Photo" : "Take Avatar Photo"}
            </button>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-md border-2 border-black bg-emerald-400 px-4 py-3 font-pixel text-black disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
      )}

      {/* Webcam modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg border-4 border-black bg-white p-3">
            <WebcamCapture
              onCapture={async (dataUrl) => {
                try {
                  // Your util should upload to your server/OpenAI pipeline and return a usable URL
                  const url = await generatePixelAvatar(dataUrl);
                  setAvatarUrl(url);
                } catch (e) {
                  setError("Failed to generate avatar. Try again.");
                } finally {
                  setShowCamera(false);
                }
              }}
            />
            <div className="mt-2 text-center">
              <button
                className="font-pixel text-sm underline"
                onClick={() => setShowCamera(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
