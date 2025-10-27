/**
 * API Client for MedMate Backend
 * Handles all HTTP requests to the Flask backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');

interface ApiError {
  error: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.requestWithTimeout(endpoint, options, 10000); // Default 10 second timeout
  }

  private async requestWithTimeout<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 10000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const isFormData = options.body instanceof FormData;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Important for session cookies
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as ApiError).error || 'Request failed');
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('The request is taking longer than expected. Please try again.');
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication
  async register(username: string, email: string, password: string) {
    return this.request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string) {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/api/logout', { method: 'POST' });
  }

  async checkAuth() {
    return this.requestWithTimeout('/api/check-auth', {}, 5000); // 5 second timeout for fast auth check
  }

  async forgotPassword(email: string) {
    return this.request('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request('/api/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Diagnosis
  async diagnose(symptoms: string) {
    return this.requestWithTimeout('/api/diagnose', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    }, 60000); // 60 second timeout for diagnosis
  }

  async diagnoseImage(image: File, symptoms?: string) {
    const formData = new FormData();
    formData.append('image', image);
    if (symptoms) formData.append('symptoms', symptoms);

    // Use longer timeout for image analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for AI processing

    try {
      const response = await fetch(`${this.baseUrl}/api/diagnose-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Image analysis failed');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Image analysis timeout - please try again');
        }
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async getDiagnosisHistory(page = 1, perPage = 10) {
    return this.requestWithTimeout(`/api/diagnosis-history?page=${page}&per_page=${perPage}`, {}, 30000); // 30 second timeout
  }

  // Chat
  async sendChatMessage(message: string) {
    return this.requestWithTimeout('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, 30000); // 30 second timeout for chat
  }

  async getChatHistory(page = 1, perPage = 20) {
    return this.requestWithTimeout(`/api/chat-history?page=${page}&per_page=${perPage}`, {}, 30000); // 30 second timeout
  }

  // Hospital Finder
  async geocodeCity(city: string) {
    return this.request('/api/geocode-city', {
      method: 'POST',
      body: JSON.stringify({ city }),
    });
  }

  async findNearbyHospitals(latitude: number, longitude: number, radius = 5000) {
    return this.request('/api/nearby-hospitals', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, radius }),
    });
  }

  async getHospitalDetails(placeId: string) {
    return this.request(`/api/hospital-details/${placeId}`);
  }

  // Voice
  async voiceToText(text: string) {
    return this.request('/api/voice-to-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async textToSpeech(text: string) {
    return this.request('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getVoiceStatus() {
    return this.request('/api/voice/status');
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Profile Management
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(data: { username?: string; email?: string }) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return this.requestWithTimeout('/api/profile/picture', {
      method: 'POST',
      body: formData,
    }, 30000);
  }

  // Settings
  async deleteChatHistory() {
    return this.request('/api/settings/delete-chat-history', {
      method: 'DELETE',
    });
  }

  async deleteDiagnosisHistory() {
    return this.request('/api/settings/delete-diagnosis-history', {
      method: 'DELETE',
    });
  }

  // Feedback
  async submitFeedback(name: string, email: string, message: string) {
    return this.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ name, email, message }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
