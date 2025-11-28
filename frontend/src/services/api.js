import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (error) => {
    // Only redirect to login for 401 errors on non-auth endpoints
    // Don't redirect for /auth/me (handled by AuthContext) or /auth/login
    const isAuthEndpoint = error.config?.url?.includes('/auth/me') ||
                           error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
  updateDetails: (data) => api.put('/auth/details', data),
  // 2FA
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  validate2FA: (data) => api.post('/auth/2fa/validate', data),
  get2FAStatus: () => api.get('/auth/2fa/status'),
  regenerateBackupCodes: (password) => api.post('/auth/2fa/backup-codes', { password })
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
  submitVerification: (documents) => api.post('/tailors/me/verification', { documents }),
  checkUsername: (username) => api.get(`/tailors/check-username/${username}`)
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
  getStats: () => api.get('/bookings/stats'),

  // New booking flow endpoints
  // Tailor actions
  confirm: (id) => api.put(`/bookings/${id}/confirm`),
  submitQuote: (id, quoteData) => api.post(`/bookings/${id}/quote`, quoteData),
  getBookingsNeedingQuote: () => api.get('/bookings/needs-quote'),

  // Customer actions
  getPendingQuotes: () => api.get('/bookings/pending-quotes'),
  acceptQuote: (id) => api.put(`/bookings/${id}/quote/accept`),
  rejectQuote: (id, reason) => api.put(`/bookings/${id}/quote/reject`, { reason }),

  // Payment
  processPayment: (id, paymentData) => api.post(`/bookings/${id}/pay`, paymentData),

  // Admin actions
  markConsultationComplete: (id, notes) => api.put(`/bookings/${id}/consultation-complete`, { notes })
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

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  // Tailors
  getTailors: (params) => api.get('/admin/tailors', { params }),
  getPendingTailors: (params) => api.get('/admin/tailors/pending', { params }),
  approveTailor: (id) => api.put(`/admin/tailors/${id}/approval`, { status: 'approved' }),
  rejectTailor: (id, reason) => api.put(`/admin/tailors/${id}/approval`, { status: 'rejected', reason }),
  suspendTailor: (id, reason) => api.put(`/admin/tailors/${id}/approval`, { status: 'suspended', reason }),
  updateTailorApproval: (id, data) => api.put(`/admin/tailors/${id}/approval`, data),
  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getBookingStats: () => api.get('/admin/bookings/stats'),
  getBookingsNeedingConsultation: (params) => api.get('/admin/bookings/needs-consultation', { params }),
  markConsultationComplete: (id, notes) => api.put(`/admin/bookings/${id}/consultation-complete`, { notes }),
  // Works
  getWorks: (params) => api.get('/admin/works', { params }),
  getPendingWorks: (params) => api.get('/admin/works/pending', { params }),
  approveWork: (id) => api.put(`/admin/works/${id}/approval`, { status: 'approved' }),
  rejectWork: (id, reason) => api.put(`/admin/works/${id}/approval`, { status: 'rejected', reason }),
  updateWorkApproval: (id, data) => api.put(`/admin/works/${id}/approval`, data),
  toggleWorkFeatured: (id) => api.put(`/admin/works/${id}/feature`),
  // Reviews
  getReviews: (params) => api.get('/admin/reviews', { params }),
  getPendingReviews: (params) => api.get('/admin/reviews/pending', { params }),
  approveReview: (id) => api.put(`/admin/reviews/${id}/approval`, { status: 'approved' }),
  rejectReview: (id, reason) => api.put(`/admin/reviews/${id}/approval`, { status: 'rejected', reason }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
  updateReviewApproval: (id, data) => api.put(`/admin/reviews/${id}/approval`, data),
  // Verifications
  getVerifications: (params) => api.get('/admin/verifications', { params }),
  getPendingVerifications: (params) => api.get('/admin/verifications/pending', { params }),
  approveVerification: (id) => api.put(`/admin/verifications/${id}`, { status: 'verified' }),
  rejectVerification: (id, reason) => api.put(`/admin/verifications/${id}`, { status: 'rejected', reason }),
  updateVerification: (id, data) => api.put(`/admin/verifications/${id}`, data),
  // Conversations
  getConversations: (params) => api.get('/admin/conversations', { params }),
  toggleConversationFlag: (id, reason) => api.put(`/admin/conversations/${id}/flag`, { reason }),
  // Admin chat
  getChatUsers: (params) => api.get('/admin/chat/users', { params }),
  startConversationWithUser: (userId) => api.post(`/admin/conversations/user/${userId}`),
  getConversation: (id) => api.get(`/admin/conversations/${id}`),
  getConversationMessages: (id, params) => api.get(`/admin/conversations/${id}/messages`, { params }),
  sendChatMessage: (id, content) => api.post(`/admin/conversations/${id}/messages`, { content }),
  // Team & Roles
  getTeamMembers: () => api.get('/admin/team'),
  addTeamMember: (data) => api.post('/admin/team', data),
  updateTeamMember: (id, data) => api.put(`/admin/team/${id}`, data),
  removeTeamMember: (id) => api.delete(`/admin/team/${id}`),
  getRoles: () => api.get('/admin/roles'),
  createRole: (data) => api.post('/admin/roles', data),
  updateRole: (id, data) => api.put(`/admin/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`)
};

// Guest Chat API (public - no auth required)
export const guestChatAPI = {
  start: (data) => api.post('/guest-chat/start', data),
  getConversation: (id, guestId) => api.get(`/guest-chat/${id}`, { params: { guestId } }),
  sendMessage: (id, data) => api.post(`/guest-chat/${id}/messages`, data),
  // Admin endpoints
  getConversations: (params) => api.get('/guest-chat/admin/conversations', { params }),
  getConversationById: (id) => api.get(`/guest-chat/admin/conversations/${id}`),
  sendAdminMessage: (id, content) => api.post(`/guest-chat/admin/conversations/${id}/messages`, { content }),
  closeConversation: (id) => api.put(`/guest-chat/admin/conversations/${id}/close`),
  getUnreadCount: () => api.get('/guest-chat/admin/unread')
};

// Payments API
export const paymentsAPI = {
  createConnectAccount: () => api.post('/payments/connect'),
  getOnboardingLink: () => api.get('/payments/onboarding'),
  getStatus: () => api.get('/payments/status'),
  createBookingPayment: (bookingId) => api.post(`/payments/booking/${bookingId}`),
  confirmPayment: (bookingId) => api.post(`/payments/confirm/${bookingId}`)
};

// Referrals API
export const referralsAPI = {
  getMyInfo: () => api.get('/referrals/my-info'),
  getTokenHistory: (params) => api.get('/referrals/token-history', { params }),
  validateCode: (code) => api.get(`/referrals/validate/${code}`),
  // Admin
  getAllReferrals: (params) => api.get('/referrals/admin/all', { params }),
  completeReferral: (id) => api.post(`/referrals/admin/complete/${id}`),
  adjustTokens: (data) => api.post('/referrals/admin/adjust-tokens', data)
};

// Featured API
export const featuredAPI = {
  getTailors: () => api.get('/featured'),
  getPricing: () => api.get('/featured/pricing'),
  getMyStatus: () => api.get('/featured/my-status'),
  redeemTokens: () => api.post('/featured/redeem-tokens'),
  createPayment: (durationDays) => api.post('/featured/create-payment', { durationDays }),
  confirmPayment: (paymentIntentId) => api.post('/featured/confirm-payment', { paymentIntentId }),
  // Admin
  getAllSpots: (params) => api.get('/featured/admin/all', { params }),
  createSpot: (data) => api.post('/featured/admin/create', data),
  cancelSpot: (id, reason) => api.post(`/featured/admin/cancel/${id}`, { reason })
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByCategory: (category) => api.get(`/settings/category/${category}`),
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  updateMultiple: (settings) => api.put('/settings', { settings }),
  initialize: () => api.post('/settings/initialize'),
  getPublicReferral: () => api.get('/settings/public/referral'),
  getPublicLanding: () => api.get('/settings/public/landing'),
  uploadHeroImage: (file) => {
    const formData = new FormData();
    formData.append('heroImage', file);
    return api.post('/settings/upload-hero', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Users API
export const usersAPI = {
  addToHistory: (tailorId) => api.post(`/users/history/${tailorId}`),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// Orders API
export const ordersAPI = {
  // Customer endpoints
  getCustomerOrders: (params) => api.get('/orders/customer', { params }),
  approveWorkPlan: (id) => api.put(`/orders/${id}/work-plan/approve`),
  rejectWorkPlan: (id, reason) => api.put(`/orders/${id}/work-plan/reject`, { reason }),
  respondToDelayRequest: (orderId, requestId, approved, notes) =>
    api.put(`/orders/${orderId}/delay-request/${requestId}`, { approved, notes }),
  markCompleted: (id, data) => api.put(`/orders/${id}/complete`, data),

  // Tailor endpoints
  getTailorOrders: (params) => api.get('/orders/tailor', { params }),
  getOrderStats: () => api.get('/orders/stats'),
  submitWorkPlan: (id, stages) => api.post(`/orders/${id}/work-plan`, { stages }),
  completeStage: (orderId, stageIndex, notes) =>
    api.put(`/orders/${orderId}/stages/${stageIndex}/complete`, { notes }),
  addStageNote: (orderId, stageIndex, text) =>
    api.post(`/orders/${orderId}/stages/${stageIndex}/notes`, { text }),
  requestDelay: (id, reason, additionalDays) =>
    api.post(`/orders/${id}/delay-request`, { reason, additionalDays }),

  // Shared endpoints
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  create: (bookingId) => api.post('/orders', { bookingId }),

  // Admin endpoints
  getAdminOrders: (params) => api.get('/orders/admin', { params }),
  getOverdueOrders: () => api.get('/orders/admin/overdue'),
  completeConsultation: (id, notes) => api.put(`/orders/${id}/complete-consultation`, { notes })
};

// Measurements API
export const measurementsAPI = {
  // System points
  getSystemPoints: (params) => api.get('/measurements/points', { params }),

  // Customer profiles
  getProfiles: () => api.get('/measurements/profiles'),
  getProfile: (id) => api.get(`/measurements/profiles/${id}`),
  createProfile: (data) => api.post('/measurements/profiles', data),
  updateProfile: (id, data) => api.put(`/measurements/profiles/${id}`, data),
  deleteProfile: (id) => api.delete(`/measurements/profiles/${id}`),
  updateProfileMeasurements: (id, data) => api.put(`/measurements/profiles/${id}/measurements`, data),
  setDefaultProfile: (id) => api.put(`/measurements/profiles/${id}/set-default`),

  // Tailor config
  getTailorConfig: () => api.get('/measurements/tailor/config'),
  updateTailorConfig: (data) => api.put('/measurements/tailor/config', data),
  getTailorRequirements: (tailorId, gender) => api.get(`/measurements/tailor/${tailorId}/requirements`, { params: { gender } }),

  // Completeness check
  checkCompleteness: (profileId, tailorId) => api.get(`/measurements/profiles/${profileId}/completeness`, { params: { tailorId } })
};

// Uploads API
export const uploadsAPI = {
  uploadWorkImages: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('workImages', file);
    });
    return api.post('/uploads/works', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);
    return api.post('/uploads/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadVerificationDocs: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('verificationDocs', file);
    });
    return api.post('/uploads/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteFile: (type, filename) => api.delete(`/uploads/${type}/${filename}`)
};

// Currency API
export const currencyAPI = {
  getSupportedCurrencies: () => api.get('/currency/supported'),
  getExchangeRates: () => api.get('/currency/rates'),
  convert: (amount, from, to) => api.post('/currency/convert', { amount, from, to }),
  convertBatch: (amounts, from, to) => api.post('/currency/convert-batch', { amounts, from, to }),
  format: (amount, currency) => api.get('/currency/format', { params: { amount, currency } })
};

// FAQ API
export const faqAPI = {
  // Public
  getAll: (params) => api.get('/faqs', { params }),
  getCategories: () => api.get('/faqs/categories'),
  getById: (id) => api.get(`/faqs/${id}`),
  // Admin
  getAdmin: (params) => api.get('/faqs/admin', { params }),
  create: (data) => api.post('/faqs', data),
  update: (id, data) => api.put(`/faqs/${id}`, data),
  delete: (id) => api.delete(`/faqs/${id}`),
  reorder: (items) => api.put('/faqs/reorder', { items })
};

// Verification API (Face + Liveness)
export const verificationAPI = {
  // Liveness detection
  startLivenessSession: (numChallenges) => api.post('/verification/liveness/start', { numChallenges }),
  verifyLivenessChallenge: (sessionId, challengeIndex, frame) =>
    api.post('/verification/liveness/verify', { sessionId, challengeIndex, frame }),
  getLivenessSession: (sessionId) => api.get(`/verification/liveness/${sessionId}`),
  // Face matching
  compareFaceWithID: (idImage, selfieImage) =>
    api.post('/verification/face-match', { idImage, selfieImage }),
  // Status & requirements
  getRequirements: () => api.get('/verification/requirements'),
  getStatus: () => api.get('/verification/status'),
  submitVerification: (documents) => api.post('/verification/submit', { documents })
};

// Legacy file upload helper (for backwards compatibility)
export const uploadFile = async (file, type = 'misc') => {
  const formData = new FormData();
  const fieldName = type === 'profile' ? 'profilePhoto' : type === 'work' ? 'workImages' : 'verificationDocs';
  const endpoint = type === 'profile' ? '/uploads/profile' : type === 'work' ? '/uploads/works' : '/uploads/verification';
  formData.append(fieldName, file);

  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export default api;
