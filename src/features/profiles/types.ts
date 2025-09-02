// src/features/profiles/types.ts
export type Profile = {
  id: string;
  username: string;
  name?: string;
  age?: number;
  bio?: string;
  avatarUrl?: string;
  figurineUrl?: string;
  location?: string;
  hobbies: string[];
};
