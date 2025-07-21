'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import ProfileDropdown from '@/components/ProfileDropdown';
import ApplicationsDropdown from '@/components/ApplicationsDropdown';
import AddOrganizerDropdown from '@/components/AddOrganizerDropdown';
import AddOrganizationDropdown from '@/components/AddOrganizationDropdown';
import SecretCodeDropdown from '@/components/SecretCodeDropdown';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import { MdCreateNewFolder } from "react-icons/md";
import { IoMdArrowBack } from "react-icons/io";
import Image from 'next/image';
import { format } from 'date-fns';

interface Competition {
  _id: string;
  title: string;
  description: string;
  category: string;
  mode: string;
  status: 'open' | 'closed';
  deadlineToApply?: string;
  organizer: {
    name: string;
    position: string;
  };
  organization: {
    name: string;
    logo?: string;
  };
  registrationFee?: number;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/competitions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch competitions');
      }

      setCompetitions(data.competitions || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchCompetitions();
  }, [session, status, router]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getDashboardLink = () => {
    switch (session.user?.role) {
      case 'student':
        return '/dashboard/student';
      case 'organizer':
        return '/dashboard/organizer';
      case 'organization':
        return '/dashboard/organization';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(getDashboardLink())}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <IoMdArrowBack className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Competitions</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Organization/Organizer specific actions */}
              {(session.user?.role === 'organization' || session.user?.role === 'organizer') && (
                <Button
                  onClick={() => router.push('/add-competition')}
                  className="flex items-center space-x-2"
                >
                  <MdCreateNewFolder className="w-5 h-5" />
                  <span>Create Competition</span>
                </Button>
              )}

              {/* Role-specific dropdowns */}
              {session.user?.role === 'organizer' && (
                <>
                  <AddOrganizationDropdown />
                  <OrganizationSwitcher />
                </>
              )}

              {/* Student applications dropdown */}
              {session.user?.role === 'student' && (
                <ApplicationsDropdown />
              )}

              {/* Profile dropdown for all roles */}
              <ProfileDropdown role={session.user?.role} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div
              key={competition._id}
              onClick={() => router.push(`/events/${competition._id}`)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105"
            >
              <div className="p-6">
                {/* Title and Status */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {truncateText(competition.title, 50)}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      competition.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {competition.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-800 mb-4">
                  {truncateText(competition.description, 50)}
                  <span className="text-indigo-600 hover:text-indigo-800 font-medium ml-1">Read more...</span>
                </p>

                {/* Category and Mode */}
                <div className="flex space-x-4 mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    {competition.category}
                  </span>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {competition.mode}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {!competition.registrationFee ? 'No Entry Fee' : `${competition.registrationFee} /- rs`}
                  </span>
                </div>

                {/* Deadline */}
                {competition.deadlineToApply && (
                  <div className="text-sm font-medium text-gray-700 mb-4">
                    Apply by: {format(new Date(competition.deadlineToApply), 'PPP')}
                  </div>
                )}

                {/* Creator Info */}
                <div className="flex flex-col text-sm text-gray-800 mt-4 pt-4 border-t">
                  <span className="font-medium">Created by: {competition.organizer.name}</span>

                  <div className="flex items-center mt-1">
                    {/* Organization Logo */}
                    {competition.organization?.logo && (
                      <Image
                        src={competition.organization.logo}
                        alt={competition.organization.name}
                        width={20}
                        height={20}
                        className="mr-2 rounded-full"
                        onError={(e) => {
                          console.error('Error loading organization logo:', e);
                          // Hide the image on error
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <span>
                      at <span className="font-medium">{competition.organization.name}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 