import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || '/api/v1';

let _getToken  = () => null;
let _doLogout  = () => {};

export function injectStoreHelpers(getToken, doLogout) {
  _getToken = getToken;
  _doLogout = doLogout;
}

const api = axios.create({
  baseURL: BASE,
  timeout: 30000, // 30s — enough for slow DB or Razorpay calls
});

/* Attach JWT token */
api.interceptors.request.use((cfg) => {
  const token = _getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* Unwrap data, handle errors with clear messages */
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    // Auto-logout on 401
    if (err.response?.status === 401) _doLogout();

    // Build a human-readable message
    let msg = 'Something went wrong. Please try again.';

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      msg = 'Request timed out. Check your connection and try again.';
    } else if (err.message === 'Network Error' || !err.response) {
      msg = 'Cannot reach server. Make sure the server is running.';
    } else if (err.response?.data?.message) {
      msg = err.response.data.message;
    } else if (err.message) {
      msg = err.message;
    }

    return Promise.reject(new Error(msg));
  }
);

export default api;

/* ── Upload ───────────────────────────────────────────── */
export const uploadAPI = {
  single:   (formData) => api.post('/upload',          formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  multiple: (formData) => api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

/* ── Auth ─────────────────────────────────────────────── */
export const authAPI = {
  adminLogin:          (email, password) => api.post('/auth/admin/login', { email, password }),
  adminChangePassword: (cur, next)       => api.put('/auth/admin/change-password', { currentPassword: cur, newPassword: next }),
  sendOTP:    (phone) => api.post('/auth/send-otp',  { phone }),
  verifyOTP:  (data)  => api.post('/auth/verify-otp', data),
  getMe:           ()      => api.get('/auth/me'),
  updateProfile:   (data)  => api.put('/auth/profile', data),
  addAddress:      (data)  => api.post('/auth/address', data),
  updateAddress:   (id, d) => api.put(`/auth/address/${id}`, d),
  deleteAddress:   (id)    => api.delete(`/auth/address/${id}`),
};

/* ── Products ─────────────────────────────────────────── */
export const productAPI = {
  getAll:         (params) => api.get('/products', { params }),
  getFeatured:    (limit=8)=> api.get('/products/featured', { params: { limit } }),
  getBySlug:      (slug)   => api.get(`/products/${slug}`),
  adminGetAll:    (params) => api.get('/admin/products', { params }),
  adminGetById:   (id)     => api.get(`/products/admin/${id}`),
  create:         (data)   => api.post('/products', data),
  update:         (id, d)  => api.put(`/products/${id}`, d),
  remove:         (id)     => api.delete(`/products/${id}`),
  toggleFeatured: (id)     => api.patch(`/products/${id}/featured`),
  updateStock:    (id, vid, stock) => api.patch(`/products/${id}/variants/${vid}/stock`, { stock }),
};

/* ── Categories ───────────────────────────────────────── */
export const categoryAPI = {
  getTree:     ()        => api.get('/categories/tree'),
  getAll:      (params)  => api.get('/categories', { params }),
  getBySlug:   (slug)    => api.get(`/categories/${slug}`),
  adminGetAll: ()        => api.get('/admin/categories'),
  create:      (data)    => api.post('/categories', data),
  update:      (id, d)   => api.put(`/categories/${id}`, d),
  remove:      (id)      => api.delete(`/categories/${id}`),
};

/* ── Cart ─────────────────────────────────────────────── */
export const cartAPI = {
  get:        ()         => api.get('/cart'),
  add:        (data)     => api.post('/cart/add', data),
  sync:       (items)    => api.post('/cart/sync', { items }),
  updateItem: (id, qty)  => api.put(`/cart/item/${id}`, { quantity: qty }),
  removeItem: (id)       => api.delete(`/cart/item/${id}`),
  clear:      ()         => api.delete('/cart'),
};

/* ── Orders ───────────────────────────────────────────── */
export const orderAPI = {
  place:        (data)   => api.post('/orders', data),
  getAll:       (params) => api.get('/orders', { params }),
  getById:      (id)     => api.get(`/orders/${id}`),
  adminGetAll:  (params) => api.get('/admin/orders', { params }),
  updateStatus: (id, status, note) => api.patch(`/admin/orders/${id}/status`, { status, note }),
};

/* ── Payments ─────────────────────────────────────────── */
export const paymentAPI = {
  getKey:      ()     => api.get('/payments/key'),
  createOrder: (oid)  => api.post('/payments/create-order', { orderId: oid }),
  verify:      (data) => api.post('/payments/verify', data),
  failure:     (data) => api.post('/payments/failure', data),
};

/* ── Admin ────────────────────────────────────────────── */
export const adminAPI = {
  getDashboard:  ()       => api.get('/admin/dashboard'),
  getUsers:      (params) => api.get('/admin/users', { params }),
  getUser:       (id)     => api.get(`/admin/users/${id}`),
  toggleUser:    (id)     => api.patch(`/admin/users/${id}/toggle`),
  changeRole:    (id, r)  => api.patch(`/admin/users/${id}/role`, { role: r }),
};

/* ── Settings ─────────────────────────────────────────── */
export const settingsAPI = {
  getPublic:          ()              => api.get('/settings/public'),
  getAll:             ()              => api.get('/settings'),
  update:             (key, val, grp) => api.put(`/settings/${key}`, { value: val, group: grp }),
  bulkUpdate:         (settings, grp) => api.post('/settings/bulk', { settings, group: grp }),
  getRazorpay:        ()              => api.get('/settings/razorpay'),
  updateRazorpayMode: (mode)          => api.put('/settings/razorpay/mode', { mode }),
  // Shipping
  getShipping: () => api.get('/settings/shipping'),
  updateShipping: (threshold, flatRate, percentRate) =>
    api.post('/settings/bulk', {
      settings: [
        { key: 'shipping_threshold',    value: Number(threshold) },
        { key: 'shipping_flat_rate',    value: Number(flatRate) },
        { key: 'shipping_percent_rate', value: Number(percentRate) },
      ],
      group: 'shipping',
    }),
};