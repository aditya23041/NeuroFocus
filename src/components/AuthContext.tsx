"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { useRouter, usePathname } from "next/navigation";
import { apiPost, apiGet, setToken, clearToken } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  subscription: "free" | "premium";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we have a valid session via API
    const restoreSession = async () => {
      const res = await apiGet<{ id: string; name: string; email: string; avatar: string; subscription: "free" | "premium" }>("/api/auth/me");
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        clearToken();
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setLoading(true);
    const password = "demo_password_123";
    
    // Try to login
    let res = await apiPost<{ token: string; user: User }>("/api/auth/login", { email, password });
    
    // If failed (likely because user doesn't exist), register them
    if (!res.success) {
      res = await apiPost<{ token: string; user: User }>("/api/auth/register", { 
        name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1), 
        email, 
        password 
      });
    }

    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      setLoading(false);
      toast.success("Successfully logged in!");
      return true;
    } else {
      setLoading(false);
      toast.error(res.error || "Authentication failed.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    clearToken();
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const upgradeToPremium = () => {
    if (!user) return;
    const updated = { ...user, subscription: "premium" as const };
    setUser(updated);
    toast.success("Congratulations! Upgraded to Premium Plan (SaaS Sim)");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, upgradeToPremium }}>
      {children}
    </AuthContext.Provider>
  );
}
