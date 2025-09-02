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
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    name?: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, if we have a token, fetch /api/me
  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }
        const res = await api<{ user: AuthUser }>("/api/me");
        if (mounted) setUser(res.user);
      } catch {
        // invalid/expired token
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
    const res = await api<{ token: string; user: AuthUser }>("/api/login", {
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
    const res = await api<{ token: string; user: AuthUser }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password, name }),
    });
    localStorage.setItem("token", res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser, login, register, logout, isLoading }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
