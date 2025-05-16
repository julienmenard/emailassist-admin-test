import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoadingScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-primary">
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#10B981" />
      <Text className="text-white mt-4">Loading...</Text>
    </View>
  );
}