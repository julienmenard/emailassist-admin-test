import React from 'react';
import { Clock, Database, AlertCircle } from 'lucide-react';

type DataDisplayProps<T> = {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
};

export default function DataDisplay<T extends { id: string }>({
  data,
  isLoading,
  error,
  renderItem,
  emptyMessage = 'No data available',
}: DataDisplayProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
        <p className="mt-4 text-lg font-medium text-gray-700">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-200">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="mt-4 text-lg font-medium text-gray-700">Error loading data</p>
        <p className="mt-2 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm">
        <Database className="w-10 h-10 text-gray-400" />
        <p className="mt-4 text-lg font-medium text-gray-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}