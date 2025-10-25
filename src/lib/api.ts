/**
 * API Client for MedMate Backend
 * Handles all HTTP requests to the Flask backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
          throw new Error('Request timeout - please try again');
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
    return this.request('/api/check-auth');
  }

  // Diagnosis
  async diagnose(symptoms: string) {
    return this.request('/api/diagnose', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
  }

  async diagnoseImage(image: File, symptoms?: string) {
    const formData = new FormData();
    formData.append('image', image);
    if (symptoms) formData.append('symptoms', symptoms);

    return fetch(`${this.baseUrl}/api/diagnose-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(res => res.json());
  }

  async getDiagnosisHistory(page = 1, perPage = 10) {
    return this.request(`/api/diagnosis-history?page=${page}&per_page=${perPage}`);
  }

  // Chat
  async sendChatMessage(message: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory(page = 1, perPage = 20) {
    return this.request(`/api/chat-history?page=${page}&per_page=${perPage}`);
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
}

export const api = new ApiClient(API_BASE_URL);
