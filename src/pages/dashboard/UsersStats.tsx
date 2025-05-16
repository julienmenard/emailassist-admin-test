import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Users, Mail, Calendar, Check, X, RefreshCcw, Search, ChevronLeft, ChevronRight, Code } from 'lucide-react';
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

export default function UsersStats() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showQueries, setShowQueries] = useState(false);
  const itemsPerPage = 10;

  // Fetch Google users with their subscriptions
  const { data: googleUsers, isLoading: loadingGoogle, error: googleError } = useQuery({
    queryKey: ['google-users'],
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
  const { data: microsoftUsers, isLoading: loadingMicrosoft, error: microsoftError } = useQuery({
    queryKey: ['microsoft-users'],
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

  // Calculate pages for pagination
  const googleTotalPages = Math.ceil((filteredGoogleUsers?.length || 0) / itemsPerPage);
  const microsoftTotalPages = Math.ceil((filteredMicrosoftUsers?.length || 0) / itemsPerPage);

  // Get paginated users
  const paginatedGoogleUsers = filteredGoogleUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedMicrosoftUsers = filteredMicrosoftUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // UI components
  const renderUserCard = (user: any, provider: 'google' | 'microsoft') => {
    const providerEmail = provider === 'google' ? user.google_email : user.microsoft_email;
    
    return (
      <div key={user.id} className="bg-[#1a2333]/70 backdrop-blur-sm rounded-lg p-4 shadow-md">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-white">{user.name || 'Unnamed User'}</h3>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
            {providerEmail && (
              <p className="text-xs text-blue-400 mt-1">
                {provider === 'google' ? 'Google' : 'Microsoft'} Email: {providerEmail}
              </p>
            )}
          </div>
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium ${
              user.plan_type === 'free' ? 'bg-gray-700 text-gray-300' :
              user.plan_type === 'individual' ? 'bg-blue-900/50 text-blue-300' :
              user.plan_type === 'enterprise' ? 'bg-purple-900/50 text-purple-300' :
              'bg-gray-700 text-gray-300'
            }
          `}>
            {user.plan_type || 'No Plan'}
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-300">Subscription:</span>
            </div>
            <div className="flex items-center">
              {user.active ? (
                <span className="flex items-center text-green-400 text-sm">
                  <Check className="w-4 h-4 mr-1" /> Active
                </span>
              ) : (
                <span className="flex items-center text-red-400 text-sm">
                  <X className="w-4 h-4 mr-1" /> Inactive
                </span>
              )}
            </div>
          </div>
          
          {user.subscription_id && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-400">ID:</span>
              <span className="text-gray-300 font-mono text-xs">{user.subscription_id}</span>
            </div>
          )}
          
          {user.expiration_date && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-300">Expires:</span>
              </div>
              <span className={`
                ${new Date(user.expiration_date) < new Date() ? 'text-red-400' : 'text-green-400'}
              `}>
                {format(parseISO(user.expiration_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPagination = (totalPages: number) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 space-x-2">
        <button
          onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-md bg-[#1a2333] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            let pageToShow: number;
            
            if (totalPages <= 5) {
              pageToShow = idx + 1;
            } else if (currentPage <= 3) {
              pageToShow = idx + 1;
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + idx;
            } else {
              pageToShow = currentPage - 2 + idx;
            }
            
            if (pageToShow < 1 || pageToShow > totalPages) return null;
            
            return (
              <button
                key={pageToShow}
                onClick={() => setCurrentPage(pageToShow)}
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  currentPage === pageToShow 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#1a2333] text-gray-300 hover:bg-[#293a52] transition-colors'
                }`}
              >
                {pageToShow}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md bg-[#1a2333] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // SQL queries as they would be executed by Supabase
  const googleSubscriptionQuery = `
-- 1. Query for active Google subscription
SELECT * 
FROM google_subscriptions
WHERE user_id = [user_id]
  AND active = true
ORDER BY created_at DESC
LIMIT 1;

-- 2. If no active subscription, query for most recent subscription
SELECT * 
FROM google_subscriptions
WHERE user_id = [user_id]
ORDER BY created_at DESC
LIMIT 1;`;

  const microsoftSubscriptionQuery = `
-- 1. Query for active Microsoft subscription
SELECT * 
FROM microsoft_subscriptions
WHERE user_id = [user_id]
  AND active = true
ORDER BY created_at DESC
LIMIT 1;

-- 2. If no active subscription, query for most recent subscription
SELECT * 
FROM microsoft_subscriptions
WHERE user_id = [user_id]
ORDER BY created_at DESC
LIMIT 1;`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Users Statistics</h1>
      
      {/* Search bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by ID, name, email, or subscription ID..."
          className="pl-10 pr-4 py-3 w-full bg-[#1a2333] text-gray-200 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
          >
            <span className="text-sm font-medium mr-1">Clear</span>
            <span className="text-lg">×</span>
          </button>
        )}
      </div>

      {/* SQL Queries Section */}
      <div className="mb-8">
        <button 
          onClick={() => setShowQueries(!showQueries)}
          className="flex items-center mb-4 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Code className="w-5 h-5 mr-2" />
          <span>{showQueries ? 'Hide SQL Queries' : 'Show SQL Queries'}</span>
        </button>
        
        {showQueries && (
          <div className="space-y-4">
            <div className="bg-[#1a2333]/70 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-blue-900/30 text-blue-300 font-medium border-b border-blue-900/50">
                Google Subscription Query
              </div>
              <pre className="p-4 text-gray-300 overflow-x-auto text-sm">
                <code>{googleSubscriptionQuery}</code>
              </pre>
            </div>
            
            <div className="bg-[#1a2333]/70 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-blue-900/30 text-blue-300 font-medium border-b border-blue-900/50">
                Microsoft Subscription Query
              </div>
              <pre className="p-4 text-gray-300 overflow-x-auto text-sm">
                <code>{microsoftSubscriptionQuery}</code>
              </pre>
            </div>
            
            <div className="bg-[#1a2333]/70 backdrop-blur-sm rounded-lg p-4 text-gray-300 text-sm">
              <p className="mb-2">
                <strong>Note:</strong> The query process for finding subscriptions:
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>First, look for an active subscription (active = true)</li>
                <li>If no active subscription exists, get the most recent subscription</li>
                <li>Order by created_at to ensure the latest subscription is returned</li>
              </ol>
              <p className="mt-2">
                This ensures that active subscriptions are prioritized, and when no active subscription exists,
                the most recent subscription is displayed instead.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Google Users Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="bg-red-500/20 p-3 rounded-lg mr-3">
            <Mail className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Google Users</h2>
          {!loadingGoogle && (
            <span className="ml-3 text-sm bg-[#1a2333] px-2 py-1 rounded-md text-gray-300">
              {filteredGoogleUsers.length} users
            </span>
          )}
        </div>

        {googleError ? (
          <div className="p-4 rounded-lg bg-red-900/20 text-red-300">
            <p>Error loading Google users: {(googleError as Error).message}</p>
          </div>
        ) : loadingGoogle ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCcw className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-300">Loading Google users...</span>
          </div>
        ) : filteredGoogleUsers.length === 0 ? (
          <div className="p-8 text-center bg-[#1a2333]/50 backdrop-blur-sm rounded-lg">
            <Users className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300">
              {searchTerm ? `No Google users matching "${searchTerm}"` : 'No Google users found'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedGoogleUsers.map(user => renderUserCard(user, 'google'))}
            </div>
            {renderPagination(googleTotalPages)}
          </>
        )}
      </div>

      {/* Microsoft Users Section */}
      <div className="mb-10">
        <div className="flex items-center mb-6">
          <div className="bg-blue-500/20 p-3 rounded-lg mr-3">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Microsoft Users</h2>
          {!loadingMicrosoft && (
            <span className="ml-3 text-sm bg-[#1a2333] px-2 py-1 rounded-md text-gray-300">
              {filteredMicrosoftUsers.length} users
            </span>
          )}
        </div>

        {microsoftError ? (
          <div className="p-4 rounded-lg bg-red-900/20 text-red-300">
            <p>Error loading Microsoft users: {(microsoftError as Error).message}</p>
          </div>
        ) : loadingMicrosoft ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCcw className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-300">Loading Microsoft users...</span>
          </div>
        ) : filteredMicrosoftUsers.length === 0 ? (
          <div className="p-8 text-center bg-[#1a2333]/50 backdrop-blur-sm rounded-lg">
            <Users className="w-10 h-10 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300">
              {searchTerm ? `No Microsoft users matching "${searchTerm}"` : 'No Microsoft users found'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMicrosoftUsers.map(user => renderUserCard(user, 'microsoft'))}
            </div>
            {renderPagination(microsoftTotalPages)}
          </>
        )}
      </div>
    </div>
  );
}