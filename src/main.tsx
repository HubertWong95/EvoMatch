// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "@/styles/index.css";
import AppRouter from "@/app/router";
import { AuthProvider } from "@/features/auth/useAuth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
