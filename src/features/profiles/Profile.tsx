// src/features/profiles/Profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import HobbyBadge from "./HobbyBadge";
import ProfileCard from "./ProfileCard";
import type { Profile } from "./types";
import { api } from "@/lib/apiClient";

function normalizeProfile(src: any): Profile {
  const base = src?.user ?? src?.me ?? src ?? {};
  // Accept various possible server keys
  const avatarCandidate =
    base.avatarUrl ??
    base.avatar_url ??
    base.photoUrl ??
    base.photo_url ??
    base.avatar ??
    base.profile?.avatarUrl ??
    undefined;
  const figurineCandidate =
    base.figurineUrl ??
    base.figurine_url ??
    base.pixelUrl ??
    base.pixel_url ??
    base.profile?.figurineUrl ??
    undefined;

  // As a final fallback (e.g., just after register) read cached avatar
  const fallbackLocal =
    typeof window !== "undefined"
      ? localStorage.getItem("avatarUrl") || undefined
      : undefined;

  return {
    id: String(base.id ?? ""),
    username: String(base.username ?? ""),
    name: base.name ?? "",
    age: base.age ?? undefined,
    bio: base.bio ?? "",
    location: base.location ?? "",
    hobbies: Array.isArray(base.hobbies) ? base.hobbies : [],
    avatarUrl: avatarCandidate || fallbackLocal,
    figurineUrl: figurineCandidate,
  };
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback list; replace with server-provided master list when available
  const allHobbies = useMemo(
    () => ["Gaming", "Cooking", "Music", "Hiking", "Art", "Reading", "Tech"],
    []
  );

  // Load latest profile from server; fallback to Auth (and localStorage avatar)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api<any>("/me");
        if (!alive) return;
        setProfile(normalizeProfile(res));
      } catch {
        if (!alive) return;
        if (user) setProfile(normalizeProfile({ user }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const displayAvatar = profile?.avatarUrl || profile?.figurineUrl || "";

  const toggleHobby = (h: string) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            hobbies: prev.hobbies.includes(h)
              ? prev.hobbies.filter((x) => x !== h)
              : [...prev.hobbies, h],
          }
        : prev
    );
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name || undefined,
          bio: profile.bio || undefined,
          location: profile.location || undefined,
          hobbies: profile.hobbies ?? [],
          avatarUrl: profile.avatarUrl ?? undefined,
          figurineUrl: profile.figurineUrl ?? undefined,
        }),
      });

      // reflect in Auth (navbar etc.)
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: profile.name,
              bio: profile.bio,
              location: profile.location,
              hobbies: profile.hobbies,
              avatarUrl: profile.avatarUrl ?? prev.avatarUrl,
              figurineUrl: profile.figurineUrl ?? prev.figurineUrl,
            }
          : prev
      );

      // update cache for future fallbacks
      if (profile.avatarUrl)
        localStorage.setItem("avatarUrl", profile.avatarUrl);

      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="rounded-xl border-4 border-black bg-white p-6 font-pixel shadow">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Editable card */}
      <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
        <h2 className="mb-4 font-pixel text-xl">Your Profile</h2>

        <div className="grid grid-cols-[96px,1fr] gap-4">
          <div className="flex items-start">
            <div className="h-24 w-24 overflow-hidden rounded-lg border-2 border-black bg-amber-100">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={profile.name || profile.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-pixel text-xs opacity-60">
                  No avatar
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="grid gap-2">
              <label className="block">
                <span className="font-pixel text-sm">Display name</span>
                <input
                  className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
                  value={profile.name ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, name: e.target.value } : p))
                  }
                />
              </label>
              <label className="block">
                <span className="font-pixel text-sm">Bio</span>
                <textarea
                  className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
                  rows={3}
                  value={profile.bio ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, bio: e.target.value } : p))
                  }
                />
              </label>
              <label className="block">
                <span className="font-pixel text-sm">Location</span>
                <input
                  className="mt-1 w-full rounded-md border-2 border-black p-2 font-pixel"
                  value={profile.location ?? ""}
                  onChange={(e) =>
                    setProfile((p) =>
                      p ? { ...p, location: e.target.value } : p
                    )
                  }
                />
              </label>

              <div>
                <span className="font-pixel text-sm">Hobbies</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {allHobbies.map((h) => (
                    <HobbyBadge
                      key={h}
                      label={h}
                      interactive
                      selected={profile.hobbies.includes(h)}
                      onClick={() => toggleHobby(h)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-md border-4 border-black bg-game-green px-4 py-2 font-pixel text-black shadow hover:translate-y-0.5 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="font-pixel text-sm text-game-green">
                  Saved ✓
                </span>
              )}
              {error && (
                <span className="font-pixel text-sm text-game-red">
                  {error}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Preview uses the same normalized avatar */}
      <section>
        <h2 className="mb-3 font-pixel text-xl">Preview</h2>
        <ProfileCard
          profile={{
            ...profile,
            avatarUrl: displayAvatar || undefined,
          }}
        />
      </section>
    </div>
  );
}
