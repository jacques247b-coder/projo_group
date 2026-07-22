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
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import DeliveryTrackingPage from "./pages/passenger/DeliveryTrackingPage";
import AdminProductPage from "./pages/admin/AdminProductPage";
import PromoCodesPage from "./pages/admin/PromoCodesPage";

// Landing page
import LandingPage from "./pages/LandingPage";
import EntertainmentHub from "./pages/entertainment/EntertainmentHub";
import TravelPage from "./pages/travel/TravelPage";
import ProjoDating from "./pages/dating/ProjoDating";
import SportsHubPage from "./pages/sports/SportsHubPage";
import PushPermissionModal from "./components/ui/PushPermissionModal";
import DriverSignupPage from "./pages/driver/DriverSignupPage";
import CommunityRooms from "./pages/community/CommunityRooms";
import CommunityRoomView from "./pages/community/CommunityRoomView";
import CommunityModerationPage from "./pages/admin/CommunityModerationPage";
import DatingVerificationPage from "./pages/admin/DatingVerificationPage";
import PanicMonitorPage from "./pages/admin/PanicMonitorPage";
import PanicWatchPage from "./pages/PanicWatchPage";

// ── Personal Tools ──────────────────────────────────────────
import NotesPage     from "./pages/tools/NotesPage";
import TasksPage     from "./pages/tools/TasksPage";
import CalendarPage  from "./pages/tools/CalendarPage";
import JournalPage   from "./pages/tools/JournalPage";
import GoalsPage     from "./pages/tools/GoalsPage";
import ShoppingPage  from "./pages/tools/ShoppingPage";
import HealthPage    from "./pages/tools/HealthPage";
import FitnessPage   from "./pages/tools/FitnessPage";
import FinancePage   from "./pages/tools/FinancePage";
import PlacesPage    from "./pages/tools/PlacesPage";
import VaultPage     from "./pages/tools/VaultPage";

// ── Community ───────────────────────────────────────────────
import GiveawayPage    from "./pages/community/GiveawayPage";
import DonationsPage   from "./pages/community/DonationsPage";
import CarpoolPage     from "./pages/community/CarpoolPage";
import NoticeboardPage from "./pages/community/NoticeboardPage";

// ── Civic ───────────────────────────────────────────────────
import RoadHazardsPage    from "./pages/civic/RoadHazardsPage";
import UtilityTrackerPage from "./pages/civic/UtilityTrackerPage";
import MunicipalScorecard from "./pages/civic/MunicipalScorecard";

