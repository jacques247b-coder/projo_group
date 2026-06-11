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
        localStorage.removeItem("projo_token");
        localStorage.removeItem("projo_refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data || error);
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
  acceptRide: (id) => api.post(`/rides/${id}/accept`),
  updateStatus: (id, status) => api.post(`/rides/${id}/status`, { status }),
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
