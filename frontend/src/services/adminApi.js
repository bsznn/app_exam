// src/services/adminApi.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getOrders = () => api.get('/api/admin/orders');
export const getProducts = () => api.get('/api/admin/products');
export const updateOrderStatus = (orderId, status) => api.put(`/api/admin/orders/${orderId}/status`, { status });
export const validateOrder = (orderId) => api.put(`/api/admin/orders/${orderId}/validate`, {});
export const updateProductStock = (productId, stock) => api.put(`/api/admin/products/${productId}/stock`, { stock });