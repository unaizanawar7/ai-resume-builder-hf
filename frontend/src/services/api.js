/**
 * API Service - Handles all API calls to the backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Resume API endpoints
 */
export const resumeAPI = {
  /**
   * Upload and parse a resume file
   */
  parseResume: async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post('/resume/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Get layout recommendation
   */
  recommendLayout: async (resumeData, targetRole = '') => {
    const response = await api.post('/resume/recommend-layout', {
      resumeData,
      targetRole,
    });
    
    return response.data;
  },

  /**
   * Generate enhanced resume content
   */
  generateResume: async (resumeData, targetRole = '', targetIndustry = '') => {
    const response = await api.post('/resume/generate', {
      resumeData,
      targetRole,
      targetIndustry,
    });
    
    return response.data;
  },

  /**
   * Export resume as PDF
   */
  exportPDF: async (resumeData, layoutStyle = 'modern') => {
    const response = await api.post('/resume/export/pdf', {
      resumeData,
      layoutStyle,
    }, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export resume as PDF and return blob for preview
   */
  exportPDFBlob: async (resumeData, layoutStyle = 'modern') => {
    const response = await api.post('/resume/export/pdf', {
      resumeData,
      layoutStyle,
    }, {
      responseType: 'blob',
    });
    
    return new Blob([response.data], { type: 'application/pdf' });
  },

  /**
   * Export resume as DOCX
   */
  exportDOCX: async (resumeData) => {
    const response = await api.post('/resume/export/docx', {
      resumeData,
    }, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resume.txt');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get improvement suggestions for a section
   */
  improveSectionRequest: async (section, sectionType) => {
    const response = await api.post('/resume/improve', {
      section,
      sectionType,
    });
    
    return response.data;
  },

  /**
   * Upload an image file
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/resume/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Save resume to database
   */
  saveResume: async (resumeData) => {
    const response = await api.post('/resume/save', resumeData);
    return response.data;
  },

  /**
   * Get all user resumes
   */
  listResumes: async () => {
    const response = await api.get('/resume/list');
    return response.data;
  },

  /**
   * Get specific resume by ID
   */
  getResume: async (id) => {
    const response = await api.get(`/resume/${id}`);
    return response.data;
  },

  /**
   * Update resume
   */
  updateResume: async (id, resumeData) => {
    const response = await api.put(`/resume/${id}`, resumeData);
    return response.data;
  },

  /**
   * Delete resume
   */
  deleteResume: async (id) => {
    const response = await api.delete(`/resume/${id}`);
    return response.data;
  },

  /**
   * Parse job circular (PDF upload or text)
   */
  parseJobCircular: async (text, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('jobCircular', file);
      
      const response = await api.post('/resume/parse-job-circular', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await api.post('/resume/parse-job-circular', { text });
      return response.data;
    }
  },

  /**
   * Generate personalized interview questions
   */
  generateQuestions: async (resumeData, jobDescription = '') => {
    const response = await api.post('/resume/generate-questions', {
      resumeData,
      jobDescription,
    });
    return response.data;
  },

  /**
   * Generate tailored resume
   */
  tailorResume: async (resumeData, jobDescription, interviewResponses) => {
    const response = await api.post('/resume/tailor', {
      resumeData,
      jobDescription,
      interviewResponses,
    });
    return response.data;
  },

  /**
   * Check for missing required fields
   */
  checkMissingFields: async (resumeData, templateId) => {
    const response = await api.post('/resume/check-missing-fields', {
      resumeData,
      templateId,
    });
    return response.data;
  },

  /**
   * Populate missing fields with AI
   */
  populateMissingFields: async (resumeData, templateId, missingFields) => {
    const response = await api.post('/resume/populate-missing-fields', {
      resumeData,
      templateId,
      missingFields,
    });
    return response.data;
  },

  /**
   * Get template configuration
   */
  getTemplateConfig: async (templateId) => {
    const response = await api.get(`/templates/${templateId}/config`);
    return response.data;
  },

  /**
   * Get available templates with configs
   */
  getAvailableTemplates: async () => {
    const response = await api.get('/templates/available');
    return response.data;
  },

  /**
   * Customize resume with template-agnostic system
   */
  customizeResume: async (templateId, resumeData, customizations) => {
    try {
      const response = await api.post('/resume/customize', {
        templateId,
        resumeData,
        customizations
      }, {
        responseType: 'blob'
      });
      
      // Check if response is actually an error JSON blob
      if (response.status >= 400 || response.headers['content-type']?.includes('application/json')) {
        const errorText = await new Response(response.data).text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to customize resume');
        } catch {
          throw new Error(errorText || 'Failed to customize resume');
        }
      }
      
      return response.data;
    } catch (error) {
      // If axios throws an error, check if it has response data
      if (error.response && error.response.data instanceof Blob) {
        const errorText = await error.response.data.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to customize resume');
        } catch {
          throw new Error(errorText || error.message || 'Failed to customize resume');
        }
      }
      throw error;
    }
  },

  /**
   * Get resume preview with customizations
   */
  getResumePreview: async (templateId, resumeData, customizations) => {
    const response = await api.post('/resume/customize', {
      templateId,
      resumeData,
      customizations
    }, {
      responseType: 'blob'
    });
    return new Blob([response.data], { type: 'application/pdf' });
  },

  /**
   * Extract placeholders from template
   */
  extractPlaceholders: async (templateId) => {
    const response = await api.post('/resume/extract-placeholders', {
      templateId
    });
    return response.data;
  },
};

/**
 * AI API endpoints
 */
export const aiAPI = {
  /**
   * Send message to career coach
   */
  chat: async (message, conversationHistory = [], resumeData = {}) => {
    console.log('📤 Frontend: Sending chat message:', { message, conversationHistory: conversationHistory.length, resumeData: Object.keys(resumeData) });
    const response = await api.post('/ai/chat', {
      message,
      conversationHistory,
      resumeData,
    });
    console.log('📥 Frontend: Received response:', response.data);
    return response.data;
  },

  /**
   * Check AI service health
   */
  healthCheck: async () => {
    const response = await api.get('/ai/health');
    return response.data;
  },
};

/**
 * Auth API endpoints
 */
export const authAPI = {
  /**
   * Sign up new user
   */
  signup: async (fullName, email, password) => {
    const response = await api.post('/auth/signup', {
      fullName,
      email,
      password,
    });
    
    // Store token in localStorage
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    
    // Store token in localStorage
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default {
  resumeAPI,
  aiAPI,
  authAPI,
};
