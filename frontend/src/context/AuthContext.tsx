import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    password_confirm: string;
    name: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('turna_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const toast = useToast();

  const syncUserFromStorage = useCallback(() => {
    const saved = localStorage.getItem('turna_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('turna_auth_change', syncUserFromStorage);
    return () => window.removeEventListener('turna_auth_change', syncUserFromStorage);
  }, [syncUserFromStorage]);

  // Check profile on load if access token exists
  useEffect(() => {
    const token = localStorage.getItem('turna_access_token');
    if (token) {
      api
        .getProfile()
        .then((profile) => {
          setUser(profile);
          localStorage.setItem('turna_user', JSON.stringify(profile));
        })
        .catch(() => {
          // Token is expired or invalid
          setUser(null);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setIsAuthModalOpen(false);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`, 'You have successfully signed in.');
    } catch (err: any) {
      toast.error('Sign In Failed', err.message || 'Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    password_confirm: string;
    name: string;
    phone: string;
  }) => {
    setIsLoading(true);
    try {
      const data = await api.register(payload);
      setUser(data.user);
      setIsAuthModalOpen(false);
      toast.success(`Welcome to Turna, ${data.user.name || data.user.email}!`, 'Your account has been created.');
    } catch (err: any) {
      toast.error('Registration Failed', err.message || 'Could not complete registration.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    toast.info('Signed Out', 'You have been safely signed out.');
  };

  const updateProfile = async (payload: Partial<User>) => {
    setIsLoading(true);
    try {
      const updated = await api.updateProfile(payload);
      setUser(updated);
      toast.success('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update profile.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAuthenticated = !!user && !!localStorage.getItem('turna_access_token');
  const isStaff = !!user?.is_staff;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isStaff,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
