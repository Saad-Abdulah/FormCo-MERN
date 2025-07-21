'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from 'react-hot-toast';
import { IoMdArrowBack, IoMdCopy, IoMdClose } from "react-icons/io";

interface Competition {
  _id: string;
  title: string;
  description: string;
  isTeamEvent: boolean;
  teamSize?: {
    min: number;
    max: number;
  };
  requiredApplicationFields: string[];
  registrationFee: number;
  verificationNeeded: boolean;
  status: 'open' | 'closed';
  deadlineToApply: string;
  skillsRequired: string[];
  eligibility?: string;
  category: string;
  mode: 'online' | 'onsite' | 'hybrid';
  location?: string;
}

interface TeamMember {
  name: string;
  email: string;
  institute?: string;
  contact?: string;
  resume?: string;
  qualification?: string;
  [key: string]: any;
}

interface FormData {
  teamName?: string;
  teamMemberCount?: number;
  teamMembers: TeamMember[];
  // For individual events
  name?: string;
  email?: string;
  institute?: string;
  contact?: string;
  resume?: string;
  qualification?: string;
  // Payment fields
  receiptImage?: File | null;
  transactionId?: string;
  [key: string]: any;
}

export default function ApplyPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [acceptedEligibility, setAcceptedEligibility] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qualificationManualEntry, setQualificationManualEntry] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    teamMembers: [],
    receiptImage: null,
    transactionId: '',
  });

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

    fetchCompetition();
    checkExistingApplication();
  }, [session, status, router]);

  const fetchCompetition = async () => {
    try {
      const response = await fetch(`/api/competitions/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setCompetition(data.competition);
        setFormData(prev => ({
          ...prev,
          teamMemberCount: data.competition.teamSize?.min || 1,
          teamMembers: Array.from({ length: data.competition.teamSize?.min || 1 }, () => ({
            name: '',
            email: '',
            institute: '',
            contact: '',
            resume: '',
            qualification: '',
          }))
        }));
      } else {
        toast.error(data.error || 'Failed to fetch competition details');
        router.push('/events');
      }
    } catch (error) {
      console.error('Error fetching competition:', error);
      toast.error('Failed to fetch competition details');
      router.push('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const response = await fetch(`/api/competitions/${params.id}/check-application`);
      const data = await response.json();

      if (response.ok && data.hasApplied) {
        setHasAlreadyApplied(true);
        setExistingApplication(data.application);
      }
    } catch (error) {
      // If check fails, continue normally (user might not have applied)
      console.log('No existing application found');
    }
  };

  const handleTeamMemberCountChange = (count: number) => {
    setFormData(prev => {
      const newTeamMembers = Array(count).fill(null).map((_, index) => {
        // Keep existing data if available
        if (prev.teamMembers[index]) {
          return prev.teamMembers[index];
        }
        return {
          name: '',
          email: '',
          institute: '',
          contact: '',
          resume: '',
          qualification: '',
        };
      });

      return {
        ...prev,
        teamMemberCount: count,
        teamMembers: newTeamMembers,
      };
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      receiptImage: file,
    }));
  };

  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newTeamMembers = [...prev.teamMembers];
      
      // Only update the specific team member
      newTeamMembers[index] = {
        ...newTeamMembers[index],
        [field]: value,
      };
      
      return {
        ...prev,
        teamMembers: newTeamMembers,
      };
    });
  };

  // Function to fill same value for all team members
  const fillSameForEveryone = (field: string, index: number) => {
    const sourceValue = formData.teamMembers[index][field];
    if (!sourceValue || sourceValue.trim() === '') return;

    setFormData(prev => {
      const newTeamMembers = [...prev.teamMembers];
      newTeamMembers.forEach((member, i) => {
        newTeamMembers[i] = {
          ...newTeamMembers[i],
          [field]: sourceValue,
        };
      });
      
      return {
        ...prev,
        teamMembers: newTeamMembers,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'receiptImage') {
          if (formData.receiptImage) {
            submitData.append('receiptImage', formData.receiptImage);
          }
        } else if (key === 'teamMembers') {
          submitData.append('teamMembers', JSON.stringify(formData.teamMembers));
        } else if (formData[key] !== undefined && formData[key] !== null) {
          submitData.append(key, formData[key].toString());
        }
      });

      const response = await fetch(`/api/competitions/${competition._id}/apply`, {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases more gracefully
        if (data.error?.includes('already applied')) {
          toast.error('You have already submitted an application for this competition.');
          // Redirect to the competition page after a short delay
          setTimeout(() => {
            router.push(`/events/${competition._id}`);
          }, 2000);
          return;
        }
        
        // Handle other errors
        toast.error(data.error || 'Failed to submit application');
        return;
      }

      // Show success popup with verification code
      setVerificationCode(data.application.verificationCode || '');
      setShowSuccessPopup(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Error:', error);
      
      // More graceful error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      
      if (errorMessage.includes('already applied')) {
        toast.error('You have already submitted an application for this competition.');
        setTimeout(() => {
          router.push(`/events/${competition._id}`);
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy verification code to clipboard
  const copyVerificationCode = async () => {
    const textToCopy = `Competition: ${competition?.title}\nVerification-Code: ${verificationCode}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Verification code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Close popup and redirect to competition page
  const closePopup = () => {
    setShowSuccessPopup(false);
    router.push(`/events/${competition?._id}`);
  };

  // Helper function to get field label
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

  // Helper function to get field type
  const getFieldType = (field: string): string => {
    const types: Record<string, string> = {
      email: 'email',
      contact: 'tel',
    };
    return types[field] || 'text';
  };

  // Helper function to get field placeholder
  const getFieldPlaceholder = (field: string): string => {
    const placeholders: Record<string, string> = {
      name: 'Enter full name',
      email: 'Enter email address',
      institute: 'Enter institute/university name',
      contact: 'Enter contact number',
      resume: 'Enter resume/CV link',
      qualification: 'Enter qualification details',
    };
    return placeholders[field] || `Enter ${getFieldLabel(field).toLowerCase()}`;
  };

  const renderField = (field: string, value: string, onChange: (value: string) => void, fieldKey: string) => {
    if (field.toLowerCase().includes('statement') || field.toLowerCase().includes('details')) {
      return (
        <div key={field} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {getFieldLabel(field)}
          </label>
          <textarea
            className="block w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getFieldPlaceholder(field)}
            required
          />
        </div>
      );
    }

    // Special handling for qualification field
    if (field === 'qualification') {
      const qualificationOptions = [
        { value: '', label: 'Select Qualification' },
        { value: 'BS', label: 'BS' },
        { value: 'MS/PhD', label: 'MS/PhD' },
        { value: 'Inter', label: 'Inter' },
        { value: 'Matric', label: 'Matric' },
        { value: 'other', label: 'Other (Enter manually)' }
      ];

      const isManualEntry = qualificationManualEntry[fieldKey] || 
        (value && !['BS', 'MS/PhD', 'Inter', 'Matric'].includes(value));

      // Check if this is a team event and extract member index
      const isTeamEvent = competition?.isTeamEvent;
      const memberIndex = fieldKey.includes('team-') ? parseInt(fieldKey.split('-')[1]) : -1;

      return (
        <div key={field} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {getFieldLabel(field)}
          </label>
          {!isManualEntry ? (
            <select
              className="block w-full px-3 py-2.5 border-0 ring-1 ring-inset ring-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
              value={['BS', 'MS/PhD', 'Inter', 'Matric'].includes(value) ? value : ''}
              onChange={(e) => {
                if (e.target.value === 'other') {
                  setQualificationManualEntry(prev => ({ ...prev, [fieldKey]: true }));
                  onChange('');
                } else {
                  setQualificationManualEntry(prev => ({ ...prev, [fieldKey]: false }));
                  onChange(e.target.value);
                }
              }}
              required
            >
              {qualificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                className="block w-full px-3 py-2 border-0 ring-1 ring-inset ring-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter your qualification"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setQualificationManualEntry(prev => ({ ...prev, [fieldKey]: false }));
                  onChange('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to dropdown
              </button>
            </div>
          )}
          {/* Fill same for everyone button for team events */}
          {isTeamEvent && memberIndex === 0 && value && value.trim() !== '' && (
            <button
              type="button"
              onClick={() => fillSameForEveryone('qualification', memberIndex)}
              className="text-xs text-blue-600 hover:text-blue-500 ml-2"
            >
              Fill same for everyone
            </button>
          )}
        </div>
      );
    }

    // Check if this is institute field in team event
    const isTeamEvent = competition?.isTeamEvent;
    const memberIndex = fieldKey.includes('team-') ? parseInt(fieldKey.split('-')[1]) : -1;
    const isInstituteField = field === 'institute';

    const inputField = (
      <Input
        key={field}
        label={getFieldLabel(field)}
        type={getFieldType(field)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={getFieldPlaceholder(field)}
        required
      />
    );

    // Add "Fill same for everyone" for institute field in team events
    if (isTeamEvent && memberIndex === 0 && isInstituteField) {
      return (
        <div key={field} className="w-full">
          {inputField}
          {value && value.trim() !== '' && (
            <button
              type="button"
              onClick={() => fillSameForEveryone('institute', memberIndex)}
              className="text-xs text-blue-600 hover:text-blue-500 ml-2"
            >
              Fill same for everyone
            </button>
          )}
        </div>
      );
    }

    return inputField;
  };

  if (isLoading) {
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
          ← Back to Events
        </button>
      </div>
    );
  }

  // Check if user has already applied
  if (hasAlreadyApplied && existingApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/events/${competition._id}`)}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                >
                  <IoMdArrowBack className="w-5 h-5" />
                  <span>Back to Competition</span>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Application Already Submitted</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You have already Submitted Application for same Competition</h2>
              <p className="text-gray-600 mb-6">
                Check your Application here
              </p>
            </div>
            <button
              onClick={() => router.push(`/events/${competition._id}/${existingApplication._id}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              View Application
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Generate team member count options
  const teamMemberOptions = competition.teamSize 
    ? Array.from(
        { length: competition.teamSize.max - competition.teamSize.min + 1 },
        (_, i) => ({
          value: (competition.teamSize!.min + i).toString(),
          label: (competition.teamSize!.min + i).toString(),
        })
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/events/${competition._id}`)}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <IoMdArrowBack className="w-5 h-5" />
                <span>Back to Competition</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Apply for Competition</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">{competition?.title}</h2>
          <p className="text-gray-600 mb-6">{competition?.description}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Event Form */}
            {competition?.isTeamEvent ? (
              <div className="space-y-6">
                {/* Team Name */}
                <Input
                  label="Team Name"
                  value={formData.teamName || ''}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  placeholder="Enter your team name"
                  required
                />

                {/* Team Member Count Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Team Members
                  </label>
                  <Select
                    value={formData.teamMemberCount?.toString() || ''}
                    onChange={(value) => handleTeamMemberCountChange(Number(value))}
                    options={teamMemberOptions}
                    placeholder={`${competition.teamSize?.min}/${competition.teamSize?.max}`}
                    required
                  />
                </div>

                {/* Team Members */}
                {formData.teamMembers.map((member, index) => (
                  <div key={index} className="space-y-4 p-6 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">
                      {index === 0 ? 'Team Head' : `Team Member ${index + 1}`}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {competition.requiredApplicationFields.map((field) => (
                        <div key={field}>
                          {renderField(
                            field,
                            member[field] || '',
                            (value) => handleTeamMemberChange(index, field, value),
                            `team-${index}-${field}`
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Individual Event Form */
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Application Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {competition.requiredApplicationFields.map((field) => (
                    <div key={field}>
                      {renderField(
                        field,
                        (formData as any)[field] || '',
                        (value) => handleInputChange(field, value),
                        `individual-${field}`
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Information */}
            {competition?.registrationFee > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">Registration Fee</h3>
                  <p className="text-yellow-700">
                    This competition requires a registration fee of {competition.registrationFee} /- rs.
                    {competition.verificationNeeded && ' Payment verification will be required.'}
                  </p>
                </div>

                {/* Payment Verification Fields */}
                {competition.verificationNeeded && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-yellow-800">Payment Verification</h4>
                    
                    {/* Transaction ID */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Transaction ID (TID)
                      </label>
                      <input
                        type="text"
                        value={formData.transactionId || ''}
                        onChange={(e) => handleInputChange('transactionId', e.target.value)}
                        placeholder="Enter transaction ID"
                        className="w-full px-3 py-2 border-0 ring-1 ring-inset ring-yellow-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                        required
                      />
                    </div>

                    {/* Receipt Upload */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Receipt Image
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          required
                          id="receipt-upload"
                        />
                        <div className="w-full px-4 py-3 border-0 ring-1 ring-inset ring-yellow-300 rounded-md text-gray-900 bg-white hover:bg-yellow-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-yellow-500 sm:text-sm sm:leading-6 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">
                              {formData.receiptImage ? formData.receiptImage.name : 'Choose receipt image'}
                            </span>
                            <span className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium">
                              Browse
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">
                        Upload a clear image of your payment receipt
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode and Location Information */}
            {competition?.mode !== 'online' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Location Information</h3>
                <p className="text-purple-700">
                  This is a {competition.mode} competition.
                  {competition.location && ` It will be held at: ${competition.location}`}
                </p>
              </div>
            )}

            {/* Eligibility and Required Skills */}
            {(competition?.eligibility || (competition?.skillsRequired && competition.skillsRequired.length > 0)) && (
              <div className="space-y-4">
                {competition?.eligibility && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Eligibility</h3>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                      {competition.eligibility.split('\n').map((item, index) => (
                        <li key={index}>{item.trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {competition?.skillsRequired && competition.skillsRequired.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800 mb-2">Required Skills</h3>
                    <ul className="list-disc list-inside text-green-700">
                      {competition.skillsRequired.map((skill, index) => (
                        <li key={index}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Eligibility Acceptance */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="eligibilityAcceptance"
                checked={acceptedEligibility}
                onChange={(e) => setAcceptedEligibility(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="eligibilityAcceptance" className="text-sm text-gray-700">
                I accept that I have all the above mentioned skills & fulfill eligibility criteria (if you are not eligible then application may get rejected)
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !acceptedEligibility}
                className="w-full sm:w-auto"
              >
                Submit Application
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full mx-4 relative">
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <IoMdClose size={24} />
            </button>

            {/* Content */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-green-600">Application Submitted Successfully!</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
                <p className="text-sm mb-2">
                  <strong>Competition:</strong> {competition?.title}
                </p>
                <p className="text-sm mb-2">
                  <strong>Verification-Code:</strong> <span className="bg-blue-200 text-black px-1 rounded-sm select-text">{verificationCode}</span>
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  (You may be asked for this Verification-Code)
                </p>
              </div>
            </div>

            {/* Copy button */}
            <div className="flex space-x-3">
              <button
                onClick={copyVerificationCode}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex-1"
              >
                <IoMdCopy size={20} />
                <span>Copy Details</span>
              </button>
              <button
                onClick={closePopup}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 