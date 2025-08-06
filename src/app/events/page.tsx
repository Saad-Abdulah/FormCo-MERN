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
import { usePathname, useSearchParams } from 'next/navigation';
import getCompetitionStatus from '@/lib/utils/getCompetitionStatus';

interface Competition {
  _id: string;
  title: string;
  description: string;
  category: string;
  mode: string;
  status: 'open' | 'closed';
  deadlineToApply?: string;
  startDate?: string;
  endDate?: string;
  organizer: {
    name: string;
    position: string;
  };
  organization: {
    name: string;
    _id: string;
  };
  registrationFee?: number;
}

export function EventsList({ organizationId }: { organizationId?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCompetitions = async ({organizationId}: {organizationId?: string}) => {
    try {
      const response = await fetch(`/api/competitions?organizationId=${organizationId}`);
      const data = await response.json();
      console.log("data", data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch competitions');
      }

      let comps = data.competitions || [];
      console.log(comps);
      console.log(organizationId);
      if (organizationId) {
        comps = comps.filter((c: any) => {
          const org = c.organization;
          return org && (org._id === organizationId || org.id === organizationId);
        });
      }
      setCompetitions(comps);
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
    fetchCompetitions({organizationId});
  }, [session, status, router, organizationId]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  function highlightMatch(text: string, search: string) {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-blue-200 px-1 rounded">{part}</span> : <span key={i}>{part}</span>
    );
  }

  const filteredCompetitions = competitions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

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
              {session.user?.role === 'organizer' && pathname !== '/events' && (
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
        <div className="flex flex-col items-center mb-8">
          <input
            type="text"
            placeholder="Search competitions by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
          />
        </div>
        {filteredCompetitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No competitions found</h2>
            <p className="text-gray-500">There are currently no competitions for this organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCompetitions.map((competition) => (
              <div
                key={competition._id}
                onClick={() => router.push(`/events/${competition._id}`)}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-2xl flex flex-col h-full"
              >
                <div className="p-6 flex flex-col h-full">
                  {/* Title and Status */}
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {highlightMatch(truncateText(competition.title, 50), search)}
                    </h2>
                    {getCompetitionStatus(competition.startDate, competition.endDate, competition.deadlineToApply)}
                  </div>
                  {/* Description */}
                  <p className="text-gray-700 mb-3 text-sm">
                    {truncateText(competition.description, 70)}
                    <span className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 underline cursor-pointer">Read more...</span>
                  </p>
                  <div className="border-b border-gray-200 my-2" />
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {competition.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                      {competition.mode}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                      {!competition.registrationFee ? 'No Entry Fee' : `${competition.registrationFee} /- rs`}
                    </span>
                  </div>
                  {competition.deadlineToApply && (
                    <div className="flex items-center text-xs text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>Apply by: <span className="font-semibold">{format(new Date(competition.deadlineToApply), 'PPP')}</span></span>
                    </div>
                  )}
                  {/* Organization Info */}
                  <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                    {/* {competition.organization?.id && ( */}
                      <Image
                        src={`/Org-Logos/${competition.organization._id}.png`}
                        alt={competition.organization._id}
                        width={24}
                        height={24}
                        className="mr-2 rounded-full border border-gray-200 bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target) target.style.display = 'none';
                        }}
                      />
                    {/* )} */}
                    <span className="font-medium text-gray-900 text-sm">
                      {competition.organization?.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Default export for /events (all events)
export default function EventsPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId') || undefined;
  console.log(organizationId);
  return <EventsList organizationId={organizationId} />;
} 