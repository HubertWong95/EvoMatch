// src/features/auth/Register.tsx
import React, { useState } from "react";
import WebcamCapture from "@/features/webcam/WebcamCapture";
import { generatePixelAvatar } from "@/utils/generatePixelAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";

export default function Register() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("New Player");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const [showCamera, setShowCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string }>("/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          name,
          avatarUrl,
        }),
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
        loginWithToken(res.token);
        navigate("/profile");
      }
    } catch (err: any) {
      if (err?.status === 409) setError("That username is taken.");
      else setError(err?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border-4 border-black bg-white p-4">
      <h1 className="font-pixel text-2xl">Create Account</h1>

      {error && (
        <div className="rounded-md border-2 border-red-700 bg-red-100 p-2 font-pixel text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3" aria-busy={busy}>
        <label className="block">
          <span className="font-pixel text-sm">Username</span>
          <input
            className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
          />
        </label>

        <label className="block">
          <span className="font-pixel text-sm">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password"
          />
        </label>

        <label className="block">
          <span className="font-pixel text-sm">Display name</span>
          <input
            className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
          />
        </label>

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
            onClick={() => !busy && setShowCamera(true)}
            disabled={busy}
            className="rounded-md border-2 border-black bg-game-yellow px-3 py-1 font-pixel disabled:opacity-60"
          >
            {avatarUrl ? "Retake Avatar Photo" : "Take Avatar Photo"}
          </button>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md border-2 border-black bg-game-green px-4 py-2 font-pixel disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Account"}
        </button>
      </form>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg border-4 border-black bg-white p-3">
            <WebcamCapture
              onCapture={async (dataUrl) => {
                try {
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
