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
  avatarUrl?: string;
  figurineUrl?: string;
  location?: string;
  hobbies?: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  /** Sign in using username/password (kept for backward-compat) */
  login: (username: string, password: string) => Promise<void>;
  /** Register using username/password (kept for backward-compat) */
  register: (
    username: string,
    password: string,
    name?: string
  ) => Promise<void>;
  /** Store a token you already have, then hydrate user from /me */
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper: /me might return { user: {...} } or just {...}
function extractUser(me: any): AuthUser | null {
  if (!me) return null;
  if (me.user && typeof me.user === "object") return me.user as AuthUser;
  if (me.id && me.username) return me as AuthUser;
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, if we have a token, fetch /me
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        // IMPORTANT: no hardcoded /api — apiClient handles base via VITE_API_BASE
        const res = await api<any>("/me");
        const me = extractUser(res);
        if (mounted) setUser(me);
      } catch {
        localStorage.removeItem("token");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    // Server exposes POST /api/login (because index.ts mounts at /api),
    // but our apiClient adds /api via VITE_API_BASE, so we call "/login" here.
    const res = await api<{ token: string; user: AuthUser }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  const register = async (
    username: string,
    password: string,
    name?: string
  ) => {
    const res = await api<{ token: string; user: AuthUser }>("/register", {
      method: "POST",
      body: JSON.stringify({ username, password, name }),
    });
    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  const loginWithToken = async (token: string) => {
    // Persist token, then hydrate user from /me
    localStorage.setItem("token", token);
    setIsLoading(true);
    try {
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
