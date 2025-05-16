import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

type EdgeFunctionLog = {
  id: string;
  function_name: string;
  created_at: string;
  status: number;
  method: string;
  execution_time: number;
  error?: string;
  user_id?: string;
};

// Available edge functions
const edgeFunctions = [
  'stripe-webhook',
  'create-checkout',
  'get-invoice',
  'cancel-subscription',
  'deactivate-google-subscription',
  'create-google-subscription',
  'google-api-manage-mail-sub-pub',
  'google-create-subscription',
  'google-users',
  'microsoft_oauth2_token_exchange_dv',
  'microsoft_refresh_oauth2_token_dv',
  'refresh_mail_subscription_upon_microsoft_notification_dv',
  'check_microsoft_subscription_expiration_dv',
  'openai-tiktoken',
  'emailassist-microsoft-prio',
  'sendMailjetEmail',
];

export default function LogsScreen() {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch today's errors
  const { data: errorLogs, isLoading: loadingErrors, error: errorsError, refetch: refetchErrors } = useQuery({
    queryKey: ['daily-error-logs'],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString())
        .not('error', 'is', null)
        .neq('status', 200)  // Exclude logs with status 200
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EdgeFunctionLog[];
    }
  });

  // Fetch logs for selected function
  const { data: functionLogs, isLoading: loadingFunctionLogs, error: functionLogsError, refetch: refetchFunctionLogs } = useQuery({
    queryKey: ['function-logs', selectedFunction],
    queryFn: async () => {
      if (!selectedFunction) return [];
      
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .eq('function_name', selectedFunction)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as EdgeFunctionLog[];
    },
    enabled: !!selectedFunction
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchErrors();
    if (selectedFunction) {
      await refetchFunctionLogs();
    }
    setRefreshing(false);
  };

  const renderFunctionOption = ({ item }: { item: string }) => (
    <TouchableOpacity
      className={`py-2 px-3 mr-2 rounded-lg ${selectedFunction === item ? 'bg-accent' : 'bg-primary-light'}`}
      onPress={() => setSelectedFunction(item)}
    >
      <Text className={`${selectedFunction === item ? 'text-white' : 'text-gray-400'}`}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderErrorItem = ({ item }: { item: EdgeFunctionLog }) => (
    <View className="bg-red-900/20 rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-white font-medium">{item.function_name}</Text>
        <View className="bg-red-900/40 px-2 py-1 rounded">
          <Text className="text-red-400 text-xs">{item.status}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-xs mb-1">
        {format(parseISO(item.created_at), 'MMM d, yyyy HH:mm:ss')}
      </Text>
      <Text className="text-red-400 text-xs">{item.error}</Text>
      {item.user_id && (
        <Text className="text-gray-500 text-xs mt-1">User: {item.user_id}</Text>
      )}
    </View>
  );

  const renderLogItem = ({ item }: { item: EdgeFunctionLog }) => (
    <View className={`rounded-lg p-3 mb-2 ${item.status !== 200 ? 'bg-red-900/20' : 'bg-primary-light'}`}>
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-gray-300 text-xs">
          {format(parseISO(item.created_at), 'MMM d, yyyy HH:mm:ss')}
        </Text>
        <View className={`px-2 py-1 rounded ${
          item.status === 200 ? 'bg-green-900/40' : 'bg-red-900/40'
        }`}>
          <Text className={`text-xs ${
            item.status === 200 ? 'text-green-400' : 'text-red-400'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-row items-center">
          <View className={`px-2 py-1 rounded ${
            item.method === 'GET' ? 'bg-blue-900/40' :
            item.method === 'POST' ? 'bg-green-900/40' :
            item.method === 'PUT' ? 'bg-yellow-900/40' :
            item.method === 'DELETE' ? 'bg-red-900/40' : 'bg-gray-900/40'
          }`}>
            <Text className={`text-xs ${
              item.method === 'GET' ? 'text-blue-400' :
              item.method === 'POST' ? 'text-green-400' :
              item.method === 'PUT' ? 'text-yellow-400' :
              item.method === 'DELETE' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {item.method}
            </Text>
          </View>
          <Text className="text-gray-400 text-xs ml-2">{item.execution_time}ms</Text>
        </View>
      </View>
      
      {item.error && (
        <Text className="text-red-400 text-xs mt-1">{item.error}</Text>
      )}
      
      {item.user_id && (
        <View className="flex-row items-center mt-1">
          <Ionicons name="person" size={12} color="#94A3B8" />
          <Text className="text-gray-500 text-xs ml-1">{item.user_id}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={['bottom']}>
      <View className="px-4 pt-3">
        <Text className="text-white text-lg font-bold mb-4">System Logs</Text>

        {/* Function selection */}
        <Text className="text-white text-base font-medium mb-2">Select Function</Text>
        <FlatList
          horizontal
          data={edgeFunctions}
          renderItem={renderFunctionOption}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        />

        {/* Today's Errors Section */}
        {!selectedFunction && (
          <>
            <Text className="text-white text-base font-medium mb-2">Today's Errors</Text>
            {errorsError ? (
              <View className="bg-red-900/30 p-4 rounded-lg">
                <Text className="text-red-400">Error loading error logs: {String(errorsError)}</Text>
              </View>
            ) : loadingErrors ? (
              <View className="items-center p-4">
                <ActivityIndicator color="#10B981" />
                <Text className="text-gray-400 mt-2">Loading today's errors...</Text>
              </View>
            ) : !errorLogs || errorLogs.length === 0 ? (
              <View className="bg-primary-light p-4 rounded-lg">
                <Text className="text-gray-400">No errors reported today. All systems operating normally.</Text>
              </View>
            ) : (
              <FlatList
                data={errorLogs}
                renderItem={renderErrorItem}
                keyExtractor={item => item.id}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#10B981"
                  />
                }
              />
            )}
          </>
        )}

        {/* Selected Function Logs */}
        {selectedFunction && (
          <>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-base font-medium">{selectedFunction} Logs</Text>
              <TouchableOpacity 
                className="flex-row items-center" 
                onPress={() => setSelectedFunction(null)}
              >
                <Ionicons name="arrow-back" size={16} color="#10B981" />
                <Text className="text-accent ml-1">Back</Text>
              </TouchableOpacity>
            </View>

            {functionLogsError ? (
              <View className="bg-red-900/30 p-4 rounded-lg">
                <Text className="text-red-400">Error loading logs: {String(functionLogsError)}</Text>
              </View>
            ) : loadingFunctionLogs ? (
              <View className="items-center p-4">
                <ActivityIndicator color="#10B981" />
                <Text className="text-gray-400 mt-2">Loading function logs...</Text>
              </View>
            ) : !functionLogs || functionLogs.length === 0 ? (
              <View className="bg-primary-light p-4 rounded-lg items-center">
                <Ionicons name="document-text" size={32} color="#4B5563" />
                <Text className="text-gray-400 mt-2">No logs found for this function</Text>
              </View>
            ) : (
              <FlatList
                data={functionLogs}
                renderItem={renderLogItem}
                keyExtractor={item => item.id}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#10B981"
                  />
                }
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}