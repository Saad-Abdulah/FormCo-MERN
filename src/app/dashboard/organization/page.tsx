'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import ProfileDropdown from '@/components/ProfileDropdown';
import AddOrganizerDropdown from '@/components/AddOrganizerDropdown';
import SecretCodeDropdown from '@/components/SecretCodeDropdown';

export default function OrganizationDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user is actually an organization
    if (session.user?.role !== 'organization') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'organization') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {session.user?.logo && (
                <img
                  src={session.user.logo}
                  alt="Organization Logo"
                  className="w-16 h-16 object-contain rounded border"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {session.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="transform hover:scale-110 transition-transform duration-200">
                <AddOrganizerDropdown />
              </div>
              <div className="transform hover:scale-110 transition-transform duration-200">
                <SecretCodeDropdown />
              </div>
              <div className="transform hover:scale-110 transition-transform duration-200">
                <ProfileDropdown role="organization" />
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
          {session.user?.website && (
            <Button
              onClick={() => window.open(session.user.website, '_blank')}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 w-48 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              Visit Website
            </Button>
          )}
        </div>
        {/* Competition list will go here */}


      </main>
    </div>
  );
} 