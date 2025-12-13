import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key';

export const api = axios.create({
  baseURL: API_BASE,
  headers: ADMIN_KEY ? { 'x-admin-key': ADMIN_KEY } : undefined
});

export const uploadClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'multipart/form-data', ...(ADMIN_KEY ? { 'x-admin-key': ADMIN_KEY } : {}) }
});
