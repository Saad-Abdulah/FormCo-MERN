'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import ProfileDropdown from '@/components/ProfileDropdown';
import ApplicationsDropdown from '@/components/ApplicationsDropdown';
import { RiGlobalLine } from 'react-icons/ri';

interface Organization {
  _id: string;
  name: string;
  website?: string | null;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user?.role !== 'student') {
      router.push('/');
      return;
    }

    // Fetch organization details if we have an organizationId
    if (session.user?.organizationId) {
      const orgId = typeof session.user.organizationId === 'object' 
        ? (session.user.organizationId as any)._id 
        : session.user.organizationId;

      setLoading(true);
      setError(null);
      
      fetch(`/api/organizations/${orgId}`)
        .then(res => {
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
            });
          }
          return res.json();
        })
        .then(data => {
          if (data.organization) {
            setOrganization(data.organization);
          } else {
            throw new Error('Organization data not found');
          }
        })
        .catch(err => {
          console.error('Error fetching organization:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="transform hover:scale-110 transition-transform duration-200">
                <ApplicationsDropdown />
              </div>
              <div className="transform hover:scale-110 transition-transform duration-200">
                <ProfileDropdown role="student" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-3 mb-6">
          <Button 
            onClick={() => router.push('/events')}
            className="bg-blue-600 hover:bg-blue-700 text-white w-48"
            size="sm"
          >
            Check out Events
          </Button>

          {error && (
            <p className="text-sm text-red-600">Error loading organization: {error}</p>
          )}

          {organization?.website && (
            <Button
              onClick={() => window.open(organization.website!, '_blank')}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 w-48 flex items-center justify-center gap-2"
            >
              <RiGlobalLine className="h-4 w-4" />
              Visit {organization.name}
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Competitions Joined</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Submissions</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Awards Won</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Browse Competitions</h3>
            <p className="text-gray-600 mb-4">Find and join exciting competitions</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Browse Competitions
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Submissions</h3>
            <p className="text-gray-600 mb-4">View and manage your submissions</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              View Submissions
            </button>
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