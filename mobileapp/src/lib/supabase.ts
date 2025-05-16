import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Supabase connection URL and anon key from environment variables
const supabaseUrl = 'https://jfrmebqkjxgajiaalait.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmcm1lYnFranhnYWppYWFsYWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzY4MDEsImV4cCI6MjA1NjQxMjgwMX0.HYtusrontJDdo9_u-QvkVLBFd7PQl7nXD9_SXdtRoek';

// Custom storage implementation using Expo SecureStore and AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});