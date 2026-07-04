// ============================================================
// PROJO GROUP — Auth Context (FIXED)
// FIX: Added login() function that RegisterPage was calling
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from '../services/api';
import { subscribeToPush } from '../services/pushNotifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem("projo_token"));
  const [loading, setLoading] = useState(true);

  // On load — restore session from token
  // IMPORTANT: Only clear token on 401 (invalid/expired), NOT on network errors
  // (Render free tier sleeps — network errors should NOT log the user out)
  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(res => {
          setUser(res.user);
          // Cache user data for offline/sleep recovery
          localStorage.setItem("projo_user", JSON.stringify(res.user));
          setLoading(false);

        })
        .catch((err) => {
          // Only clear token if backend explicitly rejects it (401)
          // Network errors, timeouts, server sleeping = keep token, retry later
          const status = err?.status || err?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem("projo_token");
            localStorage.removeItem("projo_refresh_token");
            setToken(null);
          } else {
            // Network error or server sleeping — keep the user logged in
            // Try to restore user from cached data if available
            const cachedUser = localStorage.getItem("projo_user");
            if (cachedUser) {
              try { setUser(JSON.parse(cachedUser)); } catch {}
            }
          }
          setLoading(false);
        });
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
    localStorage.setItem("projo_user", JSON.stringify(res.user));

    return res.user;
  }, []);

  // login() — direct token/user injection (used by RegisterPage after OTP verify)
  const login = useCallback((userData, newToken, refreshToken) => {
    localStorage.setItem("projo_token", newToken);
    if (refreshToken) localStorage.setItem("projo_refresh_token", refreshToken);
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("projo_user", JSON.stringify(userData));
  }, []);

  const register = useCallback(async (data) => {
    return await authAPI.register(data);
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem("projo_token");
    localStorage.removeItem("projo_refresh_token");
    localStorage.removeItem("projo_user");
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


