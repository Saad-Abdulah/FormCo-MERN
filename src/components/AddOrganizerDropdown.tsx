'use client';

import { useState, useRef, useEffect } from 'react';
import { ImUserPlus } from 'react-icons/im';
import { UserGroupIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

interface Organizer {
  _id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  isApproved: boolean;
}

interface AddOrganizerDropdownProps {
  className?: string;
}

export default function AddOrganizerDropdown({ className }: AddOrganizerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null);
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

  const fetchOrganizers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organization/organizers');
      if (response.ok) {
        const data = await response.json();
        setOrganizers(data.organizers);
      } else {
        console.error('Failed to fetch organizers');
        toast.error('Failed to load organizers');
      }
    } catch (error) {
      console.error('Error fetching organizers:', error);
      toast.error('Error loading organizers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOrganizer = async (organizerId: string, organizerName: string) => {
    // Show confirmation alert
    const confirmed = window.confirm(
      `Are you sure you want to remove "${organizerName}" from your organization?\n\nThis action cannot be undone and the organizer will lose access to all competitions and data associated with your organization.`
    );

    if (!confirmed) {
      return; // User cancelled the action
    }

    setIsLoadingAction(organizerId);
    try {
      const response = await fetch('/api/organization/remove-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizerId }),
      });

      if (response.ok) {
        toast.success('Organizer removed successfully');
        fetchOrganizers(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove organizer');
      }
    } catch (error) {
      console.error('Error removing organizer:', error);
      toast.error('An error occurred while removing organizer');
    } finally {
      setIsLoadingAction(null);
    }
  };

  const handleDropdownOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchOrganizers();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Add Organizer Icon */}
      <button
        onClick={handleDropdownOpen}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
        title="Manage Organizers"
      >
        <ImUserPlus className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Authorized Organizers</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading organizers...</div>
              </div>
            ) : organizers.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-700">No organizers found</p>
                <p className="text-sm text-gray-600 mt-1">
                  Organizers will appear here once they join
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizers.map((organizer) => (
                  <div
                    key={organizer._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {organizer.name}
                      </h4>
                      <p className="text-sm text-gray-700 truncate">{organizer.email}</p>
                      {(organizer.department || organizer.position) && (
                        <p className="text-xs text-gray-600 truncate">
                          {[organizer.department, organizer.position].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveOrganizer(organizer._id, organizer.name)}
                      disabled={isLoadingAction === organizer._id}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove organizer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 text-center">
              Organizers can join using your organization's secret code
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 