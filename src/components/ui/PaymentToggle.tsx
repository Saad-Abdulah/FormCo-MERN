'use client';

import { useState } from 'react';

interface PaymentToggleProps {
  verified: boolean;
  onToggle?: (verified: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  readonly?: boolean;
  size?: 'default' | 'compact';
}

export default function PaymentToggle({ 
  verified, 
  onToggle, 
  disabled = false, 
  loading = false, 
  readonly = false,
  size = 'default'
}: PaymentToggleProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (disabled || loading || isToggling || readonly || !onToggle) return;
    
    setIsToggling(true);
    try {
      await onToggle(!verified);
    } finally {
      setIsToggling(false);
    }
  };

  const isInteractive = !readonly && !disabled && !loading && onToggle;
  const sizeClasses = size === 'compact' 
    ? 'w-20 h-6' 
    : 'w-28 h-8';
  const circleClasses = size === 'compact'
    ? 'w-5 h-5'
    : 'w-6 h-6';
  const translateClasses = size === 'compact'
    ? (verified ? 'translate-x-14' : 'translate-x-0.5')
    : (verified ? 'translate-x-20' : 'translate-x-1');

  return (
    <button
      onClick={handleToggle}
      disabled={!isInteractive}
      className={`
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
        ${verified 
          ? 'bg-green-600' + (isInteractive ? ' hover:bg-green-700' : '')
          : 'bg-red-600' + (isInteractive ? ' hover:bg-red-700' : '')
        }
        ${!isInteractive ? 'cursor-default' : 'cursor-pointer'}
        ${sizeClasses}
      `}
    >
      {/* Toggle Circle */}
      <span
        className={`
          inline-block bg-white rounded-full shadow-lg transform transition-transform duration-300 ease-in-out
          ${circleClasses} ${translateClasses}
        `}
      />
      
      {/* Text Labels */}
      <span
        className={`
          absolute text-xs font-bold transition-opacity duration-300
          ${verified ? 'text-white left-2 opacity-100' : 'text-white left-2 opacity-0'}
        `}
      >
        VERIFIED
      </span>
      <span
        className={`
          absolute text-xs font-bold transition-opacity duration-300
          ${!verified ? 'text-white right-2 opacity-100' : 'text-white right-2 opacity-0'}
        `}
      >
        PENDING
      </span>
      
      {/* Loading spinner */}
      {(loading || isToggling) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
} 