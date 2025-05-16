import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

type StatsData = {
  newUsers: number;
  emails: number;
  revenue: number;
};

async function fetchActiveUsers() {
  try {
    // Query for active Microsoft subscriptions
    const { count: microsoftCount, error: microsoftError } = await supabase
      .from('microsoft_subscriptions')
      .select('count', { count: 'exact' })
      .eq('active', true)
      .is('disabled_at', null);

    // Query for active Google subscriptions
    const { count: googleCount, error: googleError } = await supabase
      .from('google_subscriptions')
      .select('count', { count: 'exact' })
      .eq('active', true)
      .is('disabled_at', null);

    if (microsoftError) throw microsoftError;
    if (googleError) throw googleError;

    return {
      microsoftCount: microsoftCount || 0,
      googleCount: googleCount || 0,
      totalCount: (microsoftCount || 0) + (googleCount || 0)
    };
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: activeUsers, isLoading: isLoadingActiveUsers, error: activeUsersError, refetch: refetchActiveUsers } = useQuery({
    queryKey: ['active-users'],
    queryFn: fetchActiveUsers
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchActiveUsers();
    setRefreshing(false);
  }, [refetchActiveUsers]);

  // Sample data for charts
  const emailData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: [250, 320, 280, 410],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green color
        strokeWidth: 2
      }
    ],
    legend: ['Emails']
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [2000, 4500, 2800, 5100, 4200, 6300],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue color
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#1E2937',
    backgroundGradientTo: '#1A2333',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#10B981'
    }
  };

  const renderStat = (title: string, value: string | number, iconName: any, color: string) => (
    <View className="bg-primary-light rounded-xl p-4 mb-4">
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Ionicons name={iconName} size={20} color={color} />
        </View>
        <View className="ml-3">
          <Text className="text-gray-400 text-sm">{title}</Text>
          <Text className="text-white text-xl font-bold">{value}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['bottom']}>
      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        <Text className="text-white text-xl font-bold mt-4 mb-6">Dashboard Overview</Text>
        
        {/* Active Users Section */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Active Users</Text>
          {activeUsersError ? (
            <View className="bg-red-900/30 p-4 rounded-xl">
              <Text className="text-red-400">Error loading users: {String(activeUsersError)}</Text>
            </View>
          ) : isLoadingActiveUsers ? (
            <View className="items-center p-4">
              <ActivityIndicator color="#10B981" />
              <Text className="text-gray-400 mt-2">Loading user data...</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              <View className="w-1/2 pr-2">
                {renderStat('Total Users', activeUsers?.totalCount || 0, 'people', '#10B981')}
              </View>
              <View className="w-1/2 pl-2">
                {renderStat('Microsoft', activeUsers?.microsoftCount || 0, 'mail', '#3B82F6')}
              </View>
              <View className="w-full">
                {renderStat('Google', activeUsers?.googleCount || 0, 'mail-open', '#EF4444')}
              </View>
            </View>
          )}
        </View>

        {/* Email Stats */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Email Statistics</Text>
          <View className="bg-primary-light rounded-xl p-4 mb-4">
            <Text className="text-white mb-2">Emails Processed (Last 30 days)</Text>
            <LineChart
              data={emailData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        </View>

        {/* Revenue Stats */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Revenue</Text>
          <View className="bg-primary-light rounded-xl p-4 mb-4">
            <Text className="text-white mb-2">Monthly Revenue ($)</Text>
            <BarChart
              data={revenueData}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="$"
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        </View>

        {/* Daily Stats */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Today's Stats</Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2">
              {renderStat('New Users', 8, 'person-add', '#10B981')}
            </View>
            <View className="w-1/2 pl-2">
              {renderStat('Emails', 156, 'mail', '#8B5CF6')}
            </View>
            <View className="w-full">
              {renderStat('Revenue', '$528.50', 'cash', '#F59E0B')}
            </View>
          </View>
        </View>

        {/* Extra space at bottom */}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}