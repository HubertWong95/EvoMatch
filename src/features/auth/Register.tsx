// src/features/auth/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "@/components/PixelButton";
import { api } from "@/lib/apiClient";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{ token: string; user: any }>("/api/register", {
        method: "POST",
        body: JSON.stringify({ username, password, name }),
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/discover");
    } catch (err: any) {
      alert(err.message || "Register failed");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen font-pixel">
      <h1 className="text-4xl mb-6">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-64">
        <input
          className="pixel-input w-full"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="pixel-input w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="pixel-input w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PixelButton type="submit">Register</PixelButton>
      </form>
      <button
        className="mt-4 text-blue-500 underline"
        onClick={() => navigate("/")}
      >
        Already have an account? Login
      </button>
    </div>
  );
}
