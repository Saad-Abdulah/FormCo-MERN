'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface Application {
  _id: string;
  competitionId: string;
  competitionTitle: string;
  verificationCode: string;
  paymentVerified: boolean;
  registrationFee: number;
  createdAt: string;
}

interface ApplicationsDropdownProps {
  className?: string;
}

export default function ApplicationsDropdown({ className }: ApplicationsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchApplications = async () => {
    if (applications.length > 0) return; // Don't fetch if already loaded

    setIsLoading(true);
    try {
      const response = await fetch('/api/student/applications');
      const data = await response.json();
      
      if (response.ok) {
        setApplications(data.applications);
      } else {
        toast.error(data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchApplications();
    }
  };

  const handleApplicationClick = (application: Application) => {
    router.push(`/events/${application.competitionId}/${application._id}`);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Applications Icon */}
      <button
        onClick={handleDropdownOpen}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors relative"
        title="My Applications"
      >
        <DocumentTextIcon className="w-5 h-5" />
        {applications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {applications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p className="text-gray-700">No applications yet</p>
                <p className="text-xs text-gray-600 mt-1">Start applying to competitions to see them here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <button
                    key={application._id}
                    onClick={() => handleApplicationClick(application)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {application.competitionTitle}
                        </h4>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Code: 
                          </span>
                          <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {application.verificationCode}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            application.registrationFee === 0
                              ? 'bg-green-100 text-green-800'
                              : application.paymentVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {application.registrationFee === 0 
                              ? 'Free' 
                              : application.paymentVerified 
                                ? 'Verified' 
                                : 'Pending'
                            }
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(application.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {applications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  router.push('/events');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All Competitions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 