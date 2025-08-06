'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { IoMdArrowBack } from 'react-icons/io';
import { generateCertificate, CertificateData, checkCertificateExists } from '@/lib/certificate';
import React from 'react';

interface Application {
  _id: string;
  teamName?: string;
  teamMembers: {
    name: string;
    email: string;
    institute?: string;
    contact?: string;
    qualification?: string;
    resume?: string;
  }[];
  createdAt: string;
  paymentVerified: boolean;
  verificationCode?: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  attended?: boolean;
  accepted?: 'pending' | 'accepted' | 'rejected';
}

interface Competition {
  _id: string;
  title: string;
  isTeamEvent: boolean;
  registrationFee: number;
  event?: string;
  startDate: string;
  endDate: string;
  organization: {
    _id: string;
    name: string;
    logo?: string;
  };
  organizer?: {
    _id: string;
    name: string;
    position?: string;
  };
}

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingCertificates, setGeneratingCertificates] = useState<Set<string>>(new Set());
  const [certificateStatus, setCertificateStatus] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = applications.length > 0 && selected.length === applications.length;
  const anySelected = selected.length > 0;
  const [showBulkCertModal, setShowBulkCertModal] = useState(false);
  const [bulkCertMode, setBulkCertMode] = useState<'all' | 'attendees' | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Allow all authenticated users to view applications for now (for testing)
    if (session.user?.role !== 'organizer' && session.user?.role !== 'organization' && session.user?.role !== 'student') {
      router.push('/');
      return;
    }

    fetchApplications();
  }, [session, status, params.id, router]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch competition details
      const competitionResponse = await fetch(`/api/competitions/${params.id}`);
      const competitionData = await competitionResponse.json();
      
      if (!competitionResponse.ok) {
        throw new Error(competitionData.error || 'Failed to fetch competition');
      }
      
      setCompetition(competitionData.competition);

      // Fetch applications
      const applicationsResponse = await fetch(`/api/competitions/${params.id}/applications`);
      const applicationsData = await applicationsResponse.json();
      
      if (!applicationsResponse.ok) {
        throw new Error(applicationsData.error || 'Failed to fetch applications');
      }
      
      setApplications(applicationsData.applications);
      
      // Check certificate status for each application
      const certificateChecks = await Promise.allSettled(
        applicationsData.applications.map(async (app: Application) => {
          if (app.student?._id) {
            const check = await checkCertificateExists(app.student._id, competitionData.competition._id);
            return { applicationId: app._id, exists: check.exists };
          }
          return { applicationId: app._id, exists: false };
        })
      );
      
      const statusMap: Record<string, boolean> = {};
      certificateChecks.forEach((result) => {
        if (result.status === 'fulfilled') {
          statusMap[result.value.applicationId] = result.value.exists;
        }
      });
      setCertificateStatus(statusMap);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamMembersNames = (teamMembers: Application['teamMembers']) => {
    return teamMembers.map(member => member.name).join(', ');
  };

  const handleGenerateCertificate = async (application: Application) => {
    if (!competition) {
      toast.error('Competition data not available');
      return;
    }

    console.log('Application data:', application);
    console.log('Competition data:', competition);

    const studentName = competition.isTeamEvent 
      ? (application.teamName || 'Team')
      : (application.teamMembers[0]?.name || application.student?.name || 'Unknown');

    const certificateData: CertificateData = {
      studentName,
      competitionName: competition.title,
      competitionEvent: competition.event || competition.title,
      competitionId: competition._id,
      startDate: format(new Date(competition.startDate), 'dd MMMM, yyyy'),
      endDate: format(new Date(competition.endDate), 'dd MMMM, yyyy'),
      organizationName: competition.organization?.name || 'Organization',
      organizerName: competition.organizer?.name || 'Organizer',
      organizerPosition: competition.organizer?.position || 'Organizer',
      orgLogoURL: competition.organization?.logo,
      studentId: application.student?._id || application._id,
      isTeamEvent: competition.isTeamEvent,
      teamName: application.teamName,
      teamMembers: application.teamMembers,
    };

    console.log('Certificate data being sent:', certificateData);

    try {
      setGeneratingCertificates(prev => new Set(prev).add(application._id));
      
      await generateCertificate(certificateData);
      toast.success('Certificate generated successfully!');
      setCertificateStatus(prev => ({ ...prev, [application._id]: true }));
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setGeneratingCertificates(prev => {
        const newSet = new Set(prev);
        newSet.delete(application._id);
        return newSet;
      });
    }
  };

  // Bulk update attended
  const bulkUpdateAttended = async (attended: boolean) => {
    try {
      await Promise.all(selected.map(id =>
        fetch(`/api/competitions/${params.id}/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attended }),
        })
      ));
      toast.success(`Marked as ${attended ? 'Present' : 'Absent'} for selected`);
      fetchApplications();
      setSelected([]);
    } catch {
      toast.error('Failed to update attendance');
    }
  };

  // Bulk update accepted
  const bulkUpdateAccepted = async (accepted: 'pending' | 'accepted' | 'rejected') => {
    try {
      await Promise.all(selected.map(id =>
        fetch(`/api/competitions/${params.id}/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accepted }),
        })
      ));
      toast.success(`Status set to ${accepted} for selected`);
      fetchApplications();
      setSelected([]);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Bulk generate certificates (with modal)
  const bulkGenerateCertificates = async (mode: 'all' | 'attendees') => {
    if (!competition) return;
    try {
      let toGenerate = selected;
      if (mode === 'attendees') {
        toGenerate = selected.filter(appId => {
          const app = applications.find(a => a._id === appId);
          return app?.attended;
        });
      }
      setGeneratingCertificates(prev => new Set([...prev, ...toGenerate]));
      await Promise.all(toGenerate.map(appId => {
        const application = applications.find(a => a._id === appId);
        if (!application) return;
        const studentName = competition.isTeamEvent 
          ? (application.teamName || 'Team')
          : (application.teamMembers[0]?.name || application.student?.name || 'Unknown');
        const certificateData: CertificateData = {
          studentName,
          competitionName: competition.title,
          competitionEvent: competition.event || competition.title,
          competitionId: competition._id,
          startDate: format(new Date(competition.startDate), 'dd MMMM, yyyy'),
          endDate: format(new Date(competition.endDate), 'dd MMMM, yyyy'),
          organizationName: competition.organization?.name || 'Organization',
          organizerName: competition.organizer?.name || 'Organizer',
          organizerPosition: competition.organizer?.position || 'Organizer',
          orgLogoURL: competition.organization?.logo,
          studentId: application.student?._id || application._id,
          isTeamEvent: competition.isTeamEvent,
          teamName: application.teamName,
          teamMembers: application.teamMembers,
        };
        return generateCertificate(certificateData);
      }));
      toast.success('Certificates generated for selected!');
      fetchApplications();
      setSelected([]);
    } catch {
      toast.error('Failed to generate certificates');
    } finally {
      setGeneratingCertificates(new Set());
      setShowBulkCertModal(false);
      setBulkCertMode(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(`/events/${params.id}`)}
                className="text-indigo-600 hover:text-indigo-800 font-medium mb-2 flex items-center"
              >
                <IoMdArrowBack className="w-5 h-5 mr-2" />
                Back to Competition
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
              <p className="text-gray-600 mt-1">
                {competition?.title} - {applications.length} application{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length > 0 && (
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => setSelected(e.target.checked ? applications.map(a => a._id) : [])}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm text-gray-700 font-medium">Select All</span>
              {anySelected && (session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
                <div className="ml-6 flex flex-wrap gap-2 items-center bg-gray-100 px-4 py-2 rounded">
                  <button onClick={() => bulkUpdateAttended(true)} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Mark Present</button>
                  <button onClick={() => bulkUpdateAttended(false)} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Mark Absent</button>
                  <select onChange={e => bulkUpdateAccepted(e.target.value as any)} defaultValue="" className="border rounded px-2 py-1 text-xs font-medium text-black">
                    <option value="" disabled>Set Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button onClick={() => setShowBulkCertModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium">Generate Certificates</button>
                </div>
              )}
            </div>
          )}
          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-gray-500 text-lg">No applications received yet</div>
              <p className="text-gray-600 mt-2">Applications will appear here once students start applying</p>
            </div>
          ) : (
            applications.map((application, index) => (
              <div key={application._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(application._id)}
                  onChange={e => setSelected(e.target.checked ? [...selected, application._id] : selected.filter(id => id !== application._id))}
                  className="mr-4 w-4 h-4"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index + 1}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                       competition?.registrationFee === 0
                         ? 'bg-green-100 text-green-800'
                         : application.paymentVerified
                           ? 'bg-green-100 text-green-800'
                           : 'bg-yellow-100 text-yellow-800'
                     }`}>
                       {competition?.registrationFee === 0 
                         ? 'Free Registration' 
                         : (application.paymentVerified ? 'Payment Verified' : 'Payment Pending')
                       }
                     </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm items-center">
                    <div>
                      <span className="font-medium text-gray-700">
                        {competition?.isTeamEvent ? 'Team Name:' : 'Applicant:'}
                      </span>
                      <p className="text-gray-600 mt-1">
                        {competition?.isTeamEvent 
                          ? (application.teamName || 'N/A')
                          : (application.teamMembers[0]?.name || 'N/A')
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        {competition?.isTeamEvent ? 'Team Members:' : 'Email:'}
                      </span>
                      <p className="text-gray-600 mt-1">
                        {competition?.isTeamEvent 
                          ? getTeamMembersNames(application.teamMembers)
                          : (application.teamMembers[0]?.email || 'N/A')
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Verification Code:</span>
                      <p className="text-gray-600 mt-1">
                        <span className="bg-blue-200 text-black px-1 rounded-sm select-text">
                          {application.verificationCode || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Certificate:</span>
                      <p className="text-gray-600 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          certificateStatus[application._id]
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {certificateStatus[application._id] ? 'Generated' : 'Not Generated'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Attended:</span>
                      <p className="text-gray-600 mt-1">
                        {application?.attended ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className="text-gray-600 mt-1">
                        {application.accepted === 'accepted' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Accepted</span>}
                        {application.accepted === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>}
                        {(!application.accepted || application.accepted === 'pending') && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">Pending</span>}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-2 flex flex-col space-y-2">
                  <button
                    onClick={() => router.push(`/events/${params.id}/${application._id}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    View Details
                  </button>
                  {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
                    <button
                      onClick={() => handleGenerateCertificate(application)}
                      disabled={generatingCertificates.has(application._id)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                        generatingCertificates.has(application._id)
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {generatingCertificates.has(application._id) ? 'Generating...' : 'Generate Certificate'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Bulk Certificate Modal */}
      {showBulkCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Generate Certificates for</h2>
            <div className="flex flex-col gap-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium self-center min-w-fit"
                style={{minWidth: 'fit-content'}}
                onClick={() => { setBulkCertMode('all'); bulkGenerateCertificates('all'); }}
              >
                All Selected
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium self-center min-w-fit"
                style={{minWidth: 'fit-content'}}
                onClick={() => { setBulkCertMode('attendees'); bulkGenerateCertificates('attendees'); }}
              >
                Attendees Only
              </button>
              <button
                className="mt-2 text-gray-500 hover:text-gray-700 underline self-center min-w-fit"
                style={{minWidth: 'fit-content'}}
                onClick={() => { setShowBulkCertModal(false); setBulkCertMode(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 