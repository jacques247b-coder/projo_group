// ============================================================
// PROJO GROUP — API Service
// Axios instance for all backend API calls
// ============================================================

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach JWT ───────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("projo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 ──────────────────────
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
        localStorage.removeItem("projo_token");
        localStorage.removeItem("projo_refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─── Auth endpoints ──────────────────────────────────────────
export const authAPI = {
  sendOTP: (phone) => api.post("/auth/send-otp", { phone }),
  verifyOTP: (phone, otp, name, role) => api.post("/auth/verify-otp", { phone, otp, ...(name && { name }), ...(role && { role }) }),
  register: (data) => api.post("/auth/register", data),
  login: (phone, password) => api.post("/auth/login", { phone, password }),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ─── Ride endpoints ──────────────────────────────────────────
export const rideAPI = {
  estimateFare: (data) => api.post("/rides/estimate", data),
  bookRide: (data) => api.post("/rides/book", data),
  getActiveRide: () => api.get("/rides/active"),
  getRideHistory: (page = 1) => api.get(`/rides/history?page=${page}`),
  getRideById: (id) => api.get(`/rides/${id}`),
  getSharedRide: (token) => api.get(`/rides/share/${token}`),
  cancelRide: (id, reason) => api.post(`/rides/${id}/cancel`, { reason }),
  rateRide: (id, stars, comment) => api.post(`/rides/${id}/rate`, { stars, comment }),
  // Driver actions
  acceptRide: (id) => api.post(`/rides/${id}/accept`),
  updateStatus: (id, status) => api.post(`/rides/${id}/status`, { status }),
};

// ─── Driver endpoints ────────────────────────────────────────
export const driverAPI = {
  getProfile: () => api.get("/drivers/me"),
  updateStatus: (status) => api.post("/drivers/status", { status }),
  getEarnings: (period) => api.get(`/drivers/earnings?period=${period}`),
  getPendingRides: () => api.get("/drivers/pending-rides"),
};

// ─── Wallet endpoints ────────────────────────────────────────
export const walletAPI = {
  getBalance: () => api.get("/wallet"),
  getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
  initiateTopUp: (amountZar) => api.post("/wallet/topup", { amountZar }),
};

// ─── Shop endpoints ──────────────────────────────────────────
export const shopAPI = {
  getProducts: (category) => api.get(`/shop/products${category ? `?category=${category}` : ""}`),
  getProduct: (id) => api.get(`/shop/products/${id}`),
  createOrder: (data) => api.post("/shop/orders", data),
  getOrders: () => api.get("/shop/orders"),
};

// ─── Delivery endpoints ──────────────────────────────────────
export const deliveryAPI = {
  bookDelivery: (data) => api.post("/deliveries/book", data),
  trackDelivery: (trackingNumber) => api.get(`/deliveries/track/${trackingNumber}`),
  getDeliveries: () => api.get("/deliveries"),
};

// ─── Admin endpoints ─────────────────────────────────────────
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

export default api;
