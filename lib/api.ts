import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
export const API = "/api";

export const api = axios.create({ baseURL: API });

export async function ensureToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("token") || localStorage.getItem("gl_token");
  if (!token) {
    try {
      const res = await axios.post(`${API}/auth/guest`);
      if (res.data?.token) {
        token = res.data.token;
        localStorage.setItem("token", token!);
        localStorage.setItem("gl_token", token!);
      }
    } catch (e) {
      console.warn("Guest token auto-provisioning failed", e);
    }
  }
  return token;
}

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    let token = localStorage.getItem("token") || localStorage.getItem("gl_token");
    if (!token && !config.url?.includes("/auth/")) {
      token = await ensureToken();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API}/auth/guest`);
        if (res.data?.token) {
          const newToken = res.data.token;
          localStorage.setItem("token", newToken);
          localStorage.setItem("gl_token", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch {
        // Continue with error
      }
    }
    return Promise.reject(error);
  }
);