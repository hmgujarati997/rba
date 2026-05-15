import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ ready: false, role: null, user: null });

  useEffect(() => {
    const t = localStorage.getItem("rama_token");
    if (!t) { setAuth({ ready: true, role: null, user: null }); return; }
    api.get("/auth/me").then((r) => {
      setAuth({ ready: true, role: r.data.role, user: r.data.user });
    }).catch(() => {
      localStorage.removeItem("rama_token");
      localStorage.removeItem("rama_role");
      setAuth({ ready: true, role: null, user: null });
    });
  }, []);

  const login = (token, role, user) => {
    localStorage.setItem("rama_token", token);
    localStorage.setItem("rama_role", role);
    setAuth({ ready: true, role, user });
  };

  const logout = () => {
    localStorage.removeItem("rama_token");
    localStorage.removeItem("rama_role");
    setAuth({ ready: true, role: null, user: null });
  };

  return <AuthCtx.Provider value={{ ...auth, login, logout, setAuth }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
