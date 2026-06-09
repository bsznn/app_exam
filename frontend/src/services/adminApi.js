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

export const getOrders = () => api.get('/orders');
export const getProducts = () => api.get('/products');
export const updateOrderStatus = (orderId, status) => api.put(`api/orders/${orderId}/status`, { status });
export const validateOrder = (orderId) => api.put(`api/orders/${orderId}/validate`, {});
export const updateProductStock = (productId, stock) => api.put(`api/products/${productId}/stock`, { stock });