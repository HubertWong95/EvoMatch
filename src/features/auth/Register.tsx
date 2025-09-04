// src/features/auth/Register.tsx
import React, { useState } from "react";
import WebcamCapture from "@/features/webcam/WebcamCapture";
import { generatePixelAvatar } from "@/utils/generatePixelAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/apiClient";

function dataUrlToFile(dataUrl: string, filename = "avatar.png"): File {
  const [header, b64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header || "");
  const mime = mimeMatch?.[1] || "image/png";
  const bin = atob(b64 || "");
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new File([u8], filename, { type: mime });
}

export default function Register() {
  const navigate = useNavigate();
  const { loginWithToken, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("New Player");

  const [showCamera, setShowCamera] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      // 1) Create account
      const res = await api<{ token: string }>("/register", {
        method: "POST",
        body: JSON.stringify({ username, password, name }),
      });
      if (!res?.token) throw new Error("Registration failed");
      localStorage.setItem("token", res.token);
      await loginWithToken(res.token);

      // 2) Upload cartoon avatar and persist to DB in one step
      if (avatarPreview) {
        const file = avatarPreview.startsWith("data:")
          ? dataUrlToFile(avatarPreview, "avatar_cartoon.png")
          : null;

        if (file) {
          const fd = new FormData();
          fd.append("avatar", file);
          const up = await fetch("/api/upload/avatar?persist=1&max=512", {
            method: "POST",
            headers: { Authorization: `Bearer ${res.token}` },
            body: fd,
          });
          if (up.ok) {
            const j = await up.json();
            const finalUrl = j?.url as string | undefined;
            if (finalUrl) {
              // reflect immediately in UI; /me already returns avatarUrl
              setUser((prev) =>
                prev ? { ...prev, avatarUrl: finalUrl } : prev
              );
            }
          }
        }
      }

      navigate("/profile");
    } catch (err: any) {
      if (err?.status === 409) setError("That username is taken.");
      else setError(err?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-md space-y-4 rounded-xl border-4 border-black bg-white p-4">
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

        <div className="rounded-xl border-4 border-black bg-white p-3 text-center">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="mx-auto mb-2 h-24 w-24 rounded-lg border-2 border-black object-cover"
            />
          ) : (
            <div className="mx-auto mb-2 h-24 w-24 rounded-lg border-2 border-black bg-amber-200" />
          )}

          <button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={busy || isGenerating}
            className="rounded-md border-4 border-black bg-game-yellow px-3 py-2 font-pixel text-black shadow hover:translate-y-0.5 disabled:opacity-50"
          >
            {avatarPreview ? "Retake photo" : "Use camera"}
          </button>

          <p className="mt-2 text-xs font-pixel opacity-70">
            We’ll send your photo to OpenAI to create a pixel-art avatar.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md border-4 border-black bg-game-yellow px-4 py-2 font-pixel text-black shadow hover:translate-y-0.5"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      {/* Webcam Modal — close immediately on capture */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border-4 border-black bg-white p-4 shadow">
            <WebcamCapture
              onCapture={async (imageDataUrl) => {
                setShowCamera(false); // close instantly
                setIsGenerating(true); // show overlay while generating
                setError(null);
                try {
                  const pixel = await generatePixelAvatar(imageDataUrl);
                  setAvatarPreview(pixel);
                } catch (err: any) {
                  setError(
                    err?.message || "Failed to generate avatar. Try again."
                  );
                } finally {
                  setIsGenerating(false);
                }
              }}
            />
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowCamera(false)}
                className="font-pixel text-sm underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generating overlay */}
      {isGenerating && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-xl bg-white/80">
          <div className="flex items-center gap-3 rounded-md border-4 border-black bg-white px-4 py-3 font-pixel shadow">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent" />
            Generating avatar…
          </div>
        </div>
      )}
    </div>
  );
}
