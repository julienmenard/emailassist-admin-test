import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

type UserWithSubscription = {
  id: string;
  email: string;
  name: string | null;
  plan_type: string | null;
  subscription_id: string | null;
  expiration_date: string | null;
  active: boolean | null;
  created_at: string;
};

export default function UsersScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'microsoft'>('google');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Google users with their subscriptions
  const { data: googleUsers, isLoading: loadingGoogle, error: googleError, refetch: refetchGoogle } = useQuery({
    queryKey: ['google-users-mobile'],
    queryFn: async () => {
      // First query to get basic user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          created_at,
          user_pricing_plans!inner(plan_type),
          google_users(google_email)
        `)
        .not('google_users', 'is', null);

      if (userError) throw userError;

      // Now get subscription data for these users
      const processedUsers = await Promise.all(userData.map(async (user) => {
        // First try to get an active subscription
        const { data: activeSubscriptions, error: activeError } = await supabase
          .from('google_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (activeError) throw activeError;

        // If no active subscription, get the most recent one
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          const { data: recentSubscriptions, error: recentError } = await supabase
            .from('google_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentError) throw recentError;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
            plan_type: user.user_pricing_plans?.plan_type,
            google_email: user.google_users[0]?.google_email || null,
            subscription_id: recentSubscriptions?.[0]?.subscription_id || null,
            expiration_date: recentSubscriptions?.[0]?.expiration_date || null,
            active: recentSubscriptions?.[0]?.active || false,
            subscription_created_at: recentSubscriptions?.[0]?.created_at || null
          };
        }

        // Return user with active subscription
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          plan_type: user.user_pricing_plans?.plan_type,
          google_email: user.google_users[0]?.google_email || null,
          subscription_id: activeSubscriptions[0]?.subscription_id || null,
          expiration_date: activeSubscriptions[0]?.expiration_date || null,
          active: activeSubscriptions[0]?.active || false,
          subscription_created_at: activeSubscriptions[0]?.created_at || null
        };
      }));

      return processedUsers;
    }
  });

  // Fetch Microsoft users with their subscriptions
  const { data: microsoftUsers, isLoading: loadingMicrosoft, error: microsoftError, refetch: refetchMicrosoft } = useQuery({
    queryKey: ['microsoft-users-mobile'],
    queryFn: async () => {
      // First query to get basic user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          created_at,
          user_pricing_plans!inner(plan_type),
          microsoft_users(microsoft_email)
        `)
        .not('microsoft_users', 'is', null);

      if (userError) throw userError;

      // Now get subscription data for these users
      const processedUsers = await Promise.all(userData.map(async (user) => {
        // First try to get an active subscription
        const { data: activeSubscriptions, error: activeError } = await supabase
          .from('microsoft_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (activeError) throw activeError;

        // If no active subscription, get the most recent one
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          const { data: recentSubscriptions, error: recentError } = await supabase
            .from('microsoft_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentError) throw recentError;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at,
            plan_type: user.user_pricing_plans?.plan_type,
            microsoft_email: user.microsoft_users[0]?.microsoft_email || null,
            subscription_id: recentSubscriptions?.[0]?.subscription_id || null,
            expiration_date: recentSubscriptions?.[0]?.expiration_date || null,
            active: recentSubscriptions?.[0]?.active || false,
            subscription_created_at: recentSubscriptions?.[0]?.created_at || null
          };
        }

        // Return user with active subscription
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          plan_type: user.user_pricing_plans?.plan_type,
          microsoft_email: user.microsoft_users[0]?.microsoft_email || null,
          subscription_id: activeSubscriptions[0]?.subscription_id || null,
          expiration_date: activeSubscriptions[0]?.expiration_date || null,
          active: activeSubscriptions[0]?.active || false,
          subscription_created_at: activeSubscriptions[0]?.created_at || null
        };
      }));

      return processedUsers;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'google') {
      await refetchGoogle();
    } else {
      await refetchMicrosoft();
    }
    setRefreshing(false);
  };

  // Filter users based on search term
  const filterUsers = (users: any[] | undefined) => {
    if (!users) return [];
    if (!searchTerm.trim()) return users;

    const normalizedSearch = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      user.id?.toLowerCase().includes(normalizedSearch) ||
      user.email?.toLowerCase().includes(normalizedSearch) || 
      user.name?.toLowerCase().includes(normalizedSearch) ||
      user.subscription_id?.toLowerCase().includes(normalizedSearch)
    );
  };

  const filteredGoogleUsers = filterUsers(googleUsers);
  const filteredMicrosoftUsers = filterUsers(microsoftUsers);

  const renderUserItem = ({ item }: { item: any }) => {
    const providerEmail = activeTab === 'google' ? item.google_email : item.microsoft_email;
    
    return (
      <View className="bg-primary-light rounded-xl p-4 mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-white font-medium text-base">{item.name || 'Unnamed User'}</Text>
            <Text className="text-gray-400 text-sm">{item.email}</Text>
            {providerEmail && (
              <Text className="text-blue-400 text-xs mt-1">
                {activeTab === 'google' ? 'Google' : 'Microsoft'} Email: {providerEmail}
              </Text>
            )}
          </View>
          <View className={`
            px-2 py-1 rounded-full ${
              item.plan_type === 'free' ? 'bg-gray-700' :
              item.plan_type === 'individual' ? 'bg-blue-900/50' :
              item.plan_type === 'enterprise' ? 'bg-purple-900/50' :
              'bg-gray-700'
            }
          `}>
            <Text className={`
              text-xs font-medium ${
                item.plan_type === 'free' ? 'text-gray-300' :
                item.plan_type === 'individual' ? 'text-blue-300' :
                item.plan_type === 'enterprise' ? 'text-purple-300' :
                'text-gray-300'
              }
            `}>
              {item.plan_type || 'No Plan'}
            </Text>
          </View>
        </View>
        
        <View className="border-t border-gray-700 pt-2 mt-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-gray-400 text-sm">Subscription:</Text>
            <View className="flex-row items-center">
              {item.active ? (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="text-green-400 text-sm ml-1">Active</Text>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text className="text-red-400 text-sm ml-1">Inactive</Text>
                </View>
              )}
            </View>
          </View>
          
          {item.subscription_id && (
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-400 text-sm">ID:</Text>
              <Text className="text-gray-300 text-xs">{item.subscription_id.substring(0, 20)}...</Text>
            </View>
          )}
          
          {item.expiration_date && (
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-sm">Expires:</Text>
              <Text className={`
                text-sm ${new Date(item.expiration_date) < new Date() ? 'text-red-400' : 'text-green-400'}
              `}>
                {format(parseISO(item.expiration_date), 'MMM d, yyyy')}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const isLoading = activeTab === 'google' ? loadingGoogle : loadingMicrosoft;
    const error = activeTab === 'google' ? googleError : microsoftError;
    const users = activeTab === 'google' ? filteredGoogleUsers : filteredMicrosoftUsers;

    if (error) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-red-400 text-center mt-4">
            Error loading users: {String(error)}
          </Text>
        </View>
      );
    }

    if (isLoading && users.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-400 mt-4">Loading users...</Text>
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="people" size={48} color="#4B5563" />
          <Text className="text-gray-400 text-center mt-4">
            {searchTerm ? `No ${activeTab} users matching "${searchTerm}"` : `No ${activeTab} users found`}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['bottom']}>
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center bg-primary-light rounded-lg px-3 py-2 mb-4">
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            className="flex-1 text-white ml-2"
            placeholder="Search users..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="flex-row mb-4">
          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-l-lg ${activeTab === 'google' ? 'bg-red-900/30' : 'bg-primary-light'}`}
            onPress={() => setActiveTab('google')}
          >
            <Text className={`${activeTab === 'google' ? 'text-red-400' : 'text-gray-400'} font-medium`}>
              Google Users
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-r-lg ${activeTab === 'microsoft' ? 'bg-blue-900/30' : 'bg-primary-light'}`}
            onPress={() => setActiveTab('microsoft')}
          >
            <Text className={`${activeTab === 'microsoft' ? 'text-blue-400' : 'text-gray-400'} font-medium`}>
              Microsoft Users
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}