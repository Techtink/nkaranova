import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import config from '../config/env';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Export for use in other services
export const API_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;
export const IMAGE_BASE_URL = config.imageBaseUrl;

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      // Navigation will be handled by the auth context
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
  updateDetails: (data) => api.put('/auth/details', data)
};

// Tailors API
export const tailorsAPI = {
  getAll: (params) => api.get('/tailors', { params }),
  getFeatured: () => api.get('/tailors/featured'),
  getByUsername: (username) => api.get(`/tailors/${username}`),
  getMyProfile: () => api.get('/tailors/me/profile'),
  updateMyProfile: (data) => api.put('/tailors/me/profile', data),
  getAvailability: (username) => api.get(`/tailors/${username}/availability`),
  updateMyAvailability: (data) => api.put('/tailors/me/availability', data),
  getSlots: (username, date) => api.get(`/tailors/${username}/slots/${date}`),
  submitVerification: (documents) => api.post('/tailors/me/verification', { documents })
};

// Works API
export const worksAPI = {
  getAll: (params) => api.get('/works', { params }),
  getFeatured: () => api.get('/works/featured'),
  getById: (id) => api.get(`/works/${id}`),
  getCategories: () => api.get('/works/categories'),
  getMyWorks: (params) => api.get('/works/me', { params }),
  create: (data) => api.post('/works', data),
  update: (id, data) => api.put(`/works/${id}`, data),
  delete: (id) => api.delete(`/works/${id}`)
};

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getCustomerBookings: (params) => api.get('/bookings/customer', { params }),
  getTailorBookings: (params) => api.get('/bookings/tailor', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  getStats: () => api.get('/bookings/stats')
};

// Orders API
export const ordersAPI = {
  // Customer endpoints
  getCustomerOrders: (params) => api.get('/orders/customer', { params }),
  approveWorkPlan: (id) => api.put(`/orders/${id}/work-plan/approve`),
  rejectWorkPlan: (id, data) => api.put(`/orders/${id}/work-plan/reject`, data),
  respondToDelay: (id, data) => api.put(`/orders/${id}/delay/respond`, data),
  submitReview: (id, data) => api.post(`/orders/${id}/review`, data),

  // Tailor endpoints
  getTailorOrders: (params) => api.get('/orders/tailor', { params }),
  submitWorkPlan: (id, data) => api.put(`/orders/${id}/work-plan`, data),
  completeStage: (id, stageIndex, data) => api.put(`/orders/${id}/stages/${stageIndex}/complete`, data),
  addStageNote: (id, stageIndex, data) => api.post(`/orders/${id}/stages/${stageIndex}/notes`, data),
  requestDelay: (id, data) => api.post(`/orders/${id}/delay`, data),
  markComplete: (id) => api.put(`/orders/${id}/complete`),

  // Shared endpoints
  getById: (id) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats')
};

// Reviews API
export const reviewsAPI = {
  getTailorReviews: (username, params) => api.get(`/reviews/tailor/${username}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  respond: (id, comment) => api.post(`/reviews/${id}/respond`, { comment }),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  getMyReviews: () => api.get('/reviews/me')
};

// Conversations API
export const conversationsAPI = {
  getAll: (params) => api.get('/conversations', { params }),
  getUnreadCount: () => api.get('/conversations/unread'),
  startWithTailor: (username) => api.post(`/conversations/tailor/${username}`),
  getById: (id) => api.get(`/conversations/${id}`),
  getMessages: (id, params) => api.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
  markAsRead: (id) => api.put(`/conversations/${id}/read`)
};

// Search API
export const searchAPI = {
  global: (params) => api.get('/search', { params }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
  ai: (query, page, limit) => api.post('/search/ai', { query, page, limit }),
  recommendations: () => api.get('/search/recommendations')
};

// Payments API
export const paymentsAPI = {
  createConnectAccount: () => api.post('/payments/connect'),
  getOnboardingLink: () => api.get('/payments/onboarding'),
  getStatus: () => api.get('/payments/status'),
  createBookingPayment: (bookingId) => api.post(`/payments/booking/${bookingId}`),
  confirmPayment: (bookingId) => api.post(`/payments/confirm/${bookingId}`)
};

// File upload helper for React Native
export const uploadFile = async (uri, type = 'misc') => {
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const fileType = match ? `image/${match[1]}` : 'image/jpeg';

  const fieldName = type === 'profile' ? 'profilePhoto' : type === 'work' ? 'workImages' : 'verificationDocs';

  formData.append(fieldName, {
    uri,
    name: filename,
    type: fileType
  });

  const response = await api.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export default api;
