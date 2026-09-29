import axios from "axios";

export const API = "/api";

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token") || localStorage.getItem("gl_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      !error.config?.url?.includes("/auth/register")
    ) {
      // Clear token on 401 Unauthorized and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("gl_token");
    }
    return Promise.reject(error);
  }
);