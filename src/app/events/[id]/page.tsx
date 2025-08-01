'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { IoMdArrowBack } from 'react-icons/io';
import { FiTrash2 } from 'react-icons/fi';
import getCompetitionStatus from '@/lib/utils/getCompetitionStatus';

interface Competition {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  category: string;
  mode: 'online' | 'onsite' | 'hybrid';
  location?: string;
  isTeamEvent: boolean;
  teamSize: {
    min: number;
    max: number;
  };
  registrationFee: number;
  verificationNeeded: boolean;
  requiredApplicationFields: string[];
  skillsRequired: string[];
  eligibility?: string;
  accountDetails?: {
    name: string;
    number: string;
    type: string;
  };
  status: 'open' | 'closed';
  deadlineToApply?: string;
  startDate?: string;
  endDate?: string;
  organizer: {
    _id: string;
    name: string;
    position: string;
  };
  organization: {
    _id: string;
    name: string;
    logo?: string;
  };
}


export default function CompetitionDetail() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const response = await fetch(`/api/competitions/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load competition');
        }

        setCompetition(data.competition);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load competition details';
        toast.error(message);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Competition not found</h1>
        <button
          onClick={() => router.push('/events')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const status = getCompetitionStatus(
    competition.startDate || '',
    competition.endDate || '',
    competition.deadlineToApply || ''
  );
  console.log(status);
  console.log(competition.status);
  console.log(competition.startDate);
  console.log(competition.endDate);
  console.log(competition.deadlineToApply);
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Navigation & Actions */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/events')}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <IoMdArrowBack className="w-5 h-5 mr-2" />
                Back to Events
              </button>
            </div>
            {/* Delete icon for organizer/organization */}
            {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
              <button
                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition"
                title="Delete Competition"
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this competition? This will also delete ALL applications submitted for this competition. This action cannot be undone!')) {
                    try {
                      const res = await fetch(`/api/competitions/${competition._id}`, { method: 'DELETE' });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('Competition and all applications deleted.');
                        router.push('/events');
                      } else {
                        toast.error(data.error || 'Failed to delete competition');
                      }
                    } catch (err) {
                      toast.error('Failed to delete competition');
                    }
                  }
                }}
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Competition Details */}
          <div className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{competition.title}</h1>
              {/* Apply Button - Only for Students */}
              {session?.user?.role === 'student' && (
                <button
                  onClick={() => {
                    if (new Date(competition.deadlineToApply || '') > new Date()) {
                      router.push(`/events/${competition._id}/apply`);
                    }
                  }}
                  disabled={new Date(competition.deadlineToApply || '') <= new Date()}
                  className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1 rounded-lg transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2
      ${new Date(competition.deadlineToApply || '') > new Date()
                      ? 'hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 hover:shadow-xl'
                      : 'opacity-50 cursor-not-allowed'}`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {new Date(competition.deadlineToApply || '') > new Date()
                    ? 'Apply Now'
                    : 'Registration Closed'}
                </button>
              )}


              {/* View Applications Button - Only for Organizers */}
              {(session?.user?.role === 'organizer' || session?.user?.role === 'organization') && (
                <button
                  onClick={() => router.push(`/events/${competition._id}/applications`)}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View Applications</span>
                </button>
              )}
            </div>
            {/* Status */}
            {getCompetitionStatus(competition.startDate, competition.endDate, competition.deadlineToApply, "max-w-fit mb-4")}

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>📂</span> Category</h3>
                <p className="text-gray-800">{competition.category}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>🖥️</span> Mode</h3>
                <p className="text-gray-800 capitalize">{competition.mode}</p>
              </div>
              {competition.location && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>📍</span> Location</h3>
                  <p className="text-gray-800">{competition.location}</p>
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><span>💸</span> Registration Fee</h3>
                  {competition.registrationFee > 0 && competition.accountDetails && (
                    <button
                      onClick={() => setShowAccountDetails(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Account Details
                    </button>
                  )}
                </div>
                <p className="text-gray-800">
                  {!competition.registrationFee ? 'No Entry Fee' : `${competition.registrationFee} /- rs only`}
                </p>
              </div>
            </div>

            {/* Team Information (Professional Card) */}
            <div className={`mb-8 rounded-lg p-5 flex items-center gap-4 ${competition.isTeamEvent ? 'bg-blue-50' : 'bg-green-50'}`}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow">
                {competition.isTeamEvent ? <span className="text-2xl">👥</span> : <span className="text-2xl">🧑‍💻</span>}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {competition.isTeamEvent ? 'Team Event' : 'Individual Event'}
                </h3>
                <p className="text-gray-700">
                  {competition.isTeamEvent
                    ? `Team size: ${competition.teamSize.min} - ${competition.teamSize.max} members`
                    : 'Solo participation only'}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><span>📅</span> Important Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">🕑 Application Deadline</p>
                  <p className="text-gray-800">{competition.deadlineToApply ? format(new Date(competition.deadlineToApply), 'PPP p') : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">🚀 Start Date</p>
                  <p className="text-gray-800">{competition.startDate ? format(new Date(competition.startDate), 'PPP p') : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">🏁 End Date</p>
                  <p className="text-gray-800">{competition.endDate ? format(new Date(competition.endDate), 'PPP p') : 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>📝</span> Description</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{competition.description}</p>
            </div>

            {/* Instructions */}
            <div className="mb-8 bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>📖</span> Instructions</h3>
              <p className="text-gray-800 whitespace-pre-wrap">{competition.instructions}</p>
            </div>

            {/* Skills Required */}
            <div className="mb-8 bg-green-50 border border-green-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>🛠️</span> Required Skills</h3>
              {competition.skillsRequired && competition.skillsRequired.length > 0 ? (
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  {competition.skillsRequired.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No specific skills required</p>
              )}
            </div>

            {/* Eligibility */}
            {competition.eligibility && (
              <div className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>✅</span> Eligibility</h3>
                <ul className="list-disc list-inside text-gray-800 space-y-1">
                  {competition.eligibility.split('\n').map((item, index) => (
                    <li key={index}>{item.trim()}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Fields */}
            <div className="mb-8 bg-gray-50 border border-gray-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><span>📝</span> Required Application Fields</h3>
              <ul className="list-disc list-inside text-gray-800">
                {competition.requiredApplicationFields.map((field) => (
                  <li key={field} className="capitalize">{field}</li>
                ))}
              </ul>
            </div>

            {/* Creator Info */}
            <div className="flex items-center mb-6 text-gray-800 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <span className="font-medium flex items-center gap-2">👤 Created by: {competition.organizer.name}, {competition.organizer.position}</span>
              <span className="mx-2">at</span>
              <div className="flex items-center">
                {competition.organization.logo && (
                  <Image
                    src={competition.organization.logo}
                    alt={competition.organization.name}
                    width={24}
                    height={24}
                    className="mr-2 rounded-full border"
                  />
                )}
                <span className="font-medium">{competition.organization.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details Modal */}
      {showAccountDetails && competition.accountDetails && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-lg border">
            {/* Close Button */}
            <button
              onClick={() => setShowAccountDetails(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <p className="text-gray-900">{competition.accountDetails.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <p className="text-gray-900">{competition.accountDetails.number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <p className="text-gray-900">{competition.accountDetails.type}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 