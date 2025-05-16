import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BarChart3, Users, Mail, UserPlus, Code } from 'lucide-react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type StatsData = {
  newUsers: number;
  emails: number;
  revenue: number;
};

type DailyData = {
  date: string;
  emails: number;
  revenue: number;
};

type EmailCount = {
  date: string;
  count: number;
};

async function fetchDailyStats() {
  console.log('Fetching daily stats...');
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  try {
    // Execute query to get email counts by date
    const { data: emailData, error: emailError } = await supabase.rpc('get_email_counts_by_date', {
      days_ago: 30
    });

    console.log('Email query result:', { emailData, emailError });

    if (emailError) {
      console.error('Email query error:', emailError);
      throw emailError;
    }

    // Fetch revenue data
    const { data: revenueData, error: revenueError } = await supabase
      .from('stripe_transactions')
      .select('created_at, amount')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    console.log('Revenue query result:', { revenueData, revenueError });

    if (revenueError) throw revenueError;

    // Initialize data structure for the last 30 days
    const dailyData: DailyData[] = [];
    const emailsByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};

    // Group emails by day
    if (emailData && Array.isArray(emailData)) {
      emailData.forEach((row: any) => {
        // Format the date to yyyy-MM-dd for consistency
        const dateStr = format(new Date(row.date), 'yyyy-MM-dd');
        emailsByDay[dateStr] = parseInt(row.count);
      });
    }

    // Group revenue by day
    if (revenueData && Array.isArray(revenueData)) {
      revenueData.forEach(transaction => {
        const date = format(parseISO(transaction.created_at), 'yyyy-MM-dd');
        revenueByDay[date] = (revenueByDay[date] || 0) + (transaction.amount || 0);
      });
    }

    // Generate data for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const displayDate = format(parseISO(date), 'MMM dd');
      
      dailyData.push({
        date: displayDate,
        emails: emailsByDay[date] || 0,
        revenue: (revenueByDay[date] || 0) / 100 // Convert cents to dollars
      });
    }

    console.log('Processed daily data:', dailyData);
    return dailyData;
  } catch (error) {
    console.error('Error in fetchDailyStats:', error);
    throw error;
  }
}

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

    // Get total active users count (Microsoft + Google)
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

async function fetchStats(dateRange: { start: Date; end: Date }) {
  // Query for new users in the selected date range
  let newUsersQuery = supabase
    .from('users')
    .select('id')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString());

  // Query for emails count in the date range
  let emailsQuery = supabase
    .from('email_prio_logs')
    .select('count', { count: 'exact' })
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString());

  // Query for revenue
  let revenueQuery = supabase
    .from('stripe_transactions')
    .select('amount')
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString());

  try {
    const [
      { data: newUsers, error: newUsersError },
      { count: emailsCount, error: emailsError },
      { data: revenue, error: revenueError }
    ] = await Promise.all([
      newUsersQuery,
      emailsQuery,
      revenueQuery
    ]);

    if (newUsersError) throw newUsersError;
    if (emailsError) throw emailsError;
    if (revenueError) throw revenueError;

    // Calculate total revenue
    const totalRevenue = revenue?.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, 0) || 0;

    console.log(`Stats for range ${dateRange.start.toISOString()} to ${dateRange.end.toISOString()}:`, {
      newUsers: newUsers?.length || 0,
      emails: emailsCount || 0,
      revenue: totalRevenue
    });

    return {
      newUsers: newUsers?.length || 0,
      emails: emailsCount || 0,
      revenue: totalRevenue,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}

