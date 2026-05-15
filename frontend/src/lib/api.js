import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("rama_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/admin/login")) {
        // soft logout
        localStorage.removeItem("rama_token");
        localStorage.removeItem("rama_role");
      }
    }
    return Promise.reject(err);
  }
);

export function formatError(detail) {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" · ");
  return detail?.msg || String(detail);
}

export default api;
