import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const saveSession = useCallback((session) => {
    setUser(session.user);
    setTenant(session.tenant);
    setSessionError("");
  }, []);

  useEffect(() => {
    let active = true;

    apiRequest("/auth/me")
      .then((session) => {
        if (active) saveSession(session);
      })
      .catch((error) => {
        if (active && error.status !== 401) setSessionError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [saveSession]);

  const login = useCallback(async (credentials) => {
    const session = await apiRequest("/auth/login", { method: "POST", body: credentials });
    saveSession(session);
    return session;
  }, [saveSession]);

  const registerTenant = useCallback(async (details) => {
    const session = await apiRequest("/auth/register-tenant", { method: "POST", body: details });
    saveSession(session);
    return session;
  }, [saveSession]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setTenant(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    tenant,
    loading,
    sessionError,
    login,
    registerTenant,
    logout,
  }), [user, tenant, loading, sessionError, login, registerTenant, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
