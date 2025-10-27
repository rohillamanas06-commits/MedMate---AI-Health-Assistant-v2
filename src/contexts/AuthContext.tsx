import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  profile_picture_url?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface StoredCredentials {
  username: string;
  password: string;
}

const STORAGE_KEY = 'medmate_remember_me';
const MAX_STORAGE_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const tryAutoLogin = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const credentials: StoredCredentials = JSON.parse(stored);
      
      // Check if stored data is not expired
      if (!credentials.username || !credentials.password) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Attempt auto-login
      const response: any = await api.login(credentials.username, credentials.password, true);
      setUser(response.user);
      console.log('✅ Auto-login successful');
    } catch (error) {
      // If auto-login fails, clear stored credentials
      localStorage.removeItem(STORAGE_KEY);
      console.log('Auto-login failed, credentials cleared');
    }
  };

  const checkAuth = async () => {
    try {
      const response: any = await api.checkAuth();
      if (response.authenticated) {
        setUser(response.user);
      } else {
        setUser(null);
        // Try auto-login if credentials are stored
        await tryAutoLogin();
      }
    } catch (error) {
      setUser(null);
      // Try auto-login on error
      await tryAutoLogin();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    try {
      const response: any = await api.login(username, password, rememberMe);
      setUser(response.user);
      
      // Store credentials in localStorage if rememberMe is true
      if (rememberMe) {
        const credentials: StoredCredentials = { username, password };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
        console.log('✅ Credentials stored for auto-login');
      }
      
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response: any = await api.register(username, email, password);
      setUser(response.user);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      // Clear stored credentials
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Credentials cleared on logout');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
