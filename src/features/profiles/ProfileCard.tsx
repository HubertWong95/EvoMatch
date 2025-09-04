// src/features/profiles/ProfileCard.tsx
import React from "react";
import HobbyBadge from "./HobbyBadge";
import type { Profile } from "./types";

function resolveAvatarUrl(u?: string | null): string {
  if (!u) return "";
  if (u.startsWith("data:image")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `/api${u}`;
  return `/api/${u}`;
}

export default function ProfileCard({ profile }: { profile: Profile }) {
  const img = resolveAvatarUrl(profile.avatarUrl || profile.figurineUrl || "");
  return (
    <article className="grid grid-cols-[72px,1fr] gap-4 rounded-xl border-4 border-black bg-white p-4 shadow">
      <div className="flex items-start">
        <div className="h-[72px] w-[72px] overflow-hidden rounded-lg border-2 border-black bg-amber-100">
          {img ? (
            <img
              src={img}
              alt={profile.name || profile.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-pixel text-[10px] opacity-60">
              No avatar
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-pixel text-lg">
            {profile.name || profile.username}
          </h3>
          {profile.location && (
            <span className="font-pixel text-xs opacity-70">
              {profile.location}
            </span>
          )}
        </div>

        {profile.bio && (
          <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {profile.hobbies?.map((h) => (
            <HobbyBadge key={h} label={h} />
          ))}
        </div>
      </div>
    </article>
  );
}
