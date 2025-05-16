import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
};

type AuthContextType = {
  adminUser: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load admin session from SecureStore on app start
    const loadAdminSession = async () => {
      try {
        setIsLoading(true);
        const sessionData = await SecureStore.getItemAsync('adminSession');
        
        if (sessionData) {
          const admin = JSON.parse(sessionData);
          
          // Verify the admin still exists
          const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('id', admin.id)
            .eq('email', admin.email)
            .single();

          if (data && !error) {
            setAdminUser(data);
          } else {
            // Invalid session, clear it
            await SecureStore.deleteItemAsync('adminSession');
            setAdminUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading admin session:', error);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Query admin user
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        throw new Error('Invalid credentials');
      }

      // Update last login time
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      // Store session
      await SecureStore.setItemAsync('adminSession', JSON.stringify(data));
      setAdminUser(data);
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await SecureStore.deleteItemAsync('adminSession');
      setAdminUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};