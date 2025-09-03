// src/features/auth/useAuth.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/apiClient";

export type AuthUser = {
  id: string;
  username: string;
  name?: string;
  age?: number;
  bio?: string;
  location?: string;
  hobbies?: string[];
  avatarUrl?: string;
  figurineUrl?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  /** Sign in (legacy helper; prefer the dedicated Login page) */
  login: (username: string, password: string) => Promise<void>;
  /** Register (legacy helper) */
  register: (
    username: string,
    password: string,
    name?: string
  ) => Promise<void>;
  /** Store a token you already have, then hydrate user from /me */
  loginWithToken: (token: string) => Promise<void>;
  /** Clear auth */
  logout: () => void;
  /** True while we’re fetching /me on initial load or after loginWithToken */
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function extractUser(obj: any): AuthUser {
  if (!obj) return {} as any;
  const src = obj.user ?? obj.me ?? obj;
  return {
    id: String(src.id),
    username: String(src.username ?? ""),
    name: src.name ?? undefined,
    age: src.age ?? undefined,
    bio: src.bio ?? undefined,
    location: src.location ?? undefined,
    hobbies: Array.isArray(src.hobbies) ? src.hobbies : undefined,
    // Normalize possible server keys:
    avatarUrl:
      src.avatarUrl ??
      src.avatar_url ??
      src.photoUrl ??
      src.photo_url ??
      undefined,
    figurineUrl:
      src.figurineUrl ??
      src.figurine_url ??
      src.pixelUrl ??
      src.pixel_url ??
      undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial boot: if token exists, hydrate from /me
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api<any>("/me");
        const me = extractUser(res);
        setUser(me);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api<any>("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res?.token) {
        localStorage.setItem("token", res.token);
        const me = extractUser(res);
        if (!me.id) {
          // If /login didn’t include full profile, fetch /me
          const fresh = await api<any>("/me");
          setUser(extractUser(fresh));
        } else {
          setUser(me);
        }
      } else {
        throw new Error("Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    password: string,
    name?: string
  ) => {
    setIsLoading(true);
    try {
      const res = await api<any>("/register", {
        method: "POST",
        body: JSON.stringify({ username, password, name }),
      });
      if (res?.token) {
        localStorage.setItem("token", res.token);
        const fresh = await api<any>("/me");
        setUser(extractUser(fresh));
      } else {
        throw new Error("Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (token: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem("token", token);
      const res = await api<any>("/me");
      const me = extractUser(res);
      setUser(me);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
      throw new Error("Failed to validate token");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      login,
      register,
      loginWithToken,
      logout,
      isLoading,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
