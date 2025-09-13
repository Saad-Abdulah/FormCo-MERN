'use client';

import { useForm, Controller } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { format, set, isAfter, parseISO } from 'date-fns';
import { useOrganization } from '@/context/OrganizationContext';

interface CompetitionFormData {
  title: string;
  description: string;
  instructions: string;
  category: string;
  event?: string;
  mode: 'online' | 'onsite' | 'hybrid';
  location?: string;
  isTeamEvent: boolean;
  teamSize: {
    min: number;
    max: number;
  };
  registrationFee: number;
  verificationNeeded: boolean;
  accountDetails?: {
    name: string;
    number: string;
    type: string;
  };
  requiredApplicationFields: string[];
  skillsRequired: string;
  eligibility?: string;
  status: 'open' | 'closed';
  deadlineToApply?: string;
  startDate?: string;
  endDate?: string;
}

const CATEGORIES = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Social', label: 'Social' },
  { value: 'Computing', label: 'Computing' },
  { value: 'Business', label: 'Business' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Other', label: 'Other' }
];

const MODES = [
  { value: 'online', label: 'Online' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' }
];

// const APPLICATION_FIELDS = [
//   { value: 'name', label: 'Name' },
//   { value: 'email', label: 'Email' },
//   { value: 'institute', label: 'Institute' },
//   { value: 'contact', label: 'Contact' },
//   { value: 'resume', label: 'Resume' },
//   { value: 'qualification', label: 'Qualification' },
// ];

export default function AddCompetition() {
  const { data: session, status } = useSession();
  const { currentOrganization, loading: organizationLoading } = useOrganization();
  const router = useRouter();
  const [customCategory, setCustomCategory] = useState('');
  
  // Helper function to set time for a date
  const setTimeForDate = (date: Date, hours: number, minutes: number): Date => {
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
  };

  // Get default dates with specific times
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return {
      deadline: format(setTimeForDate(today, 23, 59), "yyyy-MM-dd'T'HH:mm"),
      start: format(setTimeForDate(tomorrow, 10, 0), "yyyy-MM-dd'T'HH:mm"),
      end: format(setTimeForDate(tomorrow, 14, 0), "yyyy-MM-dd'T'HH:mm")
    };
  };

  const defaultDates = getDefaultDates();
  
  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<CompetitionFormData>({
    defaultValues: {
      isTeamEvent: false,
      mode: 'onsite',
      status: 'open',
      registrationFee: 0,
      verificationNeeded: false,
      requiredApplicationFields: ['name', 'email'],
      category: '',
      deadlineToApply: defaultDates.deadline,
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      teamSize: {
        min: 1,
        max: 4
      },
      accountDetails: {
        name: '',
        number: '',
        type: ''
      }
    }
  });

  // Watch team event and team size fields
  const isTeamEvent = watch('isTeamEvent');
  const teamSizeMin = watch('teamSize.min');
  const teamSizeMax = watch('teamSize.max');
  const registrationFee = watch('registrationFee');

  // Initialize team size when team event is toggled
  useEffect(() => {
    if (isTeamEvent) {
      setValue('teamSize.min', 1);
      setValue('teamSize.max', 4);
    } else {
      setValue('teamSize', { min: 0, max: 0 });
    }
  }, [isTeamEvent, setValue]);

  const selectedMode = watch('mode');
  // const selectedCategory = watch('category');

  // Watch date fields for validation
  const deadlineToApply = watch('deadlineToApply');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Real-time date validation
  useEffect(() => {
    if (deadlineToApply && startDate) {
      const deadlineDate = parseISO(deadlineToApply);
      const startDateTime = parseISO(startDate);

      if (!isAfter(startDateTime, deadlineDate)) {
        toast.error('Start date must be after application deadline', {
          id: 'start-date-warning',
          duration: 3000
        });
        setValue('startDate', format(
          setTimeForDate(new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000), 10, 0),
          "yyyy-MM-dd'T'HH:mm"
        ));
      }
    }
  }, [deadlineToApply, startDate, setValue]);

  useEffect(() => {
    if (startDate && endDate) {
      const startDateTime = parseISO(startDate);
      const endDateTime = parseISO(endDate);

      if (!isAfter(endDateTime, startDateTime)) {
        toast.error('End date must be after start date', {
          id: 'end-date-warning',
          duration: 3000
        });
        setValue('endDate', format(
          setTimeForDate(new Date(startDateTime.getTime() + 4 * 60 * 60 * 1000), 14, 0),
          "yyyy-MM-dd'T'HH:mm"
        ));
      }
    }
  }, [startDate, endDate, setValue]);

  // Validate dates on change
  const validateDates = (field: 'deadlineToApply' | 'startDate' | 'endDate', value: string) => {
    const date = parseISO(value);
    const now = new Date();

    switch (field) {
      case 'deadlineToApply':
        if (!isAfter(date, now)) {
          toast.error('Warning: Application deadline should be in the future', {
            id: 'deadline-warning',
            duration: 3000
          });
          // Return true to allow past dates, but with a warning
          return true;
        }
        break;

      case 'startDate':
        if (deadlineToApply && !isAfter(date, parseISO(deadlineToApply))) {
          toast.error('Start date must be after application deadline', {
            id: 'start-date-warning',
            duration: 3000
          });
          return false;
        }
        break;

      case 'endDate':
        if (startDate && !isAfter(date, parseISO(startDate))) {
          toast.error('End date must be after start date', {
            id: 'end-date-warning',
            duration: 3000
          });
          return false;
        }
        break;
    }

    return true;
  };

  // Handle custom category input
  useEffect(() => {
    if (customCategory && !CATEGORIES.find(c => c.value === customCategory)) {
      setValue('category', customCategory);
    }
  }, [customCategory, setValue]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!['organization', 'organizer'].includes(session.user?.role)) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Redirect if no organization is selected
  useEffect(() => {
    // Don't redirect while session or organization context is still loading
    if (status === 'loading' || organizationLoading) return;
    
    // Don't redirect if user is not authenticated
    if (status !== 'authenticated' || !session) return;
    
    // For organizers, check if they have an organization
    if (session.user?.role === 'organizer') {
      // If user doesn't have an organization in session, redirect
      if (!session.user?.organizationId) {
        toast.error('Please select an organization first');
        router.push('/dashboard/organizer');
        return;
      }
      
      // If user has organizationId but context hasn't loaded it yet, wait
      if (session.user?.organizationId && !currentOrganization) {
        // This should not happen if context is working properly, but just in case
        return;
      }
    }
    
    // For organizations, they don't need to select an organization
    if (session.user?.role === 'organization') {
      return;
    }
  }, [status, session, currentOrganization, router, organizationLoading]);

  // Handle deadline changes
  const handleDeadlineChange = (value: string) => {
    if (value && value.trim()) {
      const deadlineDate = parseISO(value);
      
      // Always validate the deadline (will show warning if in past)
      validateDates('deadlineToApply', value);

      // Only update start/end dates if deadline is in the future
      if (isAfter(deadlineDate, new Date())) {
        const nextDay = new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000);
        
        // Set start date to 10:00 AM next day
        const newStartDate = format(
          setTimeForDate(nextDay, 10, 0),
          "yyyy-MM-dd'T'HH:mm"
        );
        setValue('startDate', newStartDate);

        // Set end date to 2:00 PM next day
        const newEndDate = format(
          setTimeForDate(nextDay, 14, 0),
          "yyyy-MM-dd'T'HH:mm"
        );
        setValue('endDate', newEndDate);
      }
    }
  };

  const onSubmit = async (data: CompetitionFormData) => {
    try {
      console.log('Raw form data:', data);
      console.log('Team size data:', data.teamSize);
      console.log('Is team event:', data.isTeamEvent);
      
      // Validate team size if it's a team event
      if (data.isTeamEvent) {
        console.log('Validating team size...');
        console.log('Min value:', data.teamSize?.min, 'Type:', typeof data.teamSize?.min);
        console.log('Max value:', data.teamSize?.max, 'Type:', typeof data.teamSize?.max);
        
        if (!data.teamSize?.min || data.teamSize.min < 1) {
          console.log('Frontend validation failed: min < 1');
          toast.error('Minimum team size must be at least 1 for team events');
          return;
        }
        if (!data.teamSize?.max || data.teamSize.max < data.teamSize.min) {
          console.log('Frontend validation failed: max < min');
          toast.error('Maximum team size must be greater than or equal to minimum team size');
          return;
        }
        if (data.registrationFee < 0) {
          console.log('Frontend validation failed: registration fee <= 0');
          toast.error('Registration fee must be greater than 0');
          return;
        }
        console.log('Frontend validation passed');
      }

      // Format the data
      const formattedData = {
        ...data,
        // Convert registration fee to number
        registrationFee: data.registrationFee ? Number(data.registrationFee) : 0,
        // Clean and format skills
        skillsRequired: data.skillsRequired
          ? (typeof data.skillsRequired === 'string' 
              ? data.skillsRequired.split(',') 
              : data.skillsRequired
            ).map(skill => skill.trim())
            .filter(skill => skill.length > 0)
          : [],
        // Ensure team size values are numbers
        teamSize: data.isTeamEvent ? {
          min: Number(data.teamSize?.min || 1),
          max: Number(data.teamSize?.max || 4)
        } : undefined,
        // Ensure required application fields always includes name and email
        requiredApplicationFields: (() => {
          const fields = Array.isArray(data.requiredApplicationFields) ? data.requiredApplicationFields : [];
          const requiredFields = ['name', 'email'];
          
          // Add all selected fields that aren't already in the required fields
          fields.forEach(field => {
            if (!requiredFields.includes(field)) {
              requiredFields.push(field);
            }
          });
          
          return requiredFields;
        })()
      };

      console.log('Formatted data:', formattedData);
      console.log('Formatted team size:', formattedData.teamSize);

      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
        credentials: 'include',
      });

      const result = await response.json();
      console.log('Server response status:', response.status);
      console.log('Server response:', result);
      console.log('Server response details:', result.details);
      console.log('Server response error:', result.error);

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to create competitions');
          router.push('/auth/signin');
          return;
        }
        
        if (response.status === 403) {
          toast.error('You do not have permission to create competitions');
          return;
        }

        if (result.details && Array.isArray(result.details)) {
          // If we have validation errors, show each one
          result.details.forEach((error: string) => {
            toast.error(error);
          });
        } else if (result.error) {
          // Show the main error message
          toast.error(result.error);
        } else {
          toast.error('Failed to create competition. Please check all required fields.');
        }
        return;
      }

      toast.success('Competition created successfully!');
      router.push('/events');
    } catch (error: unknown) {
      console.error('Error creating competition:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      );
    }
  };

  if (status === 'loading' || organizationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !['organization', 'organizer'].includes(session.user?.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Competition</h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>
                
                <div>
                  <Input
                    label="Title"
                    {...register('title', { required: 'Title is required' })}
                    error={errors.title?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    className="w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    {...register('instructions', { required: 'Instructions are required' })}
                    className="w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    rows={4}
                  />
                  {errors.instructions && (
                    <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Important Dates</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="datetime-local"
                    label="Application Deadline"
                    {...register('deadlineToApply', { 
                      required: 'Application deadline is required',
                      validate: {
                        futureDate: (value) => {
                          if (!value) return 'Application deadline is required';
                          // Allow past dates but show warning in validateDates
                          return true;
                        }
                      },
                      onChange: (e) => handleDeadlineChange(e.target.value)
                    })}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleDeadlineChange(value);
                    }}
                    error={errors.deadlineToApply?.message}
                  />
                  
                  <Input
                    type="datetime-local"
                    label="Start Date"
                    {...register('startDate', { 
                      required: 'Start date is required',
                      validate: {
                        afterDeadline: (value) => {
                          if (!value) return 'Start date is required';
                          const isValid = validateDates('startDate', value);
                          return isValid || 'Start date must be after application deadline';
                        }
                      }
                    })}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value.trim()) {
                        validateDates('startDate', value);
                      }
                    }}
                    error={errors.startDate?.message}
                  />
                  
                  <Input
                    type="datetime-local"
                    label="End Date"
                    {...register('endDate', { 
                      required: 'End date is required',
                      validate: {
                        afterStart: (value) => {
                          if (!value) return 'End date is required';
                          const isValid = validateDates('endDate', value);
                          return isValid || 'End date must be after start date';
                        }
                      }
                    })}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value.trim()) {
                        validateDates('endDate', value);
                      }
                    }}
                    error={errors.endDate?.message}
                  />
                </div>
              </div>

              {/* Competition Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Competition Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="flex gap-2">
                      <Controller
                        name="category"
                        control={control}
                        rules={{ required: 'Category is required' }}
                        render={({ field: { value, onChange, ...field } }) => (
                          <Select
                            options={CATEGORIES}
                            placeholder="Select a category"
                            className="flex-1"
                            value={value || ''}
                            onChange={(newValue) => {
                              onChange(newValue);
                              if (newValue) {
                                setCustomCategory('');
                              }
                            }}
                            error={errors.category?.message}
                            {...field}
                          />
                        )}
                      />
                      <Input
                        placeholder="Or enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event (Optional)
                    </label>
                    <Input
                      placeholder="e.g., Nascon, Devcon, ..."
                      {...register('event')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="mode"
                    control={control}
                    rules={{ required: 'Mode is required' }}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Select
                        label="Mode"
                        options={MODES}
                        value={value || 'online'}
                        onChange={onChange}
                        error={errors.mode?.message}
                        {...field}
                      />
                    )}
                  />

                  {selectedMode !== 'online' && (
                    <Input
                      label="Location"
                      placeholder="Enter exact location"
                      {...register('location', { 
                        required: selectedMode === 'onsite' || selectedMode === 'hybrid' ? 'Location is required for on-site events' : false 
                      })}
                      error={errors.location?.message}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Registration Fee"
                    step={500}
                    min={0}
                    value={registrationFee}
                    {...register('registrationFee', { 
                      min: { 
                        value: 0, 
                        message: 'Registration fee cannot be negative' 
                      }
                    })}
                    error={errors.registrationFee?.message}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setValue('registrationFee', value);
                    }}
                  />

                  {/* Only show payment verification and account details if registration fee > 0 */}
                  {registrationFee > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('verificationNeeded')}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Require Receipt(img) and Transaction ID
                        </label>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-700">Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Account Name"
                            placeholder="Enter account holder name"
                            {...register('accountDetails.name', {
                              required: 'Account name is required'
                            })}
                          />
                          <Input
                            label="Account Number"
                            placeholder="Enter account number"
                            {...register('accountDetails.number', {
                              required: 'Account number is required'
                            })}
                          />
                        </div>
                        <Input
                          label="Account Type"
                          placeholder="e.g., JazzCash, Easypaisa, Bank Name"
                          {...register('accountDetails.type', {
                          required: 'Account type is required'
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Settings */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isTeamEvent')}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    This is a team event
                  </label>
                </div>

                {isTeamEvent && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Minimum Team Size"
                      defaultValue={1}
                      {...register('teamSize.min', { 
                        required: isTeamEvent ? 'Minimum team size is required' : false,
                        min: { 
                          value: 1, 
                          message: 'Minimum team size must be at least 1' 
                        },
                        onChange: (e) => {
                          const value = parseInt(e.target.value);
                          if (teamSizeMax && value > teamSizeMax) {
                            toast.error('Minimum team size cannot be greater than maximum team size');
                            e.target.value = teamSizeMax.toString();
                          }
                          setValue('teamSize.min', value);
                        },
                        valueAsNumber: true
                      })}
                      error={errors.teamSize?.min?.message}
                    />
                    
                    <Input
                      type="number"
                      label="Maximum Team Size"
                      defaultValue={4}
                      {...register('teamSize.max', { 
                        required: isTeamEvent ? 'Maximum team size is required' : false,
                        min: { 
                          value: teamSizeMin || 1, 
                          message: 'Maximum team size must be greater than or equal to minimum team size' 
                        },
                        onChange: (e) => {
                          const value = parseInt(e.target.value);
                          setValue('teamSize.max', value);
                        },
                        validate: (value) => {
                          if (!isTeamEvent) return true;
                          if (!value) return 'Maximum team size is required';
                          return value >= (teamSizeMin || 1) || 'Maximum team size must be greater than or equal to minimum team size';
                        },
                        valueAsNumber: true
                      })}
                      error={errors.teamSize?.max?.message}
                    />
                  </div>
                )}
              </div>

              {/* Required Fields */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  {isTeamEvent ? 'Required Team Member Fields' : 'Required Application Fields'}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="name"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Name (Required)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="email"
                      checked={true}
                      readOnly
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 opacity-50"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Email (Required)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="institute"
                      {...register('requiredApplicationFields')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Institute
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="contact"
                      {...register('requiredApplicationFields')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Contact
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="resume"
                      {...register('requiredApplicationFields')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Resume
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      value="qualification"
                      {...register('requiredApplicationFields')}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Qualification
                    </label>
                  </div>
                </div>
                {isTeamEvent && (
                  <p className="text-sm text-gray-500 mt-2">
                    These fields will be required for each team member.
                  </p>
                )}
              </div>

              {/* Skills & Eligibility */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">Skills & Eligibility</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    {...register('skillsRequired')}
                    className="w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="e.g., Data Structures, Algorithms, Problem Solving, Python Programming"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate each skill with a comma. Each skill will be displayed as a separate bullet point.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eligibility Criteria
                  </label>
                  <textarea
                    {...register('eligibility')}
                    className="w-full rounded-md border-0 ring-1 ring-inset ring-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    rows={2}
                    placeholder="e.g., Only 3rd and 4th year students"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Competition
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 