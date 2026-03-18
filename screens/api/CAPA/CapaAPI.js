// api/CapaAPI.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use same API URL pattern as other modules
const API_URL = Platform.select({
  ios: 'http://localhost:5000',
  android: 'http://10.0.2.2:5000',
  default: 'http://10.0.2.2:5000',
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      console.log("🔐 CAPA API - URL:", config.baseURL + config.url);
      console.log("🔐 CAPA API - Token found:", !!token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ CAPA API Response - Status:", response.status);
    return response;
  },
  (error) => {
    console.error("❌ CAPA API Error - Status:", error.response?.status);
    console.error("❌ CAPA API Error - URL:", error.config?.url);
    console.error("❌ CAPA API Error - Data:", error.response?.data);
    return Promise.reject(error);
  }
);

// ==================== CAPAs ====================
export const capaAPI = {
  // Get all CAPAs with filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.priority && filters.priority !== 'all') params.append("priority", filters.priority);
      if (filters.status && filters.status !== 'all') params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const queryString = params.toString();
      const response = await api.get(`/api/capa${queryString ? `?${queryString}` : ""}`);
      
      console.log("Raw CAPA response from DB:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Error in getAll:", error.message);
      throw error;
    }
  },

  // Get CAPA by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/capa/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error in getById:", error.message);
      throw error;
    }
  },

  // Create new CAPA
  create: async (capaData) => {
    try {
      console.log("Creating CAPA with data:", capaData);
      const response = await api.post("/api/capa", capaData);
      console.log("Create response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Create error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Update CAPA
  update: async (id, capaData) => {
    try {
      console.log("Updating CAPA ID:", id, "with data:", capaData);
      const response = await api.put(`/api/capa/${id}`, capaData);
      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Delete CAPA
  delete: async (id) => {
    try {
      console.log("Deleting CAPA ID:", id);
      const response = await api.delete(`/api/capa/${id}`);
      console.log("Delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete error:", error.response?.data || error.message);
      throw error;
    }
  },

  // Get CAPA statistics
  getStats: async () => {
    try {
      const response = await api.get("/api/capa/stats");
      return response.data;
    } catch (error) {
      console.error("Error in getStats:", error.message);
      throw error;
    }
  },
};

// ==================== INCIDENTS FOR LINKING ====================
export const incidentAPI = {
  getAll: async () => {
    try {
      const response = await api.get("/api/incidents?limit=10");
      return response.data;
    } catch (error) {
      console.error("Error fetching incidents:", error.message);
      throw error;
    }
  },
};

// ==================== AUDITS FOR LINKING ====================
export const auditAPI = {
  getAll: async () => {
    try {
      const response = await api.get("/api/audits?limit=10");
      return response.data;
    } catch (error) {
      console.error("Error fetching audits:", error.message);
      throw error;
    }
  },
};