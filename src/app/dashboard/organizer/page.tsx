'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProfileDropdown from '@/components/ProfileDropdown';
import AddOrganizationDropdown from '@/components/AddOrganizationDropdown';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import { RiGlobalLine } from 'react-icons/ri';
import { MdCreateNewFolder } from "react-icons/md";
import { FaTrophy, FaUsers, FaUserTie } from 'react-icons/fa';
import { useOrganization } from '@/context/OrganizationContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  const { currentOrganization } = useOrganization();
  const [secretCode, setSecretCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ competitions: 0, applicants: 0, organizers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/organizer/organizations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
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

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || !currentOrganization?.id) return;
    async function fetchStats() {
      setStatsLoading(true);
      try {
        // Fetch competitions for current organization
        const compsRes = await fetch(`/api/competitions?organizationId=${currentOrganization?.id || ''}`);
        if (!compsRes.ok) {
          throw new Error(`Failed to fetch competitions: ${compsRes.status}`);
        }
        const compsData = await compsRes.json();
        const competitions = compsData.competitions || [];
        
        // Fetch organizers for current organization
        const orgRes = await fetch(`/api/organization/organizers?id=${currentOrganization?.id || ''}`);
        if (!orgRes.ok) {
          throw new Error(`Failed to fetch organizers: ${orgRes.status}`);
        }
        const orgData = await orgRes.json();
        const organizers = orgData.organizers || [];
        
        // Fetch applicants for each competition
        let applicants = 0;
        if (competitions.length > 0) {
          const applicantCounts = await Promise.allSettled(
            competitions.map(async (comp: any) => {
              try {
                const appsRes = await fetch(`/api/competitions/${comp._id}/applications`);
                if (appsRes.ok) {
                  const appsData = await appsRes.json();
                  return appsData.applications?.length || 0;
                }
                return 0;
              } catch {
                return 0;
              }
            })
          );
          applicants = applicantCounts
            .filter(result => result.status === 'fulfilled')
            .reduce((sum, result) => sum + (result as PromiseFulfilledResult<number>).value, 0);
        }
        
        setStats({ competitions: competitions.length, applicants, organizers: organizers.length });
      } catch (e) {
        console.error('Error fetching stats:', e);
        setStats({ competitions: 0, applicants: 0, organizers: 0 });
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [status, session, currentOrganization]);

  // Fetch competitions for current organization only for stats
  const [orgCompetitions, setOrgCompetitions] = useState<any[]>([]);
  useEffect(() => {
    if (!currentOrganization) return;
    async function fetchOrgCompetitions() {
      try {
        const res = await fetch(`/api/competitions?organization=${currentOrganization?.id || ''}`);
        const data = await res.json();
        setOrgCompetitions(data.competitions || []);
      } catch {
        setOrgCompetitions([]);
      }
    }
    fetchOrgCompetitions();
  }, [currentOrganization]);

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner message="Loading organizer dashboard..." />;
  }

  if (!session || session.user?.role !== 'organizer') {
    return null;
  }

  // Show a message if no organization is selected
  // if (!currentOrganization) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold text-gray-900 mb-4">No Organization Selected</h2>
  //         <p className="text-gray-600 mb-6">Please select an organization to view your dashboard.</p>
  //         <OrganizationSwitcher />
  //       </div>
  //     </div>
  //   );
  // }

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
              {/* <div className="transform hover:scale-110 transition-transform duration-200"> */}
              <div>
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
          <Button
            onClick={() => { if (currentOrganization) router.push(`/events?organizationId=${currentOrganization.id}`); }}
            className="bg-blue-600 hover:bg-blue-700 text-white w-48"
            size="sm"
            disabled={!currentOrganization}
          >
            Check out Events
          </Button>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <FaTrophy className="text-blue-500 w-8 h-8 mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Competitions</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{statsLoading ? '...' : stats.competitions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <FaUsers className="text-green-500 w-8 h-8 mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Applicants</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{statsLoading ? '...' : stats.applicants}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <FaUserTie className="text-purple-500 w-8 h-8 mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Organizers</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{statsLoading ? '...' : stats.organizers}</p>
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