// src/services/adminApi.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  withCredentials: true,  
});

export const getOrders = () => api.get('/orders');

export const getProducts = () => api.get('/products');

export const updateOrderStatus = (orderId, status) =>
  api.put(`/orders/${orderId}/status`, { status });

export const validateOrder = (orderId) =>
  api.put(`/orders/${orderId}/validate`, {});

export const updateProductStock = (productId, stock) =>
  api.put(`/products/${productId}/stock`, { stock });