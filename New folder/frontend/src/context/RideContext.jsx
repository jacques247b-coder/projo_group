// ============================================================
// PROJO GROUP — Ride Context
// Active ride state, socket connection, real-time tracking
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { rideAPI } from "../services/api";

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket]         = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [rideLoading, setRideLoading] = useState(false);
  const socketRef = useRef(null);

  // ── Connect socket when user logs in ──────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      setSocket(null);
      return;
    }
    const s = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    s.on("connect", () => console.log("[PROJO] Socket connected"));
    s.on("driver:location", (data) => setDriverLocation({ lat: data.lat, lng: data.lng }));
    s.on("ride:status_changed", (data) => {
      setActiveRide((prev) => prev ? { ...prev, status: data.status } : prev);
    });
    socketRef.current = s;
    setSocket(s);
    return () => { s.disconnect(); socketRef.current = null; };
  }, [isAuthenticated, token]);

  // ── Fetch active ride on mount ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    rideAPI.getActiveRide()
      .then((data) => { if (data?.ride) setActiveRide(data.ride); })
      .catch(() => {});
  }, [isAuthenticated]);

  // ── Book a ride ────────────────────────────────────────────
  const bookRide = async (rideData) => {
    setRideLoading(true);
    try {
      const res = await rideAPI.bookRide(rideData);
      setActiveRide(res.ride);
      setDriverLocation(null);
      // Join socket room for this ride
      if (socketRef.current) {
        socketRef.current.emit("passenger:join_ride", { rideId: res.ride.id });
      }
      return res.ride;
    } finally {
      setRideLoading(false);
    }
  };

  // ── Cancel ride ────────────────────────────────────────────
  const cancelRide = async (rideId, reason) => {
    await rideAPI.cancelRide(rideId, reason);
    setActiveRide(null);
    setDriverLocation(null);
  };

  // ── Clear ride after completion ────────────────────────────
  const clearRide = () => { setActiveRide(null); setDriverLocation(null); };

  return (
    <RideContext.Provider value={{
      socket, activeRide, driverLocation,
      rideLoading, bookRide, cancelRide, clearRide,
    }}>
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error("useRide must be used inside <RideProvider>");
  return ctx;
}
