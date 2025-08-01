'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { IoMdArrowBack } from 'react-icons/io';
import PaymentToggle from '@/components/ui/PaymentToggle';
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
  paymentAmount: number;
  receiptImage?: string;
  transactionId?: string;
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
  requiredApplicationFields: string[];
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

export default function ApplicationDetailsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [certificateExists, setCertificateExists] = useState(false);

  // Function to update payment verification status
  const updatePaymentStatus = async (paymentVerified: boolean) => {
    try {
      const response = await fetch(`/api/competitions/${params.id}/applications/${params.application}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentVerified }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update payment status');
      }

      // Update the application in state
      if (application) {
        setApplication({ ...application, paymentVerified });
      }

      toast.success(`Payment ${paymentVerified ? 'verified' : 'marked as pending'}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update payment status');
    }
  };

  // Update attendance
  const updateAttendance = async (attended: boolean) => {
    try {
      const response = await fetch(`/api/competitions/${params.id}/applications/${params.application}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended }),
      });
      if (!response.ok) throw new Error('Failed to update attendance');
      setApplication(app => app ? { ...app, attended } : app);
      toast.success(attended ? 'Marked as Present' : 'Marked as Absent');
    } catch (e) { toast.error('Failed to update attendance'); }
  };

  // Update accepted status
  const updateAccepted = async (accepted: 'pending' | 'accepted' | 'rejected') => {
    console.log(accepted);
    try {
      const response = await fetch(`/api/competitions/${params.id}/applications/${params.application}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      setApplication(app => app ? { ...app, accepted } : app);
      toast.success(accepted === 'accepted' ? 'Marked as Accepted' : accepted === 'rejected' ? 'Marked as Rejected' : 'Set to Pending');
    } catch (e) { toast.error('Failed to update status'); }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user?.role !== 'organizer' && session.user?.role !== 'organization' && session.user?.role !== 'student') {
      router.push('/');
      return;
    }

    fetchApplicationDetails();
  }, [session, status, params.id, params.application, router]);

  const fetchApplicationDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch competition details
      const competitionResponse = await fetch(`/api/competitions/${params.id}`);
      const competitionData = await competitionResponse.json();
      
      if (!competitionResponse.ok) {
        throw new Error(competitionData.error || 'Failed to fetch competition');
      }
      
      setCompetition(competitionData.competition);

      // Fetch application details
      const applicationResponse = await fetch(`/api/competitions/${params.id}/applications/${params.application}`);
      const applicationData = await applicationResponse.json();
      
      if (!applicationResponse.ok) {
        throw new Error(applicationData.error || 'Failed to fetch application');
      }
      
      setApplication(applicationData.application);
      
      // Check if certificate exists
      if (applicationData.application?.student?._id) {
        try {
          const certificateCheck = await checkCertificateExists(applicationData.application.student._id, competitionData.competition._id);
          setCertificateExists(certificateCheck.exists);
        } catch (error) {
          console.error('Error checking certificate:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch application details');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      institute: 'Institute',
      contact: 'Contact',
      resume: 'Resume',
      qualification: 'Qualification',
    };
    return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  const handleGenerateCertificate = async () => {
    if (!application || !competition) return;

    const studentName = competition.isTeamEvent 
      ? (application.teamName || 'Team')
      : (application.teamMembers[0]?.name || application.student?.name || 'Unknown');

    const certificateData: CertificateData = {
      studentName,
      competitionName: competition.title,
      competitionEvent: competition.event,
      competitionId: competition._id,
      startDate: format(new Date(competition.startDate), 'dd MMMM, yyyy'),
      endDate: format(new Date(competition.endDate), 'dd MMMM, yyyy'),
      organizationName: competition.organization?.name || 'Organization',
      organizerName: competition.organizer?.name,
      organizerPosition: competition.organizer?.position,
      orgLogoURL: competition.organization?.logo,
      studentId: application.student?._id || application._id,
      isTeamEvent: competition.isTeamEvent,
      teamName: application.teamName,
      teamMembers: application.teamMembers,
    };

    try {
      setIsGeneratingCertificate(true);
      
      await generateCertificate(certificateData);
      toast.success('Certificate generated successfully!');
      setCertificateExists(true);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading application details...</div>
      </div>
    );
  }

  if (!application || !competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Application not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push(session?.user?.role === 'student' ? `/events/${params.id}` : `/events/${params.id}/applications`)}
                className="text-indigo-600 hover:text-indigo-800 font-medium mb-2 flex items-center"
              >
              <IoMdArrowBack className="w-5 h-5 mr-2" />
              {session?.user?.role === 'student' ? 'Back to Competition' : 'Back to Applications'}
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600 mt-1">{competition.title}</p>
            </div>
            <div className="flex items-center space-x-3">
              {competition.registrationFee === 0 ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Free Registration
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  application.paymentVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.paymentVerified ? 'Payment Verified' : 'Payment Pending'}
                </span>
              )}
              {application.verificationCode && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Code: {application.verificationCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Application Information */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                <p className="mt-1 text-sm text-gray-900">{format(new Date(application.createdAt), 'PPP p')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                <p className="mt-1 text-sm text-gray-900">{application.student.name} ({application.student.email})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Attendance</label>
                <p className="mt-1 text-sm text-gray-900">
                  {application.attended ? 'Present' : 'Absent'}
                  {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
                    <button
                      onClick={() => updateAttendance(!application.attended)}
                      className={`ml-3 px-3 py-1 rounded text-xs font-medium ${application.attended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      Mark as {application.attended ? 'Absent' : 'Present'}
                    </button>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">
                  {application.accepted === 'accepted' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Accepted</span>}
                  {application.accepted === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>}
                  {(!application.accepted || application.accepted === 'pending') && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">Pending</span>}
                  {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
                    <span className="ml-3">
                      <select
                        value={application. accepted|| 'pending'}
                        onChange={e => updateAccepted(e.target.value as 'pending' | 'accepted' | 'rejected')}
                        className="px-2 py-1 rounded border text-xs font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Team Information */}
          {competition.isTeamEvent && application.teamName && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Team Name</label>
                <p className="mt-1 text-sm text-gray-900">{application.teamName}</p>
              </div>
            </div>
          )}

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {competition.isTeamEvent ? 'Team Members' : 'Applicant Details'}
            </h2>
            <div className="space-y-6">
              {application.teamMembers.map((member, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {competition.isTeamEvent ? (index === 0 ? 'Team Head' : `Team Member ${index + 1}`) : 'Applicant'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competition.requiredApplicationFields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700">
                          {getFieldLabel(field)}
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {member[field as keyof typeof member] || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Certificate</h2>
            
            {/* For Organizers - Generate Certificate Button */}
            {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
              <div className="mb-4">
                <button
                  onClick={handleGenerateCertificate}
                  disabled={isGeneratingCertificate}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                    isGeneratingCertificate
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isGeneratingCertificate ? 'Generating...' : 'Generate Certificate'}
                </button>
              </div>
            )}
            
            {/* For Students - View/Download Certificate */}
            {session?.user?.role === 'student' && (
              <div>
                {certificateExists ? (
                  <div className="flex items-center space-x-4">
                    <a
                      href={`/Certificate-Generator/Cer-Generated/${application.student._id}_${competition._id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      View Certificate
                    </a>
                    <a
                      href={`/Certificate-Generator/Cer-Generated/${application.student._id}_${competition._id}.png`}
                      download
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Download Certificate
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500">Certificate not yet generated by organizer.</p>
                )}
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Fee</label>
                <p className="mt-1 text-sm text-gray-900">
                  {competition.registrationFee > 0 ? `${application.paymentAmount} /- rs` : 'Free'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <div className="mt-2">
                  {competition.registrationFee === 0 ? (
                    <span className="text-sm text-gray-900">No Payment Required</span>
                  ) : session?.user?.role === 'student' ? (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      application.paymentVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.paymentVerified ? 'Payment Verified' : 'Payment Pending'}
                    </span>
                  ) : (
                    <PaymentToggle 
                      verified={application.paymentVerified} 
                      onToggle={updatePaymentStatus}
                    />
                  )}
                </div>
              </div>
              {competition.registrationFee > 0 && application.transactionId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="mt-1 text-sm text-gray-900">{application.transactionId}</p>
                </div>
              )}
              {competition.registrationFee > 0 && application.receiptImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Image</label>
                  <div className="mt-1">
                    <img 
                      src={application.receiptImage} 
                      alt="Payment Receipt" 
                      className="max-w-xs rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 