import React, { useState } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import DatePicker from 'react-datepicker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, subDays } from 'date-fns';
import { Terminal, AlertCircle, Clock, Webhook, CreditCard, FileTerminal, RefreshCcw, Key, Mail, Users, Search, ChevronLeft, ChevronRight, Calendar, Filter, User, Brain, Flag, SendHorizontal } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

type DateRange = {
  start: Date;
  end: Date;
};

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

// Edge function definitions with icons
const edgeFunctions = [
  { path: 'stripe-webhook', label: 'stripe-webhook', icon: Webhook },
  { path: 'create-checkout', label: 'create-checkout', icon: CreditCard },
  { path: 'get-invoice', label: 'get-invoice', icon: FileTerminal },
  { path: 'cancel-subscription', label: 'cancel-subscription', icon: CreditCard },
  { path: 'deactivate-google-subscription', label: 'deactivate-google-subscription', icon: RefreshCcw },
  { path: 'create-google-subscription', label: 'create-google-subscription', icon: RefreshCcw },
  { path: 'google-api-manage-mail-sub-pub', label: 'google-api-manage-mail-sub-pub', icon: Mail },
  { path: 'google-users', label: 'google-users', icon: Users },
  { path: 'microsoft_oauth2_token_exchange_dv', label: 'microsoft_oauth2_token_exchange_dv', icon: Key },
//  { path: 'microsoft_oauth2_token_exchange_ea', label: 'microsoft_oauth2_token_exchange_ea', icon: Key },
  { path: 'microsoft_refresh_oauth2_token_dv', label: 'microsoft_refresh_oauth2_token_dv', icon: RefreshCcw },
//  { path: 'microsoft_refresh_oauth2_token_ea', label: 'microsoft_refresh_oauth2_token_ea', icon: RefreshCcw },
  { path: 'refresh_mail_subscription_upon_microsoft_notification_dv', label: 'refresh_mail_subscription_upon_microsoft_notification_dv', icon: Mail },
  { path: 'check_microsoft_subscription_expiration_dv', label: 'check_microsoft_subscription_expiration_dv', icon: RefreshCcw },
  // New edge functions
  { path: 'openai-tiktoken', label: 'openai-tiktoken', icon: Brain },
  { path: 'emailassist-microsoft-prio', label: 'emailassist-microsoft-prio', icon: Flag },
  { path: 'sendMailjetEmail', label: 'sendMailjetEmail', icon: SendHorizontal },
];

