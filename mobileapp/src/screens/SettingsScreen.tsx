import React from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { adminUser, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => signOut()
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['bottom']}>
      <ScrollView>
        <View className="p-4">
          <Text className="text-white text-xl font-bold mb-6">Settings</Text>

          {/* Profile Section */}
          <View className="bg-primary-light rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View className="ml-3">
                <Text className="text-white font-medium text-lg">
                  {adminUser?.email.split('@')[0] || 'Admin'}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {adminUser?.email || 'admin@example.com'}
                </Text>
              </View>
            </View>
            <View className="border-t border-gray-700 pt-3 flex-row justify-between">
              <Text className="text-gray-400">Last login</Text>
              <Text className="text-white">
                {adminUser?.last_login 
                  ? new Date(adminUser.last_login).toLocaleString() 
                  : 'Never'}
              </Text>
            </View>
          </View>

          {/* Appearance Section */}
          <Text className="text-white text-lg font-medium mb-2">Appearance</Text>
          <View className="bg-primary-light rounded-xl overflow-hidden mb-6">
            <View className="p-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="moon" size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#4B5563', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Notifications Section */}
          <Text className="text-white text-lg font-medium mb-2">Notifications</Text>
          <View className="bg-primary-light rounded-xl overflow-hidden mb-6">
            <View className="p-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="notifications" size={20} color="#94A3B8" />
                <Text className="text-white ml-3">System Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#4B5563', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* App Info Section */}
          <Text className="text-white text-lg font-medium mb-2">App Info</Text>
          <View className="bg-primary-light rounded-xl overflow-hidden mb-6">
            <View className="p-4 border-b border-gray-700">
              <Text className="text-white">Version</Text>
              <Text className="text-gray-400 text-sm">1.0.0</Text>
            </View>
            <View className="p-4">
              <Text className="text-white">Environment</Text>
              <Text className="text-gray-400 text-sm">Production</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-900/50 py-4 rounded-xl items-center"
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="text-red-400 font-medium ml-2">Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}