// api/IncidentAPI.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with auth header
const api = axios.create({
  baseURL: 'http://10.0.2.2:5000', // Correct for Android emulator
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Use the correct token key 'session_token'
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      
      console.log("🔐 API Request - URL:", config.baseURL + config.url);
      console.log("🔐 API Request - Token found:", !!token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔐 API Request - Auth header set");
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response - Status:", response.status);
    console.log("✅ API Response - Data:", response.data);
    return response;
  },
  (error) => {
    console.error("❌ API Error - Status:", error.response?.status);
    console.error("❌ API Error - URL:", error.config?.url);
    console.error("❌ API Error - Data:", error.response?.data);
    return Promise.reject(error);
  }
);

// ==================== INCIDENTS ====================
export const incidentAPI = {
  // Get all incidents with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.search) params.append("search", filters.search);

      const queryString = params.toString();
      const response = await api.get(
        `/api/incidents${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get incident by ID
  getById: async (id) => {
    try {
      console.log("Fetching incident by ID:", id);
      const response = await api.get(`/api/incidents/${id}`);
      console.log("Raw API response for incident:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in getById:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create new incident
  create: async (incidentData) => {
    try {
      // Make sure we're sending the correct field names that match the backend
      const backendData = {
        s_incident_number: incidentData.incidentNumber || incidentData.s_incident_number,
        s_title: incidentData.title || incidentData.s_title,
        dt_incident: incidentData.dateTime ? incidentData.dateTime.toISOString() : incidentData.dt_incident,
        s_location: incidentData.location || incidentData.s_location,
        e_incident_type: incidentData.type || incidentData.e_incident_type,
        e_severity: incidentData.severity || incidentData.e_severity,
        s_reporter_name: incidentData.reporterName || incidentData.s_reporter_name,
        t_description: incidentData.description || incidentData.t_description,
        s_latitude: incidentData.latitude || incidentData.s_latitude || null,
        s_longitude: incidentData.longitude || incidentData.s_longitude || null
      };

      console.log("Sending to backend:", backendData);
      const response = await api.post("/api/incidents", backendData);
      return response.data;
    } catch (error) {
      console.error("Create error:", error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Update incident
  update: async (id, incidentData) => {
    try {
      const backendData = {
        s_title: incidentData.title || incidentData.s_title,
        dt_incident: incidentData.dateTime ? incidentData.dateTime.toISOString() : incidentData.dt_incident,
        s_location: incidentData.location || incidentData.s_location,
        e_incident_type: incidentData.type || incidentData.e_incident_type,
        e_severity: incidentData.severity || incidentData.e_severity,
        e_status: incidentData.status || incidentData.e_status,
        s_reporter_name: incidentData.reporterName || incidentData.s_reporter_name,
        t_description: incidentData.description || incidentData.t_description,
        s_latitude: incidentData.latitude || incidentData.s_latitude || null,
        s_longitude: incidentData.longitude || incidentData.s_longitude || null
      };

      const response = await api.put(`/api/incidents/${id}`, backendData);
      return response.data;
    } catch (error) {
      console.error("Update error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete incident (soft delete)
  delete: async (id) => {
    try {
      const response = await api.delete(`/api/incidents/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update incident status only
  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/api/incidents/${id}/status`, { e_status: status });
      return response.data;
    } catch (error) {
      console.error("Update status error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get incident statistics for dashboard
  getStats: async () => {
    try {
      const response = await api.get("/api/incidents/stats");
      return response.data;
    } catch (error) {
      console.error("Error in getStats:", error);
      throw error.response?.data || error.message;
    }
  },
};

// ==================== AFFECTED PERSONS ====================
export const affectedPersonAPI = {
  // Get all persons for an incident
  getByIncidentId: async (incidentId) => {
    try {
      const response = await api.get(`/api/incidents/${incidentId}/persons`);
      return response.data;
    } catch (error) {
      console.error("Error in getByIncidentId:", error);
      throw error.response?.data || error.message;
    }
  },

  // Create affected person
  create: async (incidentId, personData) => {
    try {
      const backendData = {
        s_full_name: personData.fullName || personData.s_full_name || personData.name,
        e_person_type: personData.personType || personData.e_person_type || personData.type,
        s_department: personData.department || personData.s_department || null,
        s_outcome_description: personData.outcomeDescription || personData.s_outcome_description || personData.outcome || null
      };

      const response = await api.post(`/api/incidents/${incidentId}/persons`, backendData);
      return response.data;
    } catch (error) {
      console.error("Error creating person:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update affected person
  update: async (personId, personData) => {
    try {
      const backendData = {
        s_full_name: personData.fullName || personData.s_full_name,
        e_person_type: personData.personType || personData.e_person_type,
        s_department: personData.department || personData.s_department,
        s_outcome_description: personData.outcomeDescription || personData.s_outcome_description
      };

      const response = await api.put(`/api/persons/${personId}`, backendData);
      return response.data;
    } catch (error) {
      console.error("Error updating person:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete affected person
  delete: async (personId) => {
    try {
      const response = await api.delete(`/api/persons/${personId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting person:", error);
      throw error.response?.data || error.message;
    }
  },
};

// ==================== BODY PARTS ====================
export const bodyPartAPI = {
  // Get all body parts (for dropdown)
  getAll: async () => {
    try {
      console.log("Fetching body parts from /api/incidents/body-parts");
      const response = await api.get("/api/incidents/body-parts");
      console.log("Body parts fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching body parts:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get body parts for a specific person
  getByPersonId: async (personId) => {
    try {
      const response = await api.get(`/api/persons/${personId}/body-parts`);
      return response.data;
    } catch (error) {
      console.error("Error in getByPersonId:", error);
      throw error.response?.data || error.message;
    }
  },

  // Add body part to person
  addToPerson: async (personId, bodyPartId) => {
    try {
      const response = await api.post(`/api/persons/${personId}/body-parts`, {
        body_part_id: bodyPartId,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding body part:", error);
      throw error.response?.data || error.message;
    }
  },

  // Remove body part from person
  removeFromPerson: async (personId, bodyPartId) => {
    try {
      const response = await api.delete(
        `/api/persons/${personId}/body-parts/${bodyPartId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing body part:", error);
      throw error.response?.data || error.message;
    }
  },
};

// ==================== INCIDENT IMAGES ====================
export const incidentImageAPI = {
  // Get all images for an incident
  getByIncidentId: async (incidentId) => {
    try {
      const response = await api.get(`/api/incidents/${incidentId}/images`);
      return response.data;
    } catch (error) {
      console.error("Error in getByIncidentId:", error);
      throw error.response?.data || error.message;
    }
  },

  // Add image to incident
  add: async (incidentId, imageFile, caption = "") => {
    try {
      const formData = new FormData();
      
      // Handle React Native FormData append for file
      formData.append("image", {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || `image_${Date.now()}.jpg`,
      });

      if (caption) {
        formData.append("s_caption", caption);
      }

      const response = await api.post(
        `/api/incidents/${incidentId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update image caption
  updateCaption: async (imageId, caption) => {
    try {
      const response = await api.put(`/api/images/${imageId}`, {
        s_caption: caption,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating image caption:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete image
  delete: async (imageId) => {
    try {
      const response = await api.delete(`/api/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error.response?.data || error.message;
    }
  },
};

// ==================== INCIDENT DOCUMENTS ====================
export const incidentDocumentAPI = {
  // Get all documents for an incident
  getByIncidentId: async (incidentId) => {
    try {
      const response = await api.get(`/api/incidents/${incidentId}/documents`);
      return response.data;
    } catch (error) {
      console.error("Error in getByIncidentId:", error);
      throw error.response?.data || error.message;
    }
  },

  // Add document to incident
  add: async (incidentId, documentFile, fileData = {}) => {
    try {
      const formData = new FormData();
      
      // Handle React Native FormData append for file
      formData.append("document", {
        uri: documentFile.uri,
        type: documentFile.type || 'application/octet-stream',
        name: documentFile.name || `document_${Date.now()}`,
      });

      if (fileData.s_file_name) {
        formData.append("s_file_name", fileData.s_file_name);
      }
      if (fileData.s_file_type) {
        formData.append("s_file_type", fileData.s_file_type);
      }
      if (fileData.i_file_size) {
        formData.append("i_file_size", fileData.i_file_size.toString());
      }

      const response = await api.post(
        `/api/incidents/${incidentId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error.response?.data || error.message;
    }
  },

  // Delete document
  delete: async (documentId) => {
    try {
      const response = await api.delete(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error.response?.data || error.message;
    }
  }
};