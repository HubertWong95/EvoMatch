// src/lib/userService.ts
/**
 * Deprecated: replaced by real API in features/auth/api.ts.
 * Keep this tiny shim so any legacy imports don't crash during the migration.
 */

export type LegacyUser = {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  figurine?: string;
  hobbies?: string[];
};

export async function legacyLogin(_username: string, _password: string) {
  throw new Error(
    "legacyLogin is deprecated. Use features/auth/api.login (server-backed) instead."
  );
}

export async function legacyMe(): Promise<LegacyUser | null> {
  return null;
}
