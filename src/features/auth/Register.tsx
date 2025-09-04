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

// Try a few likely upload endpoints (if your backend has any).
async function uploadAvatarWithFallbacks(file: File) {
  const endpoints = [
    "/upload/avatar?persist=1&max=512",
    "/upload?persist=1&max=512",
    "/users/me/avatar?persist=1&max=512",
    "/avatar?persist=1&max=512",
  ];
  for (const path of endpoints) {
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      fd.append("file", file);
      console.log("[Register] try upload →", path);
      const res = await api<any>(path, { method: "POST", body: fd });
      console.log("[Register] upload JSON", res);
      const url: string | undefined =
        res?.avatarUrl || res?.url || res?.image || res?.path;
      if (url) return url;
    } catch (e) {
      console.warn("[Register] upload attempt failed:", path, e);
    }
  }
  throw new Error("Could not find a working upload endpoint.");
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
      console.log("[Register] submit", {
        username,
        hasPreview: !!avatarPreview,
      });

      // 1) Create account
      const reg = await api<{ token: string }>("/register", {
        method: "POST",
        body: JSON.stringify({ username, password, name }),
      });
      console.log("[Register] /register →", reg);
      if (!reg?.token) throw new Error("Registration failed");
      localStorage.setItem("token", reg.token);
      await loginWithToken(reg.token);

      // 2) Save avatar
      if (avatarPreview?.startsWith("data:")) {
        const file = dataUrlToFile(avatarPreview, "avatar_cartoon.png");

        try {
          // Prefer a real upload endpoint if you have one
          const finalUrl = await uploadAvatarWithFallbacks(file);

          // Persist URL to user record
          console.log("[Register] PATCH /me with avatarUrl", finalUrl);
          await api("/me", {
            method: "PATCH",
            body: JSON.stringify({ avatarUrl: finalUrl }),
          });

          // Reflect & cache
          setUser((prev) => (prev ? { ...prev, avatarUrl: finalUrl } : prev));
          localStorage.setItem("avatarUrl", finalUrl);
          console.log("[Register] cached avatarUrl:", finalUrl);
        } catch (uploadErr) {
          // ⛑️ Fallback: store the base64 data URL directly in backend
          console.warn(
            "[Register] no upload endpoint found; falling back to data URL storage via /me PATCH"
          );
          await api("/me", {
            method: "PATCH",
            body: JSON.stringify({ avatarUrl: avatarPreview }),
          });

          setUser((prev) =>
            prev ? { ...prev, avatarUrl: avatarPreview } : prev
          );
          localStorage.setItem("avatarUrl", avatarPreview);
          console.log("[Register] cached data-URL avatar");
        }
      } else {
        console.log("[Register] no avatarPreview to upload");
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("[Register] error", err);
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

      {/* Webcam modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border-4 border-black bg-white p-4 shadow">
            <WebcamCapture
              onCapture={async (imageDataUrl) => {
                setShowCamera(false);
                setIsGenerating(true);
                setError(null);
                try {
                  console.log("[Register] generatePixelAvatar()…");
                  const pixel = await generatePixelAvatar(imageDataUrl);
                  console.log(
                    "[Register] pixel data URL length:",
                    pixel?.length
                  );
                  setAvatarPreview(pixel);
                } catch (err: any) {
                  console.error("[Register] generatePixelAvatar error", err);
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
