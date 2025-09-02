// src/features/profiles/ProfileCard.tsx
import React from "react";
import HobbyBadge from "./HobbyBadge";
import type { Profile } from "./types";

// If you still want pixel avatars, you can keep using your existing component:
import PixelAvatar from "@/components/PixelAvatar";

export default function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="grid grid-cols-[72px,1fr] gap-4 rounded-xl border-4 border-black bg-white p-4 shadow">
      <div className="flex items-start">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name || profile.username}
            className="h-16 w-16 rounded-md border-2 border-black object-cover"
          />
        ) : profile.figurineUrl ? (
          <img
            src={profile.figurineUrl}
            alt={profile.name || profile.username}
            className="h-16 w-16 rounded-md border-2 border-black object-cover"
          />
        ) : (
          <div className="h-16 w-16">
            <PixelAvatar seed={profile.username} />
          </div>
        )}
      </div>

      <div>
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-pixel text-lg leading-tight">
              {profile.name || profile.username}
            </h3>
            <p className="font-pixel text-xs opacity-70">
              {profile.location ?? "Somewhere nearby"}
              {profile.age ? ` • ${profile.age}` : ""}
            </p>
          </div>
        </header>

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
