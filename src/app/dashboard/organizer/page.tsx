'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProfileDropdown from '@/components/ProfileDropdown';
import AddOrganizationDropdown from '@/components/AddOrganizationDropdown';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import { RiGlobalLine } from 'react-icons/ri';
import { MdCreateNewFolder } from "react-icons/md";

interface Organization {
  _id: string;
  name: string;
  email: string;
  website?: string;
  logo?: string;
  createdAt: string;
}

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [secretCode, setSecretCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organizer/organizations');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          router.push('/auth/signin');
          return;
        }
        throw new Error(data.error || 'Failed to fetch organizations');
      }

      setOrganizations(data.organizations || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch organizations';
      setError(message);
      toast.error(message);
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

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated
          router.push('/auth/signin');
          return;
        }
        throw new Error(data.error || 'Failed to join organization');
      }

      toast.success(`Successfully joined ${data.organizationName}!`);
      setSecretCode('');
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while joining the organization';
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user?.role !== 'organizer') {
      router.push('/');
      return;
    }

    // Fetch organizations when organizer is authenticated
    fetchOrganizations();
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'organizer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="transform hover:scale-110 transition-transform duration-200">
                <OrganizationSwitcher />
              </div>
              <div className="transform hover:scale-110 transition-transform duration-200">
                <AddOrganizationDropdown />
              </div>
              <div className="transform hover:scale-110 transition-transform duration-200">
                <ProfileDropdown role="organizer" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-3 mb-6">
          <div className="flex flex-col items-center space-y-2">
            <Button 
              onClick={() => router.push('/events')}
              className="bg-blue-600 hover:bg-blue-700 text-white w-48"
              size="sm"
              disabled={organizations.length === 0}
            >
              Check out Events
            </Button>
            {organizations.length === 0 && !error && (
              <span className="text-sm text-gray-500">
                Join an organization first to access events
              </span>
            )}
            {error && (
              <span className="text-sm text-red-500">
                {error}
              </span>
            )}
          </div>

          {organizations.map((org) => org.website && (
            <Button
              key={org._id}
              onClick={() => window.open(org.website, '_blank')}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 w-48 flex items-center justify-center gap-2"
            >
              <RiGlobalLine className="h-4 w-4" />
              Visit {org.name}
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Organizations Joined</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{organizations.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Active Events</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Participants</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          </div>
        </div>
      </main>
    </div>
  );
} 