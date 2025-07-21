import { useForm, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface TeamMemberFields {
  name: string;
  email: string;
  institute?: string;
  contact?: string;
  resume?: string;
  qualification?: string;
  isTeamLead: boolean;
}

interface TeamRegistrationFormData {
  teamName: string;
  members: TeamMemberFields[];
}

interface TeamRegistrationFormProps {
  competitionId: string;
  minTeamSize: number;
  maxTeamSize: number;
  requiredFields: string[];
  onSubmit: (data: TeamRegistrationFormData) => Promise<void>;
}

export default function TeamRegistrationForm({
  competitionId,
  minTeamSize,
  maxTeamSize,
  requiredFields,
  onSubmit
}: TeamRegistrationFormProps) {
  const [memberCount, setMemberCount] = useState(minTeamSize);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TeamRegistrationFormData>({
    defaultValues: {
      teamName: '',
      members: Array(minTeamSize).fill({
        name: '',
        email: '',
        institute: '',
        contact: '',
        resume: '',
        qualification: '',
        isTeamLead: false
      })
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members"
  });

  // Set first member as team lead by default
  useEffect(() => {
    setValue('members.0.isTeamLead', true);
  }, [setValue]);

  // Handle member count changes
  const handleMemberCountChange = (newCount: number) => {
    if (newCount < minTeamSize) {
      toast.error(`Team must have at least ${minTeamSize} members`);
      return;
    }
    if (newCount > maxTeamSize) {
      toast.error(`Team cannot have more than ${maxTeamSize} members`);
      return;
    }

    const currentCount = fields.length;
    if (newCount > currentCount) {
      // Add members
      for (let i = 0; i < newCount - currentCount; i++) {
        append({
          name: '',
          email: '',
          institute: '',
          contact: '',
          resume: '',
          qualification: '',
          isTeamLead: false
        });
      }
    } else {
      // Remove members from the end
      for (let i = currentCount - 1; i >= newCount; i--) {
        remove(i);
      }
    }
    setMemberCount(newCount);
  };

  const handleFormSubmit = async (data: TeamRegistrationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting team registration:', error);
      toast.error('Failed to submit team registration');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Input
          label="Team Name"
          {...register('teamName', { required: 'Team name is required' })}
          error={errors.teamName?.message}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Number of Team Members
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={memberCount}
            onChange={(e) => handleMemberCountChange(parseInt(e.target.value))}
            min={minTeamSize}
            max={maxTeamSize}
            className="w-20 rounded-md border border-gray-300 px-3 py-2"
          />
          <span className="text-sm text-gray-500">
            (Min: {minTeamSize}, Max: {maxTeamSize})
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              {index === 0 ? 'Team Lead' : `Team Member ${index + 1}`}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                {...register(`members.${index}.name`, { 
                  required: 'Name is required' 
                })}
                error={errors.members?.[index]?.name?.message}
              />
              
              <Input
                label="Email"
                type="email"
                {...register(`members.${index}.email`, { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                error={errors.members?.[index]?.email?.message}
              />

              {requiredFields.includes('institute') && (
                <Input
                  label="Institute"
                  {...register(`members.${index}.institute`, { 
                    required: 'Institute is required' 
                  })}
                  error={errors.members?.[index]?.institute?.message}
                />
              )}

              {requiredFields.includes('contact') && (
                <Input
                  label="Contact"
                  {...register(`members.${index}.contact`, { 
                    required: 'Contact is required' 
                  })}
                  error={errors.members?.[index]?.contact?.message}
                />
              )}

              {requiredFields.includes('qualification') && (
                <Input
                  label="Qualification"
                  {...register(`members.${index}.qualification`, { 
                    required: 'Qualification is required' 
                  })}
                  error={errors.members?.[index]?.qualification?.message}
                />
              )}

              {requiredFields.includes('resume') && (
                <Input
                  type="file"
                  label="Resume"
                  accept=".pdf,.doc,.docx"
                  {...register(`members.${index}.resume`, { 
                    required: 'Resume is required' 
                  })}
                  error={errors.members?.[index]?.resume?.message}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Register Team
        </Button>
      </div>
    </form>
  );
} 