function EdgeFunctionButtons() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentFunction = location.pathname.split('/').pop();

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">Select Function</h3>
      <div className="flex flex-wrap gap-3">
        {edgeFunctions.map((func) => {
          const Icon = func.icon;
          const isActive = currentFunction === func.path;
          
          return (
            <button
              key={func.path}
              onClick={() => navigate(`/dashboard/logs/${func.path}`)}
              className={`
                flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-[#1a2333]/70 text-gray-300 hover:bg-white/10 hover:text-white'}
              `}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="truncate">{func.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DailyErrorSummary() {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  
  const { data: errorLogs, isLoading, error } = useQuery({
    queryKey: ['daily-error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString())
        .not('error', 'is', null)
        .neq('status', 200)  // Added: Exclude logs with status 200
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EdgeFunctionLog[];
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6 mb-8 bg-[#1a2333]/50 backdrop-blur-sm rounded-lg">
        <Clock className="w-6 h-6 text-blue-400 animate-spin mr-2" />
        <span className="text-gray-300">Loading today's errors...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 mb-8 bg-red-900/20 text-red-400 rounded-lg">
        <AlertCircle className="w-6 h-6 mb-2" />
        <p>Error loading error logs: {(error as Error).message}</p>
      </div>
    );
  }
  
  if (!errorLogs || errorLogs.length === 0) {
    return (
      <div className="p-6 mb-8 bg-[#1a2333]/50 backdrop-blur-sm rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">Today's Errors</h3>
        <p className="text-gray-400">No errors reported today. All systems operating normally.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">Today's Errors</h3>
      <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead>
              <tr>
                <th className="table-header">Time</th>
                <th className="table-header">Function</th>
                <th className="table-header">Status</th>
                <th className="table-header">Method</th>
                <th className="table-header">User ID</th>
                <th className="table-header">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {errorLogs.map((log) => (
                <tr key={log.id} className="bg-red-900/10 hover:bg-red-900/20 transition-colors">
                  <td className="table-cell">
                    {format(new Date(log.created_at), 'HH:mm:ss')}
                  </td>
                  <td className="table-cell font-medium text-white">
                    {log.function_name}
                  </td>
                  <td className="table-cell">
                    <span className="priority-badge bg-red-900/50 text-red-200">
                      {log.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`priority-badge ${
                      log.method === 'GET' ? 'bg-blue-900/50 text-blue-200' :
                      log.method === 'POST' ? 'bg-green-900/50 text-green-200' :
                      log.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-200' :
                      log.method === 'DELETE' ? 'bg-red-900/50 text-red-200' :
                      'bg-gray-900/50 text-gray-200'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-xs text-gray-300">
                    {log.user_id || '-'}
                  </td>
                  <td className="table-cell text-red-400 max-w-md truncate">
                    {log.error}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EdgeFunctionLogs() {
  const { "*": functionPath } = useParams();
  const functionName = functionPath?.replace(/^\//, '');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 20;

  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  }));

  const [viewMode, setViewMode] = useState<'today' | 'yesterday' | 'last10days' | 'week' | 'custom'>('today');

  React.useEffect(() => {
    const now = new Date();
    switch (viewMode) {
      case 'today':
        setDateRange({
          start: startOfDay(now),
          end: endOfDay(now)
        });
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        setDateRange({
          start: startOfDay(yesterday),
          end: endOfDay(yesterday)
        });
        break;
      case 'last10days':
        setDateRange({
          start: startOfDay(subDays(now, 10)),
          end: endOfDay(now)
        });
        break;
      case 'week':
        setDateRange({
          start: startOfWeek(now),
          end: endOfWeek(now)
        });
        break;
    }
  }, [viewMode]);

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['edge-function-logs', functionName, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .eq('function_name', functionName)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EdgeFunctionLog[];
    },
    enabled: !!functionName
  });

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    
    if (!searchTerm.trim()) return logs;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return logs.filter(log => 
      log.method.toLowerCase().includes(normalizedSearch) ||
      log.status.toString().includes(normalizedSearch) ||
      (log.error || '').toLowerCase().includes(normalizedSearch) ||
      (log.user_id || '').toLowerCase().includes(normalizedSearch)
    );
  }, [logs, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Date filter component to be displayed prominently
  const DateFilterComponent = () => (
    <div className="mb-6 bg-blue-900/30 border border-blue-800/50 rounded-lg p-4 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Date Range Filter</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#1a2333] rounded-md px-3 py-2 border border-gray-700">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="bg-transparent text-gray-200 border-none focus:outline-none focus:ring-0 w-full"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last10days">Last 10 days</option>
              <option value="week">This Week</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {viewMode === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <DatePicker
                selected={dateRange.start}
                onChange={(date) => date && setDateRange(prev => ({ ...prev, start: date }))}
                className="bg-[#1a2333] text-gray-300 rounded-md border border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                dateFormat="MMM d, yyyy"
              />
              <span className="text-gray-400 px-2">to</span>
              <DatePicker
                selected={dateRange.end}
                onChange={(date) => date && setDateRange(prev => ({ ...prev, end: date }))}
                className="bg-[#1a2333] text-gray-300 rounded-md border border-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                dateFormat="MMM d, yyyy"
                minDate={dateRange.start}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-sm text-gray-400">
        Showing logs from {format(dateRange.start, 'MMM d, yyyy')} to {format(dateRange.end, 'MMM d, yyyy')}
      </div>
    </div>
  );

  if (!functionName) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Terminal className="w-8 h-8 text-gray-500" />
        <span className="mt-2 text-gray-400">Please select a function from above</span>
      </div>
    );
  }

  return (
    <div>
      {/* Date Filter - Prominently displayed at the top */}
      <DateFilterComponent />
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">{functionName}</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {paginatedLogs.length} of {filteredLogs.length} log entries
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Clock className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading logs...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64 text-red-400">
          <AlertCircle className="w-8 h-8" />
          <span className="ml-2">Error loading logs: {(error as Error).message}</span>
        </div>
      )}

      {/* Search Input */}
      {!isLoading && !error && (
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs by method, status, user ID, or error message..."
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
      )}

      {!isLoading && !error && filteredLogs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64">
          <Terminal className="w-8 h-8 text-gray-500" />
          <span className="mt-2 text-gray-400">
            {searchTerm 
              ? `No logs found matching "${searchTerm}" for ${functionName}`
              : `No logs found for ${functionName}`}
          </span>
          <span className="mt-1 text-sm text-gray-500">
            Time range: {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
          </span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && filteredLogs.length > 0 && (
        <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr>
                  <th className="table-header">Timestamp</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Execution Time</th>
                  <th className="table-header">User ID</th>
                  <th className="table-header">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={log.status !== 200 ? 'bg-red-900/20' : ''}
                  >
                    <td className="table-cell">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="table-cell">
                      <span className={`priority-badge ${
                        log.method === 'GET' ? 'bg-blue-900/50 text-blue-200' :
                        log.method === 'POST' ? 'bg-green-900/50 text-green-200' :
                        log.method === 'PUT' ? 'bg-yellow-900/50 text-yellow-200' :
                        log.method === 'DELETE' ? 'bg-red-900/50 text-red-200' :
                        'bg-gray-900/50 text-gray-200'
                      }`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`priority-badge ${
                        log.status === 200
                          ? 'bg-green-900/50 text-green-200'
                          : 'bg-red-900/50 text-red-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {log.execution_time}ms
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-300">
                      {log.user_id ? (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-blue-400" />
                          {log.user_id}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="table-cell text-red-400 max-w-md truncate">
                      {log.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-[#1a2333] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                // Simplified pagination display logic for better UX
                let pageToShow: number;
                
                if (totalPages <= 5) {
                  // If 5 or fewer pages, show all page numbers
                  pageToShow = idx + 1;
                } else if (currentPage <= 3) {
                  // If current page is near the start
                  pageToShow = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If current page is near the end
                  pageToShow = totalPages - 4 + idx;
                } else {
                  // Otherwise, show current page in the middle
                  pageToShow = currentPage - 2 + idx;
                }
                
                // Check if page is valid (shouldn't happen with this logic but just in case)
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
        </div>
      )}
    </div>
  );
}

export default function Logs() {
  const location = useLocation();
  const path = location.pathname;
  const isSpecificFunction = path.split('/').length > 3;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">System Logs</h1>
      
      <EdgeFunctionButtons />
      
      {/* Only show daily error summary when no specific function is selected */}
      {!isSpecificFunction && <DailyErrorSummary />}
      
      <Routes>
        <Route path="/*" element={<EdgeFunctionLogs />} />
      </Routes>
    </div>
  );
}