// ============================================================
// PROJO GROUP — Auth Context
// Global authentication state: user, token, role
// Phone-first login with SMS OTP (+27 South Africa)
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem("projo_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("projo_token");
    if (savedToken) {
      authAPI.getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem("projo_token");
          localStorage.removeItem("projo_refresh_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const sendOTP = useCallback(async (phone) => {
    return await authAPI.sendOTP(phone);
  }, []);

  const verifyOTP = useCallback(async (phone, otp) => {
    const res = await authAPI.verifyOTP(phone, otp);
    localStorage.setItem("projo_token", res.token);
    if (res.refreshToken) localStorage.setItem("projo_refresh_token", res.refreshToken);
    setToken(res.token);
    setUser(res.user);
    return res.user;
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

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = {
    user, token, loading,
    isAuthenticated: !!user,
    isPassenger: user?.role === "PASSENGER",
    isDriver:    user?.role === "DRIVER",
    isAdmin:     user?.role === "ADMIN",
    sendOTP, verifyOTP, register, logout, updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
