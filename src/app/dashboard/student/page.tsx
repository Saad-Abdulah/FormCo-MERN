'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import ProfileDropdown from '@/components/ProfileDropdown';
import ApplicationsDropdown from '@/components/ApplicationsDropdown';
import { RiGlobalLine } from 'react-icons/ri';
import { Select } from '@/components/ui/Select';
import { MdOutlineCastForEducation } from 'react-icons/md';
import { signIn } from 'next-auth/react';
import { UserIcon } from '@heroicons/react/24/solid';
import { UsersIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Organization {
  id: string;
  name: string;
  email?: string;
  website?: string | null;
  createdAt?: string;
  logo?: string;
  organizersCount?: number;
  competitionsCount?: number;
  applicantsCount?: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [joining, setJoining] = useState(false);
  const [showJoinDrawer, setShowJoinDrawer] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    fetchOrganizations();
  }, [session, status, router]);

  useEffect(() => {
    if (!showJoinDrawer) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowJoinDrawer(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        !(document.getElementById('join-org-popover')?.contains(e.target as Node))
      ) {
        setShowJoinDrawer(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showJoinDrawer]);

  // Fetch organizers and competitions count for each org
  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const res = await fetch('/api/organizations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      if (data.organizations) {
        // For each org, fetch organizers, competitions, and applicants count
        const orgsWithCounts = await Promise.allSettled(
          data.organizations.map(async (org: Organization) => {
            try {
              const [orgRes, compRes] = await Promise.allSettled([
                fetch(`/api/organization/organizers?id=${org.id}`),
                fetch(`/api/competitions?organizationId=${org.id}`)
              ]);
              
              let organizersCount = 0;
              let competitionsCount = 0;
              let applicantsCount = 0;
              
              if (orgRes.status === 'fulfilled' && orgRes.value.ok) {
                const orgData = await orgRes.value.json();
                organizersCount = orgData.organizers?.length || 0;
              }
              
              let competitionIds: string[] = [];
              if (compRes.status === 'fulfilled' && compRes.value.ok) {
                const compData = await compRes.value.json();
                competitionsCount = compData.competitions?.length || 0;
                competitionIds = compData.competitions?.map((c: any) => c._id) || [];
              }
              
              // Fetch applicants for all competitions of this org
              if (competitionIds.length > 0) {
                const applicantCounts = await Promise.allSettled(
                  competitionIds.map(async (compId) => {
                    try {
                      const res = await fetch(`/api/competitions/${compId}/applications`);
                      if (res.ok) {
                        const data = await res.json();
                        return data.applications?.length || 0;
                      }
                      return 0;
                    } catch {
                      return 0;
                    }
                  })
                );
                applicantsCount = applicantCounts
                  .filter(result => result.status === 'fulfilled')
                  .reduce((sum, result) => sum + (result as PromiseFulfilledResult<number>).value, 0);
              }
              
              return { ...org, organizersCount, competitionsCount, applicantsCount };
            } catch (error) {
              console.error(`Error fetching data for organization ${org.id}:`, error);
              return { ...org, organizersCount: 0, competitionsCount: 0, applicantsCount: 0 };
            }
          })
        );
        
        const successfulOrgs = orgsWithCounts
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<Organization>).value);
        
        setOrganizations(successfulOrgs);
      } else {
        setError(data.error || 'Failed to fetch organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to fetch organizations. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!selectedOrgId) return;
    setJoining(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: selectedOrgId }),
      });
      if (res.ok) {
        // Refetch session to update organizationId in session
        if (session && session.user) {
          await signIn('credentials', {
            email: session.user.email,
            password: '', // password not needed for session update
            role: 'student',
            redirect: false,
          });
        }
        window.location.reload();
      }
    } finally {
      setJoining(false);
    }
  };

  const filteredOrgs = organizations
    .filter(org =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      (org.website && org.website.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => (b.competitionsCount || 0) - (a.competitionsCount || 0));

  // Find student's organization
  const studentOrgId = session && session.user ? session.user.organizationId : undefined;
  const studentOrg = studentOrgId ? organizations.find(org => org.id === studentOrgId) : undefined;
  console.log(studentOrg);
  console.log(studentOrgId);
  console.log(session && session.user);
  // Filter and sort organizations: student's org first, then others
  const sortedOrgs = [
    ...(studentOrg ? [{ ...studentOrg, isStudentOrg: true }] : []),
    ...organizations.filter(org => org.id !== studentOrgId)
  ];

  // Only show join popover if student has no org or is selecting a different org
  const hasOrg = !!studentOrgId;
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);
  const canJoin = selectedOrgId && selectedOrgId !== studentOrgId;

  // Highlight search match in org name
  function highlightMatch(text: string, search: string) {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-blue-200 rounded">{part}</span> : <span key={i}>{part}</span>
    );
  }

  if (status === 'loading' || loading) {
    return <LoadingSpinner message="Loading student dashboard..." />;
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
              <button
                ref={buttonRef}
                className="p-2 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="Join Organization"
                onClick={() => setShowJoinDrawer((v) => !v)}
              >
                <MdOutlineCastForEducation size={28} className="text-blue-600" />
              </button>
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

      {/* Join Organization Popover */}
      {showJoinDrawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <div
            id="join-org-popover"
            className="absolute z-50 right-0 mt-2 mr-25 w-180 max-w-full bg-white rounded-xl shadow-2xl border p-6"
            style={{ top: '80px' }} // adjust as needed for header height
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MdOutlineCastForEducation className="text-blue-600" /> Join Organization
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                onClick={() => setShowJoinDrawer(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded flex flex-col items-center">
              {hasOrg ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-800 font-medium">Current Organization:</span>
                  {studentOrg && (
                    <>
                      <img
                        src={`/Org-Logos/${studentOrg.id}.png`}
                        alt={studentOrg.name}
                        className="h-6 w-6 object-contain rounded border bg-gray-50"
                        style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="font-semibold text-gray-900 ml-1" style={{ fontSize: '1.1em' }}>{studentOrg.name}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-yellow-800 font-medium mb-2">You are not part of any organization yet.</p>
              )}
              <div className="w-full max-w-xs mb-2">
                <Select
                  options={organizations.map(org => ({ value: org.id, label: org.name }))}
                  value={selectedOrgId}
                  onChange={setSelectedOrgId}
                  placeholder="Select organization to join"
                />
              </div>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={handleJoinOrganization}
                disabled={!canJoin || joining}
                isLoading={joining}
              >
                Join Organization
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-3 mb-6">
          <input
            type="text"
            placeholder="Search organizations..." // Ensure placeholder is always set
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black" />
          <div className="mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 rounded-lg border border-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={() => router.push('/events/all')}
            >
              Browse All Competitions
            </button>
          </div>

        </div>
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        {/* Organization Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-40">
          {sortedOrgs.map((org, idx) => {
            const isStudentOrg = 'isStudentOrg' in org && org.isStudentOrg;
            return (
              <div
                key={org.id}
                className="bg-white rounded-xl border-t-4 border-indigo-500 border border-blue-800 p-6 flex flex-col items-center hover:shadow-lg duration-300 relative min-w-[320px] max-w-[380px] w-full"
                style={{ minHeight: '340px', background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)' }}
              >
                {isStudentOrg && (
                  <span className="absolute top-3 right-3 rounded-full p-1" title="Your Organization">
                    <MdOutlineCastForEducation className="text-blue-600" size={22} />
                  </span>
                )}
                <img
                  src={`/Org-Logos/${org.id}.png`}
                  alt={org.name}
                  className="w-22 h-22 object-contain rounded-full border mb-2 bg-gray-50 mx-auto"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                <h2 className="text-xl font-extrabold text-gray-900 mb-2 text-center truncate w-full" title={org.name}>
                  {highlightMatch(org.name, search)}
                </h2>
                <div className="flex flex-row w-full flex-1 mt-2 gap-2 items-stretch h-full">
                  <div className="flex flex-col gap-2 flex-1 justify-start items-start h-full">
                    <span className="flex items-center gap-2 text-green-700 text-base font-semibold whitespace-nowrap">
                      <TrophyIcon className="w-5 h-5" />
                       <span className="flex items-center gap-1"><span>Competitions:</span> <span className="font-bold">{org.competitionsCount}</span></span>
                      </span>
                    <span className="flex items-center gap-2 text-purple-700 text-base font-semibold whitespace-nowrap">
                      <UsersIcon className="w-5 h-5" />
                        <span className="flex items-center gap-1"><span>Applicants:</span> <span className="font-bold">{org.applicantsCount}</span></span>
                      </span>
                    <span className="flex items-center gap-2 text-blue-700 text-base font-semibold whitespace-nowrap">
                      <UserIcon className="w-5 h-5" />
                        <span className="flex items-center gap-1"><span>Organizers:</span> <span className="font-bold">{org.organizersCount}</span></span>
                     </span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1 justify-end items-end text-right h-full">
                    <button
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:scale-105 transition transform text-white font-bold py-1 px-4 rounded-lg shadow-md flex items-center gap-2 text-base w-fit self-center"
                      onClick={() => router.push(`/events?organizationId=${org.id}`)}
                    >
                      <CalendarIcon className="w-4 h-4" /> Events
                    </button>
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 truncate max-w-[120px] self-center"
                        title={org.website}
                      >
                        {org.website}
                      </a>
                    )}
                  </div>
                </div>
                {/* Registered since at the bottom, centered */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-4 justify-center w-full font-normal">
                  <CalendarIcon className="w-4 h-4 text-gray-300 inline-block mr-1" />
                  Registered since{' '}
                  <span className="ml-1">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
} 