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
        logo: session.user.logo || '',
        createdAt: session.user.createdAt || '',
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
        logo: session.user.logo || '',
        createdAt: session.user.createdAt || '',
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Validation for organization required fields
    if (role === 'organization') {
      if (!editData.name?.trim() || !editData.email?.trim() || !editData.website?.trim() || !editData.logo) {
        toast.error('Name, Email, Website, and Logo are required.');
        setIsLoading(false);
        return;
      }
    }
    try {
      let logoFilename = editData.logo;
      // If logo is a File, upload it first
      if (role === 'organization' && editData.logo && typeof editData.logo !== 'string') {
        const formData = new FormData();
        formData.append('logo', editData.logo);
        // Always use session.user.id as organizationId for logo filename
        const orgId = session?.user?.id;
        if (!orgId) {
          toast.error('Organization ID is missing.');
          setIsLoading(false);
          return;
        }
        formData.append('organizationId', String(orgId));
        const uploadRes = await fetch('/api/organization/upload-logo', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.path) {
          logoFilename = `/Org-Logos/${orgId}.png`;
        } else {
          toast.error(uploadData.error || 'Failed to upload logo');
          setIsLoading(false);
          return;
        }
      }
      const payload = { ...editData, logo: logoFilename };
      const response = await fetch(`/api/${role}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedUser = await response.json();
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditData((prev: any) => ({ ...prev, logo: file }));
    }
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
                onChange={(value) => handleInputChange('educationLevel', value)}
              />
            </>
          )}

          {role === 'organization' && (
            <>
              <Input
                label="Website"
                value={editData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="Enter organization website"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {editData.logo && typeof editData.logo !== 'string' && (
                  <img
                    src={URL.createObjectURL(editData.logo)}
                    alt="Logo Preview"
                    className="mt-2 h-16 w-16 object-contain rounded border"
                  />
                )}
                {editData.logo && typeof editData.logo === 'string' && (
                  <img
                    src={editData.logo}
                    alt="Logo Preview"
                    className="mt-2 h-16 w-16 object-contain rounded border"
                  />
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {role === 'organization' && (
          <>
            <div className="flex items-center gap-3 mb-3">
              {session?.user?.logo && (
                <img
                  src={session?.user?.logo.startsWith('/') ? session.user.logo : `/Org-Logos/${session.user.logo}`}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded border bg-gray-50"
                />
              )}
              <div>
                <p className="text-xs text-gray-500">Registered since</p>
                <p className="font-semibold text-gray-900">{session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="mb-2">
              <a 
                href={session?.user?.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {session?.user?.website}
              </a>
            </div>
            <div className="mb-2">
              <p className="font-medium text-gray-900">{session?.user?.email}</p>
            </div>
            </>
        )}
        
        
        {role === 'organizer' && (
          <>
            {session?.user?.phone && (
              <div>
                <p className="text-sm text-gray-700">Phone</p>
                <p className="font-medium text-gray-800">{session.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-700">Department</p>
              <p className="font-medium text-gray-800">{session?.user?.department || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Position</p>
              <p className="font-medium text-gray-800">{session?.user?.position || 'Not specified'}</p>
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
            <h3 className="text-lg font-medium text-gray-900">{session?.user?.name}</h3>
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