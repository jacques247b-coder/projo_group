// PROJO GROUP — API Service
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("projo_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("projo_refresh_token");
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const newToken = res.data.token;
        localStorage.setItem("projo_token", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (e) {
        // Only clear token and redirect if it's a real auth failure
        // not a network/timeout error (Render sleeping)
        if (e.response?.status === 401 || e.response?.status === 403) {
          localStorage.removeItem("projo_token");
          localStorage.removeItem("projo_refresh_token");
          localStorage.removeItem("projo_user");
          // Don't redirect if we're already on /login — doing so anyway
          // triggers a real page reload even though the path doesn't
          // change, which re-runs everything on the page again, and if
          // whatever caused this 401 fires again on load, becomes an
          // infinite reload loop (exactly what happened here).
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        // Otherwise silently fail — user stays logged in with cached data
      }
    }
    // Attach status to error for AuthContext to read
    const err = error.response?.data || error;
    if (error.response?.status) err.status = error.response.status;
    return Promise.reject(err);
  }
);

// Auth — sendOTP now passes email
export const authAPI = {
  sendOTP: (phone, email) => api.post("/auth/send-otp", { phone, email }),
  verifyOTP: (phone, otp, name, role, email) => api.post("/auth/verify-otp", { phone, otp, name, role, email }),
  register: (data) => api.post("/auth/register", data),
  login: (phone, email) => api.post("/auth/login", { phone, email }),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const rideAPI = {
  estimateFare: (data) => api.post("/rides/estimate", data),
  bookRide: (data) => api.post("/rides/book", data),
  getActiveRide: () => api.get("/rides/active"),
  getRideHistory: (page = 1) => api.get(`/rides/history?page=${page}`),
  getRideById: (id) => api.get(`/rides/${id}`),
  getSharedRide: (token) => api.get(`/rides/share/${token}`),
  cancelRide: (id, reason) => api.post(`/rides/${id}/cancel`, { reason }),
  rateRide: (id, stars, comment) => api.post(`/rides/${id}/rate`, { stars, comment }),
  updateStatus: (id, status) => api.post(`/rides/${id}/status`, { status }),
  acceptRide: (id) => api.post(`/rides/${id}/accept`),
};

export const walletAPI = {
  getBalance: () => api.get("/wallet"),
  getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
  initiateTopUp: (amountZar) => api.post("/wallet/topup", { amountZar }),
};

export const shopAPI = {
  getProducts: (category) => api.get(`/shop/products${category ? `?category=${category}` : ""}`),
  getProduct: (id) => api.get(`/shop/products/${id}`),
};

export const deliveryAPI = {
  bookDelivery: (data) => api.post("/deliveries/book", data),
  trackDelivery: (trackingNumber) => api.get(`/deliveries/track/${trackingNumber}`),
  getDeliveries: () => api.get("/deliveries"),
};

export default api;

export const adminAPI = {
  getDashboardStats: () => api.get("/admin/stats"),
  getAllDrivers: () => api.get("/admin/drivers"),
  approveDriver: (driverId) => api.post(`/admin/drivers/${driverId}/approve`),
  rejectDriver: (driverId, note) => api.post(`/admin/drivers/${driverId}/reject`, { note }),
  getSurgeZones: () => api.get("/admin/surge-zones"),
  updateSurgeZone: (id, data) => api.put(`/admin/surge-zones/${id}`, data),
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  getLiveRides: () => api.get("/admin/rides/live"),
};

export const panicAPI = {
  trigger: (latitude, longitude) => api.post("/panic/trigger", { latitude, longitude }),
  triggerAnonymous: (latitude, longitude) => api.post("/panic/trigger-anonymous", { latitude, longitude }),
  listContacts: () => api.get("/panic/contacts"),
  addContact: (label, phone, callmebotApiKey) => api.post("/panic/contacts", { label, phone, callmebotApiKey }),
  removeContact: (id) => api.delete(`/panic/contacts/${id}`),
  selfCancel: (alertId) => api.post(`/panic/alerts/${alertId}/self-cancel`),
  updateLocation: (alertId, latitude, longitude) => api.post(`/panic/alerts/${alertId}/update-location`, { latitude, longitude }),
  getSubscriptionStatus: () => api.get("/panic/subscription-status"),
  activateSubscription: () => api.post("/panic/activate-subscription"),
  getSafetyProfile: () => api.get("/panic/safety-profile"),
  updateSafetyProfile: (data) => api.post("/panic/safety-profile", data),
  getWatchAlert: (alertId) => api.get(`/panic/watch/${alertId}`),
  // Admin / security monitor dashboard
  adminListAlerts: (status) => api.get(`/panic/alerts${status ? `?status=${status}` : ""}`),
  adminAcknowledge: (id) => api.post(`/panic/alerts/${id}/acknowledge`),
  adminResolve: (id, notes, falseAlarm) => api.post(`/panic/alerts/${id}/resolve`, { notes, falseAlarm }),
  submitSitRep: (id, status, summary) => api.post(`/panic/alerts/${id}/sitrep`, { status, summary }),
  adminListSecurityContacts: () => api.get("/panic/security-contacts"),
  adminAddSecurityContact: (companyName, phone, callmebotApiKey, type, isPrimary) => api.post("/panic/security-contacts", { companyName, phone, callmebotApiKey, type, isPrimary }),
  adminToggleSecurityContact: (id) => api.post(`/panic/security-contacts/${id}/toggle`),
  adminTogglePrimaryContact: (id) => api.post(`/panic/security-contacts/${id}/toggle-primary`),
  adminListSecurityUsers: () => api.get("/panic/security-users"),
  adminCreateSecurityUser: (name, phone, email) => api.post("/panic/security-users", { name, phone, email }),
  adminRemoveSecurityUser: (id) => api.delete(`/panic/security-users/${id}`),
};

export const datingAPI = {
  // Profile
  getProfiles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/dating/profiles${qs ? `?${qs}` : ""}`);
  },
  upsertProfile: (data) => api.post("/dating/profile", data),
  getMe: () => api.get("/dating/me"),
  getPromoStatus: () => api.get("/dating/promo-status"),
  activatePremium: () => api.post("/dating/activate-premium"),
  // Like / Pass / Undo
  like: (toId, isSuperLike = false) => api.post(`/dating/like/${toId}`, { isSuperLike }),
  pass: (toId) => api.post(`/dating/pass/${toId}`),
  undoPass: () => api.post("/dating/undo-pass"),
  // Who liked me
  getLikedMe: () => api.get("/dating/liked-me"),
  // Matches & messages
  getMatches: () => api.get("/dating/matches"),
  sendMessage: (data) => api.post("/dating/message", data),
  getMessages: (matchId) => api.get(`/dating/messages/${matchId}`),
  // Boost & Incognito
  activateBoost: () => api.post("/dating/boost"),
  setIncognito: (enabled) => api.post("/dating/incognito", { enabled }),
  // Photos
  addPhoto: (dataUrl) => api.post("/dating/photo", { dataUrl }),
  removePhoto: (index) => api.post("/dating/photo/remove", { index }),
  // Block & Report
  block: (profileId) => api.post(`/dating/block/${profileId}`),
  unblock: (profileId) => api.post(`/dating/unblock/${profileId}`),
  getBlocked: () => api.get("/dating/blocked"),
  report: (data) => api.post("/dating/report", data),
  // Verification
  requestVerification: (selfieUrl) => api.post("/dating/verify/request", { selfieUrl }),
  getVerificationStatus: () => api.get("/dating/verify/status"),
  // Admin
  adminListPendingVerifications: () => api.get("/dating/admin/verify/pending"),
  adminApproveVerification: (id) => api.post(`/dating/admin/verify/${id}/approve`),
  adminRejectVerification: (id, reviewNote) => api.post(`/dating/admin/verify/${id}/reject`, { reviewNote }),
};

export const communityAPI = {
  // Identity
  getIdentity: () => api.get("/community/identity"),
  rerollIdentity: () => api.post("/community/identity/reroll"),
  setAvatar: (avatarKey) => api.post("/community/identity/avatar", { avatarKey }),
  getAvatars: () => api.get("/community/avatars"),
  // Rooms
  listRooms: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/community/rooms${qs ? `?${qs}` : ""}`);
  },
  getRoom: (slug, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/community/rooms/${slug}${qs ? `?${qs}` : ""}`);
  },
  joinRoom: (slug) => api.post(`/community/rooms/${slug}/join`),
  // Reactions
  react: (messageId, emoji) => api.post(`/community/messages/${messageId}/react`, { emoji }),
  // Polls
  createPoll: (slug, data) => api.post(`/community/rooms/${slug}/polls`, data),
  getPoll: (id) => api.get(`/community/polls/${id}`),
  voteOnPoll: (id, optionIndex) => api.post(`/community/polls/${id}/vote`, { optionIndex }),
  // Reports
  report: (data) => api.post("/community/report", data),
  // Moderator dashboard
  modListReports: (status = "PENDING") => api.get(`/community/mod/reports?status=${status}`),
  modHeldMessages: () => api.get("/community/mod/held-messages"),
  modEvents: () => api.get("/community/mod/events"),
  modApproveMessage: (id) => api.post(`/community/mod/messages/${id}/approve`),
  modRemoveMessage: (id) => api.post(`/community/mod/messages/${id}/remove`),
  modPinMessage: (id) => api.post(`/community/mod/messages/${id}/pin`),
  modMuteUser: (userId, data) => api.post(`/community/mod/users/${userId}/mute`, data),
  modBanUser: (userId, data) => api.post(`/community/mod/users/${userId}/ban`, data),
  modUnbanUser: (userId) => api.post(`/community/mod/users/${userId}/unban`),
  modCreateRoom: (data) => api.post("/community/mod/rooms", data),
};

export const driverAPI = {
  getProfile: () => api.get("/drivers/me"),
  updateStatus: (status) => api.post("/drivers/status", { status }),
  updateLocation: (data) => api.post("/drivers/location", data),
  shiftEnd: (data) => api.post("/drivers/shift-end", data),
  getEarnings: (period) => api.get(`/drivers/earnings?period=${period}`),
  getPendingRides: () => api.get("/drivers/pending-rides"),
};
