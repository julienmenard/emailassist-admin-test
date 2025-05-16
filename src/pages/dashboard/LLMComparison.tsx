import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type EmailLog = {
  id: string;
  created_at: string;
  email_sender: string;
  email_recipient: string;
  email_subject: string;
  email_priority: string;
  email_analysis: string | null;
  email_analysis_bedrock_claude: string | null;
  email_analysis_openai41mini: string | null;
  date: string;
};

export default function LLMComparison() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, Record<string, boolean>>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchEmails();
  }, [currentPage, searchTerm]);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate pagination range
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // First, get the count for pagination
      let countQuery = supabase
        .from('email_prio_logs')
        .select('id', { count: 'exact' });
      
      if (searchTerm) {
        countQuery = countQuery.ilike('email_subject', `%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        throw new Error(`Error getting count: ${countError.message}`);
      }
      
      const totalItems = count || 0;
      setTotalCount(totalItems);
      setTotalPages(Math.ceil(totalItems / itemsPerPage));

      // Then, fetch the actual data for the current page
      let dataQuery = supabase
        .from('email_prio_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (searchTerm) {
        dataQuery = dataQuery.ilike('email_subject', `%${searchTerm}%`);
      }
      
      // Apply the pagination range
      dataQuery = dataQuery.range(from, to);

      const { data, error: dataError } = await dataQuery;

      if (dataError) {
        throw new Error(`Error fetching data: ${dataError.message}`);
      }
      
      setEmails(data as EmailLog[]);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnalysis = (emailId: string, model: string) => {
    setExpandedAnalysis(prev => ({
      ...prev,
      [emailId]: {
        ...prev[emailId],
        [model]: !prev[emailId]?.[model]
      }
    }));
  };

  const isAnalysisExpanded = (emailId: string, model: string) => {
    return expandedAnalysis[emailId]?.[model] || false;
  };

  const extractPriorityScore = (analysis: string | null): number => {
    if (!analysis) return 0;
    
    const priorityMatch = analysis.match(/Score de Priorité\s*:\s*(\d+)/i) || 
                          analysis.match(/Priority Score\s*:\s*(\d+)/i);
    
    return priorityMatch ? parseInt(priorityMatch[1], 10) : 0;
  };

  const hasDifferentPriorities = (email: EmailLog): boolean => {
    const priorities = [
      extractPriorityScore(email.email_analysis),
      extractPriorityScore(email.email_analysis_openai41mini),
      extractPriorityScore(email.email_analysis_bedrock_claude)
    ].filter(score => score > 0);
    
    // If we have at least 2 scores and they're not all the same
    return priorities.length >= 2 && !priorities.every(score => score === priorities[0]);
  };

  const formatAnalysis = (analysis: string | null, emailId: string, model: string) => {
    if (!analysis) return <span className="text-gray-400">No analysis available</span>;

    const isExpanded = isAnalysisExpanded(emailId, model);

    // Extract priority score
    const priorityMatch = analysis.match(/Score de Priorité\s*:\s*(\d+)/i) || 
                          analysis.match(/Priority Score\s*:\s*(\d+)/i);
    
    const priority = priorityMatch ? priorityMatch[1] : '?';

    return (
      <div className="w-full h-full">
        <div className="text-sm">
          <span className="font-medium">Score de Priorité : {priority}</span>
        </div>
        <button
          onClick={() => toggleAnalysis(emailId, model)}
          className="mt-1 text-emerald-400 hover:text-emerald-300 flex items-center text-xs"
        >
          {isExpanded ? (
            <>
              Afficher moins {<ChevronUp className="w-4 h-4 ml-1" />}
            </>
          ) : (
            <>
              Afficher plus {<ChevronDown className="w-4 h-4 ml-1" />}
            </>
          )}
        </button>
        {isExpanded && (
          <div className="mt-2 text-xs text-gray-300 bg-[#1a2333]/50 p-3 rounded-lg max-h-96 overflow-y-auto break-words whitespace-normal">
            {analysis.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line || <br />}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading && emails.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-8">LLM Comparison</h1>
        <div className="flex flex-col items-center justify-center p-12">
          <Clock className="w-12 h-12 text-blue-400 animate-spin mb-4" />
          <p className="text-lg text-gray-300">Loading email data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-8">LLM Comparison</h1>
        <div className="flex flex-col items-center justify-center p-12 bg-red-900/20 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-lg text-red-300 mb-2">Error loading email data</p>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">LLM Comparison</h1>
      
      {/* Search Input */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when search changes
          }}
          placeholder="Search by email subject..."
          className="pl-10 pr-4 py-3 w-full bg-[#1a2333] text-gray-200 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
          >
            <span className="text-sm font-medium mr-1">Clear</span>
            <span className="text-lg">×</span>
          </button>
        )}
      </div>

      {isLoading && emails.length > 0 && (
        <div className="flex justify-center items-center py-4 mb-4">
          <Clock className="w-6 h-6 text-blue-400 animate-spin mr-2" />
          <p className="text-gray-300">Refreshing data...</p>
        </div>
      )}

      {/* Email Table */}
      <div className="bg-[#1a2333]/50 backdrop-blur-sm rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 table-fixed">
            <colgroup>
              <col className="w-32" /> {/* Date */}
              <col className="w-40" /> {/* Sender */}
              <col className="w-52" /> {/* Subject */}
              <col className="w-[20%]" /> {/* GPT-4 Analysis */}
              <col className="w-[20%]" /> {/* GPT-4.1-mini Analysis */}
              <col className="w-[20%]" /> {/* Claude Analysis */}
            </colgroup>
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Sender</th>
                <th className="table-header">Subject</th>
                <th className="table-header">GPT-4 Analysis</th>
                <th className="table-header">GPT-4.1-mini Analysis</th>
                <th className="table-header">Claude Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    {searchTerm 
                      ? `No emails found matching "${searchTerm}"`
                      : 'No email data available'}
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr 
                    key={email.id} 
                    className={`${
                      hasDifferentPriorities(email) 
                        ? 'bg-yellow-900/20 hover:bg-yellow-900/30' 
                        : 'hover:bg-[#1a2333]/80'
                    } transition-colors`}
                  >
                    <td className="table-cell">
                      {email.created_at 
                        ? format(parseISO(email.created_at), 'dd MMM yyyy HH:mm') 
                        : 'N/A'}
                    </td>
                    <td className="table-cell align-middle">
                      <div className="max-w-full break-words whitespace-normal text-xs">
                        {email.email_sender || 'N/A'}
                      </div>
                    </td>
                    <td className="table-cell align-middle">
                      <div className="max-w-full break-words whitespace-normal text-xs">
                        {email.email_subject || 'N/A'}
                      </div>
                    </td>
                    <td className="table-cell p-4 align-top">
                      {formatAnalysis(email.email_analysis, email.id, 'gpt4')}
                    </td>
                    <td className="table-cell p-4 align-top">
                      {formatAnalysis(email.email_analysis_openai41mini, email.id, 'gpt41mini')}
                    </td>
                    <td className="table-cell p-4 align-top">
                      {formatAnalysis(email.email_analysis_bedrock_claude, email.id, 'claude')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {emails.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
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