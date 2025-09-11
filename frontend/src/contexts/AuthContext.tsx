import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; name: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user } = response.data;

      // Build user object from backend response
      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'superuser' | 'manager' | 'user',
        is_active: user.is_validated, // ✅ map backend is_validated → frontend is_active
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.msg || 'Invalid credentials');
    }
  };

  const register = async (data: { email: string; name: string; password: string }) => {
    try {
      const response = await authAPI.register(data);

      console.log('Registration successful:', response.data);

      // If registration requires validation, don't auto-login
      if (response.data.msg?.includes('validation') || response.data.is_active === false) {
        throw new Error('Account created successfully. Please wait for admin validation before logging in.');
      }

      // If backend also returns token + user, auto-login
      if (response.data.access_token && response.data.user) {
        const { access_token, user } = response.data;

        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'superuser' | 'manager' | 'user',
          is_active: user.is_validated,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.msg || error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    authAPI.logout().catch(console.error);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
