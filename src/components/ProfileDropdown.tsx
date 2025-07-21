'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { UserCircleIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface ProfileDropdownProps {
  role: 'student' | 'organization' | 'organizer';
  className?: string;
}

export default function ProfileDropdown({ role, className }: ProfileDropdownProps) {
  const { data: session, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      setEditData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        department: session.user.department || '',
        position: session.user.position || '',
        educationLevel: session.user.educationLevel || '',
        website: session.user.website || '',
      });
    }
  }, [session]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data
    if (session?.user) {
      setEditData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        department: session.user.department || '',
        position: session.user.position || '',
        educationLevel: session.user.educationLevel || '',
        website: session.user.website || '',
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${role}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            ...updatedUser.user,
          },
        });
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const educationLevelOptions = [
    { value: 'high-school', label: 'High School' },
    { value: 'college', label: 'College' },
    { value: 'higher-ed', label: 'Higher Education' },
  ];

  const renderProfileFields = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <Input
            label="Name"
            value={editData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your name"
          />
          
          {role === 'organizer' && (
            <>
              <Input
                label="Phone"
                value={editData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
              <Input
                label="Department"
                value={editData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Enter your department"
              />
              <Input
                label="Position"
                value={editData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="Enter your position"
              />
            </>
          )}

          {role === 'student' && (
            <>
              <Input
                label="Phone"
                value={editData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
              <Select
                label="Education Level"
                options={educationLevelOptions}
                value={editData.educationLevel}
                onChange={(e) => handleInputChange('educationLevel', e.target.value)}
              />
            </>
          )}

          {role === 'organization' && (
            <Input
              label="Website"
              value={editData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="Enter organization website"
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="font-medium">{session?.user?.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Email</p>
          <p className="font-medium">{session?.user?.email}</p>
        </div>
        
        {role === 'organizer' && (
          <>
            {session?.user?.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{session.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium">{session?.user?.department || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Position</p>
              <p className="font-medium">{session?.user?.position || 'Not specified'}</p>
            </div>
          </>
        )}

        {role === 'student' && (
          <>
            {session?.user?.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{session.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Institution</p>
              <p className="font-medium">{session?.user?.organization || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Education Level</p>
              <p className="font-medium">{session?.user?.educationLevel || 'Not specified'}</p>
            </div>
          </>
        )}

        {role === 'organization' && (
          <>
            {session?.user?.website && (
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a 
                  href={session.user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {session.user.website}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Secret Code</p>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {session?.user?.secretCode || 'N/A'}
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <UserCircleIcon className="h-8 w-8" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Profile</h3>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit profile"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex space-x-1">
                  <button
                    onClick={handleCancel}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Cancel"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                    title="Save changes"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {renderProfileFields()}
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex space-x-2 p-4 border-t border-gray-200">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isLoading}
                size="sm"
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          )}

          {!isEditing && (
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={() => signOut()}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 