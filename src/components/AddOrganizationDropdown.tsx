'use client';

import { useState, useRef, useEffect } from 'react';
import { PiListPlusFill } from 'react-icons/pi';
import { BuildingOfficeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Organization {
  _id: string;
  name: string;
  email: string;
  website?: string;
  logo?: string;
  createdAt: string;
}

export default function AddOrganizationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [secretCode, setSecretCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setSecretCode('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/organizer/organizations');
      const data = await response.json();
      
      if (response.ok) {
        setOrganizations(data.organizations || []);
      } else {
        console.error('Failed to fetch organizations:', data.error);
        toast.error(data.error || 'Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('An error occurred while fetching organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretCode.trim()) {
      toast.error('Please enter a secret code');
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch('/api/organizer/join-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretCode: secretCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully joined ${data.organizationName}!`);
        setSecretCode('');
        setShowAddForm(false);
        fetchOrganizations(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to join organization');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
      toast.error('An error occurred while joining the organization');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveOrganization = async (organizationId: string, organizationName: string) => {
    if (!confirm(`Are you sure you want to leave ${organizationName}?`)) {
      return;
    }

    setIsRemoving(organizationId);
    try {
      const response = await fetch('/api/organizer/leave-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        toast.success('Left organization successfully');
        fetchOrganizations(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to leave organization');
      }
    } catch (error) {
      console.error('Error leaving organization:', error);
      toast.error('An error occurred while leaving organization');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleDropdownOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchOrganizations();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Add Organization Icon */}
      <button
        onClick={handleDropdownOpen}
        className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
        title="Manage Organizations"
      >
        <PiListPlusFill className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">My Organizations</h3>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Join new organization"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Add Organization Form */}
          {showAddForm && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleJoinOrganization} className="space-y-3">
                <Input
                  placeholder="Enter organization secret code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  disabled={isJoining}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSecretCode('');
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isJoining}
                    disabled={!secretCode.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    Join
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading organizations...</div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No organizations joined yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click the + icon above to join an organization
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <div
                    key={org._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <img
                          src={`/Org-Logos/${org._id}.png`}
                          alt={org.name}
                          className="w-8 h-8 rounded-lg object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {org.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{org.email}</p>
                        {org.website && (
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                          >
                            {org.website}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveOrganization(org._id, org.name)}
                      disabled={isRemoving === org._id}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Leave organization"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!showAddForm && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <p className="text-xs text-gray-600 text-center">
                Get secret codes from organization admins to join
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 