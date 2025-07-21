'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { IoMdArrowBack } from 'react-icons/io';
import { generateCertificate, CertificateData, checkCertificateExists } from '@/lib/certificate';

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
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingCertificates, setGeneratingCertificates] = useState<Set<string>>(new Set());
  const [certificateStatus, setCertificateStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
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
  }, [session, params.id]);

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
          {applications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-gray-500 text-lg">No applications received yet</div>
              <p className="text-gray-400 mt-2">Applications will appear here once students start applying</p>
            </div>
          ) : (
            applications.map((application, index) => (
              <div key={application._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Application # {index + 1}
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
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
                        <span className="font-medium text-gray-700">Application Date:</span>
                        <p className="text-gray-600 mt-1">
                          {format(new Date(application.createdAt), 'PPP p')}
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
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/events/${params.id}/${application._id}`)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      View Details
                    </button>
                    
                    {/* Generate Certificate Button - Only show for organizers */}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 