// ── New Admin ───────────────────────────────────────────────
import AdminCharities      from "./pages/admin/AdminCharities";
import AdminMunicipalities from "./pages/admin/AdminMunicipalities";

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
  const [showPushModal, setShowPushModal] = React.useState(false);

  React.useEffect(() => {
    // Show push modal after login if not already accepted
    const checkPushModal = () => {
      const accepted = localStorage.getItem("projo_push_accepted");
      if (accepted) return; // Already accepted, never show again

      const permission = window.Notification?.permission;
      if (permission === "granted") {
        localStorage.setItem("projo_push_accepted", "true");
        return;
      }

      const dismissedAt = localStorage.getItem("projo_push_dismissed_at");
      const remindDays = parseInt(localStorage.getItem("projo_push_remind_days") || "0");

      if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        const waitDays = remindDays || 0; // 0 = remind every login, 7 = remind weekly
        if (daysSince < waitDays) return;
      }

      // Show modal after 3 seconds to let the page load
      setTimeout(() => setShowPushModal(true), 3000);
    };

    checkPushModal();
  }, []);
  const { user } = useAuth();

  const homeRoute = !user ? "/home"
    : user.role === "DRIVER" ? "/driver"
    : user.role === "ADMIN" ? "/admin"
    : user.role === "SECURITY" ? "/panic-monitor"
    : "/book";

  return (
    <>
      {showPushModal && (
        <PushPermissionModal onClose={() => setShowPushModal(false)} />
      )}
      <Routes>
      {/* Public landing page */}
      <Route path="/shop" element={
        <Protected><ShopPage /></Protected>
      } />
      <Route path="/products" element={
        <Protected><ProductsShopPage /></Protected>
      } />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/entertainment" element={
        <Protected><EntertainmentHub /></Protected>
      } />
      <Route path="/travel" element={
        <Protected><TravelPage /></Protected>
      } />
      <Route path="/sports" element={
        <Protected><SportsHubPage /></Protected>
      } />
      <Route path="/dating" element={
        <Protected><ProjoDating /></Protected>
      } />
      <Route path="/dating/lounge" element={
        <Protected><CommunityRooms mode="ANONYMOUS" basePath="/dating/lounge" backPath="/dating" title="Dating Lounge" subtitle="Anonymous chat with the Dating community — no profiles, just conversation." /></Protected>
      } />
      <Route path="/dating/lounge/:slug" element={
        <Protected><CommunityRoomView /></Protected>
      } />
      <Route path="/community" element={
        <Protected><CommunityRooms mode="OPEN_LOCAL" basePath="/community" backPath="/" title="PROJO Community" subtitle="Open chat for Rustenburg & surrounds — share freely, be kind." /></Protected>
      } />
      <Route path="/community/:slug" element={
        <Protected><CommunityRoomView /></Protected>
      } />
      <Route path="/admin/community" element={
        <Protected roles={["ADMIN"]}><CommunityModerationPage /></Protected>
      } />
      <Route path="/admin/dating-verification" element={
        <Protected roles={["ADMIN"]}><DatingVerificationPage /></Protected>
      } />
      <Route path="/panic-watch/:alertId" element={<PanicWatchPage />} />
      <Route path="/panic-monitor" element={
        <Protected roles={["ADMIN", "SECURITY"]}><PanicMonitorPage /></Protected>
      } />
      <Route path="/" element={<Navigate to={homeRoute} replace />} />

      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to={homeRoute} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={homeRoute} replace /> : <RegisterPage />} />

      {/* Public share link */}
      <Route path="/track/:token" element={<RideTrackingPage shared />} />
      <Route path="/track/delivery/:trackingNumber" element={<DeliveryTrackingPage />} />
      <Route path="/track/delivery" element={<DeliveryTrackingPage />} />

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

      {/* Admin — specific routes MUST come before /admin */}
      <Route path="/admin/analytics" element={
        <Protected roles={["ADMIN"]}>
          <AdminAnalyticsPage />
        </Protected>
      } />
      <Route path="/admin/product/new" element={
        <Protected roles={["ADMIN"]}>
          <AdminProductPage />
        </Protected>
      } />
      <Route path="/admin/product/:id" element={
        <Protected roles={["ADMIN"]}>
          <AdminProductPage />
        </Protected>
      } />
      <Route path="/admin/promo-codes" element={
        <Protected roles={["ADMIN"]}>
          <PromoCodesPage />
        </Protected>
      } />
      <Route path="/admin" element={
        <Protected roles={["ADMIN"]}>
          <AdminDashboard />
        </Protected>
      } />

      {/* Driver signup — public */}
      <Route path="/driver/signup" element={<DriverSignupPage />} />

      {/* ── Personal Tools ── */}
      <Route path="/notes"    element={<Protected><NotesPage /></Protected>} />
      <Route path="/tasks"    element={<Protected><TasksPage /></Protected>} />
      <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
      <Route path="/journal"  element={<Protected><JournalPage /></Protected>} />
      <Route path="/goals"    element={<Protected><GoalsPage /></Protected>} />
      <Route path="/shopping" element={<Protected><ShoppingPage /></Protected>} />
      <Route path="/health"   element={<Protected><HealthPage /></Protected>} />
      <Route path="/fitness"  element={<Protected><FitnessPage /></Protected>} />
      <Route path="/finance"  element={<Protected><FinancePage /></Protected>} />
      <Route path="/places"   element={<Protected><PlacesPage /></Protected>} />
      <Route path="/vault"    element={<Protected><VaultPage /></Protected>} />

      {/* ── Community ── */}
      <Route path="/giveaway"    element={<Protected><GiveawayPage /></Protected>} />
      <Route path="/donations"   element={<Protected><DonationsPage /></Protected>} />
      <Route path="/carpool"     element={<Protected><CarpoolPage /></Protected>} />
      <Route path="/noticeboard" element={<Protected><NoticeboardPage /></Protected>} />

      {/* ── Civic ── */}
      <Route path="/road-hazards"              element={<Protected><RoadHazardsPage /></Protected>} />
      <Route path="/utility-tracker"           element={<Protected><UtilityTrackerPage /></Protected>} />
      <Route path="/scorecard/:municipalityId" element={<MunicipalScorecard />} />

      {/* ── New Admin queues ── */}
      <Route path="/admin/charities"      element={<Protected roles={["ADMIN"]}><AdminCharities /></Protected>} />
      <Route path="/admin/municipalities" element={<Protected roles={["ADMIN"]}><AdminMunicipalities /></Protected>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
