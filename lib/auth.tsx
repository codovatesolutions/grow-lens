"use client";

import { create } from 'zustand';
import { api } from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("gl_token", data.token);
    }
    set({ user: data.user });
    return data.user;
  },
  register: async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("gl_token", data.token);
    }
    set({ user: data.user });
    return data.user;
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("gl_token");
    }
    set({ user: null });
  },
  checkAuth: async () => {
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("gl_token")) : null;
      if (!token) {
        set({ user: null, loading: false });
        return;
      }
      const { data } = await api.get("/auth/me");
      set({ user: data, loading: false });
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("gl_token");
      }
      set({ user: null, loading: false });
    }
  }
}));

// Backwards compatibility hook
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    loading: store.loading,
    login: store.login,
    register: store.register,
    logout: store.logout,
  };
};
