'use client';

import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  timeout = 15000,
  onTimeout 
}: LoadingSpinnerProps) {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
      onTimeout?.();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {!showTimeoutMessage ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-lg text-gray-700">{message}</div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-red-600 text-lg mb-2">Loading is taking longer than expected</div>
            <div className="text-gray-600 mb-4">This might be due to:</div>
            <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
              <li>• Slow internet connection</li>
              <li>• Database connection issues</li>
              <li>• Server overload</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 