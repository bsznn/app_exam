// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  withCredentials: true, 
});

export const fetchProducts = () => api.get('/products');

export const createOrder = (orderData) => api.post('/orders', orderData);