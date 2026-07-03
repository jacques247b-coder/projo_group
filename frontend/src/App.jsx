// ============================================================
// PROJO GROUP — App Router (Complete)
// All routes: landing, auth, passenger, driver, admin
// ============================================================
import ShopPage from "./pages/shop/ShopPage";
import ProductsShopPage from "./pages/shop/ProductsShopPage";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Passenger pages
import BookRidePage from "./pages/passenger/BookRidePage";
import RideTrackingPage from "./pages/passenger/RideTrackingPage";
import RideHistoryPage from "./pages/passenger/RideHistoryPage";
import WalletPage from "./pages/passenger/WalletPage";
import CourierPage from "./pages/passenger/CourierPage";

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverEarnings from "./pages/driver/DriverEarnings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PromoCodesPage from "./pages/admin/PromoCodesPage";

// Landing page
import LandingPage from "./pages/LandingPage";
import DriverSignupPage from "./pages/driver/DriverSignupPage";

// Protected route wrapper
function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', sans-serif", color: "#e8b84b", fontSize: "1.2rem",
      letterSpacing: "2px" }}>
      PROJO GROUP
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === "DRIVER") return <Navigate to="/driver" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    return <Navigate to="/book" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  const homeRoute = !user ? "/home"
    : user.role === "DRIVER" ? "/driver"
    : user.role === "ADMIN" ? "/admin"
    : "/book";

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/shop" element={
        <Protected><ShopPage /></Protected>
      } />
      <Route path="/products" element={
        <Protected><ProductsShopPage /></Protected>
      } />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/" element={<Navigate to={homeRoute} replace />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={homeRoute} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={homeRoute} replace /> : <RegisterPage />} />

      {/* Public share link */}
      <Route path="/track/:token" element={<RideTrackingPage shared />} />

      {/* Passenger */}
      <Route path="/book" element={
        <Protected roles={["PASSENGER", "ADMIN"]}>
          <BookRidePage />
        </Protected>
      } />
      <Route path="/ride/:id" element={
        <Protected><RideTrackingPage /></Protected>
      } />
      <Route path="/rides" element={
        <Protected><RideHistoryPage /></Protected>
      } />
      <Route path="/wallet" element={
        <Protected><WalletPage /></Protected>
      } />
      <Route path="/courier" element={
        <Protected><CourierPage /></Protected>
      } />

      {/* Driver */}
      <Route path="/driver" element={
        <Protected roles={["DRIVER"]}>
          <DriverDashboard />
        </Protected>
      } />
      <Route path="/driver/earnings" element={
        <Protected roles={["DRIVER"]}>
          <DriverEarnings />
        </Protected>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <Protected roles={["ADMIN"]}>
          <AdminDashboard />
        </Protected>
      } />
      <Route path="/admin/promo-codes" element={
        <Protected roles={["ADMIN"]}>
          <PromoCodesPage />
        </Protected>
      } />

      {/* Driver signup — public */}
      <Route path="/driver/signup" element={<DriverSignupPage />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#f0ede8",
              border: "1px solid rgba(232,184,75,0.25)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#e8b84b", secondary: "#0a0a0a" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