export default function Overview() {
  const now = new Date();
  const dateRanges = {
    today: {
      start: startOfDay(now),
      end: endOfDay(now)
    },
    month: {
      start: startOfMonth(now),
      end: endOfMonth(now)
    },
    year: {
      start: startOfYear(now),
      end: endOfYear(now)
    }
  };

  const { data: activeUsers, isLoading: isLoadingActiveUsers, error: activeUsersError } = useQuery({
    queryKey: ['active-users'],
    queryFn: fetchActiveUsers
  });

  const { data: dailyStats, isLoading: isLoadingDaily, error: dailyError } = useQuery({
    queryKey: ['daily-stats'],
    queryFn: fetchDailyStats
  });

  const { data: todayStats } = useQuery({
    queryKey: ['overview-stats', 'today'],
    queryFn: () => fetchStats(dateRanges.today)
  });

  const { data: monthStats } = useQuery({
    queryKey: ['overview-stats', 'month'],
    queryFn: () => fetchStats(dateRanges.month)
  });

  const { data: yearStats } = useQuery({
    queryKey: ['overview-stats', 'year'],
    queryFn: () => fetchStats(dateRanges.year)
  });

  const renderStatRow = (stats: StatsData | undefined) => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Revenue</p>
              <p className="text-2xl font-semibold text-white">
                ${(stats.revenue / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">New Users</p>
              <p className="text-2xl font-semibold text-white">{stats.newUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Emails</p>
              <p className="text-2xl font-semibold text-white">{stats.emails}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const emailQuery = `
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS count
FROM 
  email_prio_logs
WHERE 
  created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
  DATE(created_at)
ORDER BY 
  date ASC;`;

  const activeUsersQuery = `
-- Microsoft active users
SELECT count(user_id)
FROM microsoft_subscriptions
WHERE active = true
  AND disabled_at IS NULL

UNION ALL

-- Google active users  
SELECT count(user_id)
FROM google_subscriptions
WHERE active = true
  AND disabled_at IS NULL`;

  const emailCountTodayQuery = `
-- Email counts for today
SELECT COUNT(*)
FROM email_prio_logs
WHERE created_at >= '${dateRanges.today.start.toISOString()}'
  AND created_at <= '${dateRanges.today.end.toISOString()}'`;

  const emailCountMonthQuery = `
-- Email counts for current month
SELECT COUNT(*)
FROM email_prio_logs
WHERE created_at >= '${dateRanges.month.start.toISOString()}'
  AND created_at <= '${dateRanges.month.end.toISOString()}'`;

  const emailCountYearQuery = `
-- Email counts for current year
SELECT COUNT(*)
FROM email_prio_logs
WHERE created_at >= '${dateRanges.year.start.toISOString()}'
  AND created_at <= '${dateRanges.year.end.toISOString()}'`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Dashboard Overview</h1>

      {/* Active Users Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Active Users</h2>
        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          {activeUsersError ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
              Error loading active users: {String(activeUsersError)}
            </div>
          ) : isLoadingActiveUsers ? (
            <div className="text-gray-400 p-4 text-center">Loading active users data...</div>
          ) : !activeUsers ? (
            <div className="text-gray-400 p-4 text-center">No active users data available</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-indigo-500/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-indigo-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Active Users</p>
                    <p className="text-3xl font-semibold text-white">{activeUsers.totalCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Microsoft Users</p>
                    <p className="text-2xl font-semibold text-white">{activeUsers.microsoftCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-500/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Google Users</p>
                    <p className="text-2xl font-semibold text-white">{activeUsers.googleCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6">Daily Data</h2>
      <div className="space-y-6 mb-12">
        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Emails Prioritized (Last 30 Days)</h3>
          {dailyError ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
              Error loading email data: {String(dailyError)}
            </div>
          ) : isLoadingDaily ? (
            <div className="text-gray-400 p-4 text-center">Loading email data...</div>
          ) : !dailyStats || dailyStats.length === 0 ? (
            <div className="text-gray-400 p-4 text-center">No email data available for the last 30 days</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#F3F4F6'
                    }}
                  />
                  <Bar dataKey="emails" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue (Last 30 Days)</h3>
          {dailyError ? (
            <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
              Error loading revenue data: {String(dailyError)}
            </div>
          ) : isLoadingDaily ? (
            <div className="text-gray-400 p-4 text-center">Loading revenue data...</div>
          ) : !dailyStats || dailyStats.length === 0 ? (
            <div className="text-gray-400 p-4 text-center">No revenue data available for the last 30 days</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF' }}
                    tickLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6">Daily Stats</h2>
      {renderStatRow(todayStats)}

      <h2 className="text-xl font-semibold text-white mb-6">Monthly Stats</h2>
      {renderStatRow(monthStats)}

      <h2 className="text-xl font-semibold text-white mb-6">Yearly Stats</h2>
      {renderStatRow(yearStats)}

      {/* SQL Queries Debug Section (moved to bottom) */}
      <div className="mt-16 mb-12">
        <h2 className="text-xl font-semibold text-white mb-6">SQL Queries</h2>
        <div className="space-y-6">
          <details className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
            <summary className="flex items-center gap-2 mb-4 cursor-pointer">
              <Code className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Email Count SQL Query</h3>
            </summary>
            <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{emailQuery}</code>
            </pre>
          </details>

          <details className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
            <summary className="flex items-center gap-2 mb-4 cursor-pointer">
              <Code className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Active Users SQL Query</h3>
            </summary>
            <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{activeUsersQuery}</code>
            </pre>
          </details>

          <details className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
            <summary className="flex items-center gap-2 mb-4 cursor-pointer">
              <Code className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Today's Email Count Query</h3>
            </summary>
            <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{emailCountTodayQuery}</code>
            </pre>
          </details>

          <details className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
            <summary className="flex items-center gap-2 mb-4 cursor-pointer">
              <Code className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Monthly Email Count Query</h3>
            </summary>
            <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{emailCountMonthQuery}</code>
            </pre>
          </details>

          <details className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg p-6">
            <summary className="flex items-center gap-2 mb-4 cursor-pointer">
              <Code className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Yearly Email Count Query</h3>
            </summary>
            <pre className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono">{emailCountYearQuery}</code>
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}