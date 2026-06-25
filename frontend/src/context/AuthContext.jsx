// ============================================================
// PROJO GROUP — Auth Context (FIXED)
// FIX: Added login() function that RegisterPage was calling
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem("projo_token"));
  const [loading, setLoading] = useState(true);

  // On load — restore session from token
  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.user))
        .catch(() => {
          localStorage.removeItem("projo_token");
          localStorage.removeItem("projo_refresh_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Send OTP — creates user if new, sends to email
  const sendOTP = useCallback(async (phone, email) => {
    return await authAPI.sendOTP(phone, email);
  }, []);

  // Verify OTP — stores token and user in state
  const verifyOTP = useCallback(async (phone, otp, name, role, email) => {
    const res = await authAPI.verifyOTP(phone, otp, name, role, email);
    localStorage.setItem("projo_token", res.token);
    if (res.refreshToken) localStorage.setItem("projo_refresh_token", res.refreshToken);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  // login() — direct token/user injection (used by RegisterPage after OTP verify)
  const login = useCallback((userData, newToken, refreshToken) => {
    localStorage.setItem("projo_token", newToken);
    if (refreshToken) localStorage.setItem("projo_refresh_token", refreshToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data) => {
    return await authAPI.register(data);
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem("projo_token");
    localStorage.removeItem("projo_refresh_token");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    token,
    loading,
    sendOTP,
    verifyOTP,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
