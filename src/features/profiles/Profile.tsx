// src/features/profiles/Profile.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import type { Profile } from "./types";
import HobbyBadge from "./HobbyBadge";
import ProfileCard from "./ProfileCard";
import { api } from "@/lib/apiClient";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allHobbies, setAllHobbies] = useState<string[]>([
    // fallback list; server will return real master list later
    "Gaming",
    "Hiking",
    "Cooking",
    "Music",
    "Art",
    "Reading",
    "Sports",
    "Photography",
  ]);

  // Hydrate from /api/me (server) when available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If backend exposes /api/hobbies, load it:
        try {
          const res = await api<{ hobbies: string[] }>("/api/hobbies");
          if (mounted && Array.isArray(res.hobbies) && res.hobbies.length) {
            setAllHobbies(res.hobbies);
          }
        } catch {
          // ignore if endpoint not implemented yet
        }

        // Merge current auth user + server data
        if (user) {
          const me = await api<{ user: any }>("/api/me");
          const merged: Profile = {
            id: me.user.id ?? user.id,
            username: me.user.username ?? user.username,
            name: me.user.name ?? user.name,
            age: me.user.age ?? user.age,
            bio: me.user.bio ?? user.bio,
            avatarUrl: me.user.avatarUrl ?? user.avatarUrl,
            figurineUrl: me.user.figurineUrl ?? user.figurineUrl,
            location: me.user.location ?? user.location,
            hobbies: me.user.hobbies ?? user.hobbies ?? [],
          };
          if (mounted) {
            setProfile(merged);
          }
        }
      } catch {
        // If /api/me not implemented yet, synthesize from auth context only
        if (user && mounted) {
          setProfile({
            id: user.id,
            username: user.username,
            name: user.name,
            age: user.age,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            figurineUrl: user.figurineUrl,
            location: user.location,
            hobbies: user.hobbies ?? [],
          });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const toggleHobby = (h: string) => {
    if (!profile) return;
    setProfile((p) =>
      !p
        ? p
        : {
            ...p,
            hobbies: p.hobbies.includes(h)
              ? p.hobbies.filter((x) => x !== h)
              : [...p.hobbies, h],
          }
    );
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      // PATCH /api/me (allow partial fields)
      const updated = await api<{ user: any }>("/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          age: profile.age,
          location: profile.location,
          avatarUrl: profile.avatarUrl,
          figurineUrl: profile.figurineUrl,
          hobbies: profile.hobbies,
        }),
      });
      // reflect changes in auth context
      setUser((u) => (u ? { ...u, ...updated.user } : u));
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 1500);
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
      <section className="rounded-xl border-4 border-black bg-white p-4 shadow">
        <h2 className="mb-4 font-pixel text-xl">Your Profile</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block font-pixel text-xs">
                Display name
              </span>
              <input
                className="w-full rounded-md border-2 border-black px-3 py-2"
                value={profile.name ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-pixel text-xs">Location</span>
              <input
                className="w-full rounded-md border-2 border-black px-3 py-2"
                value={profile.location ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-pixel text-xs">Age</span>
              <input
                type="number"
                min={13}
                className="w-full rounded-md border-2 border-black px-3 py-2"
                value={profile.age ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    age: Number(e.target.value) || undefined,
                  })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-pixel text-xs">Avatar URL</span>
              <input
                className="w-full rounded-md border-2 border-black px-3 py-2"
                value={profile.avatarUrl ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, avatarUrl: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-pixel text-xs">
                Figurine URL
              </span>
              <input
                className="w-full rounded-md border-2 border-black px-3 py-2"
                value={profile.figurineUrl ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, figurineUrl: e.target.value })
                }
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block font-pixel text-xs">Bio</span>
              <textarea
                className="h-28 w-full resize-none rounded-md border-2 border-black px-3 py-2"
                value={profile.bio ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
            </label>

            <div>
              <span className="mb-2 block font-pixel text-xs">
                Your hobbies
              </span>
              <div className="flex flex-wrap gap-2">
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

            <div className="flex items-center gap-3">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-md border-2 border-black bg-game-green px-4 py-2 font-pixel shadow hover:translate-y-0.5 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Profile"}
              </button>
              {saved && (
                <span className="font-pixel text-xs text-game-black opacity-70">
                  Saved!
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-pixel text-xl">Preview</h2>
        <ProfileCard profile={profile} />
      </section>
    </div>
  );
}
