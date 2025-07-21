'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { EyeIcon, EyeSlashIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { RiLockStarFill } from "react-icons/ri";
import toast from 'react-hot-toast';

interface SecretCodeDropdownProps {
  className?: string;
}

export default function SecretCodeDropdown({ className }: SecretCodeDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const copySecretCode = async () => {
    if (session?.user?.secretCode) {
      try {
        await navigator.clipboard.writeText(session.user.secretCode);
        toast.success('Secret code copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
        toast.error('Failed to copy secret code');
      }
    }
  };

  const maskSecretCode = (code: string) => {
    return code.replace(/./g, '•');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Secret Code Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
        title="Organization Secret Code"
      >
        <RiLockStarFill className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-110 bg-white rounded-2xl shadow-lg border border-gray-100 z-50">
          {/* Header */}
          <div className="flex items-center p-5 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <RiLockStarFill className="h-6 w-6 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-800">Secret Code</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-3 rounded-xl">
              {/* Eye Icon for visibility toggle */}
              <button
                onClick={() => setShowSecretCode(!showSecretCode)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title={showSecretCode ? 'Hide secret code' : 'Show secret code'}
              >
                {showSecretCode ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* Secret Code Display */}
              <div className="flex-1 font-mono text-gray-800 text-lg tracking-[0.2em]">
                {session?.user?.secretCode ? (
                  showSecretCode ? session.user.secretCode : maskSecretCode(session.user.secretCode)
                ) : (
                  'N/A'
                )}
              </div>
              
              {/* Copy Icon */}
              <button
                onClick={copySecretCode}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy secret code"
                disabled={!session?.user?.secretCode}
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Share this code with organizers to allow them to join your organization
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 