import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Authentication Failed', 'Invalid email or password');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center px-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-accent rounded-full items-center justify-center mb-4">
                <Ionicons name="mail" size={32} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold">
                EmailAssist.ai Admin
              </Text>
              <Text className="text-gray-400 mt-2">
                Sign in to access the admin dashboard
              </Text>
            </View>

            <View className="bg-primary-light rounded-xl p-6 mb-6">
              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">Email</Text>
                <View className="flex-row items-center bg-primary border border-gray-700 rounded-lg px-4 py-3">
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                  <TextInput
                    className="flex-1 text-white ml-2"
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">Password</Text>
                <View className="flex-row items-center bg-primary border border-gray-700 rounded-lg px-4 py-3">
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                  <TextInput
                    className="flex-1 text-white ml-2"
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`rounded-lg py-4 items-center ${
                  isSubmitting ? 'bg-accent/70' : 'bg-accent'
                }`}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}