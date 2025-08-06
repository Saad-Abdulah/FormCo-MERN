'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  position: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  position?: string;
  phone?: string;
}

const positionOptions = [
  // Teaching Roles
  { value: 'Professor', label: 'Professor' },
  { value: 'Assistant Professor', label: 'Assistant Professor' },
  { value: 'Lecturer', label: 'Lecturer' },
  { value: 'Lab Instructor', label: 'Lab Instructor' },
  { value: 'Teaching Assistant', label: 'Teaching Assistant' },

  // Organizing/Admin Roles
  { value: 'Event Coordinator', label: 'Event Coordinator' },
  { value: 'Faculty Advisor', label: 'Faculty Advisor' },
  { value: 'Organizing Committee Member', label: 'Organizing Committee Member' },
  { value: 'Department Representative', label: 'Department Representative' },
  { value: 'Sponsor Representative', label: 'Sponsor Representative' },
  { value: 'Volunteer Supervisor', label: 'Volunteer Supervisor' },

  // Senior/Supervisory Roles
  { value: 'Head Of Department', label: 'Head Of Department' },
  { value: 'Event Head', label: 'Event Head' },
  { value: 'Program Director', label: 'Program Director' },
  { value: 'Competition Officer', label: 'Competition Officer' },
  { value: 'Coach', label: 'Coach' },
  { value: 'Mentor', label: 'Mentor' },
  { value: 'Judge', label: 'Judge' },

  // Miscellaneous
  { value: 'Other', label: 'Other' }
];


export default function OrganizerSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [customPosition, setCustomPosition] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.position || (formData.position === 'Other' && !customPosition.trim())) {
      newErrors.position = 'Position is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register/organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          position: formData.position === 'Other' ? customPosition : formData.position,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Registration successful! Please sign in.');
        
        // Sign in the user
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          role: 'organizer',
          redirect: false,
        });

        if (result?.error) {
          toast.error('Failed to sign in after registration');
          router.push('/auth/signin');
        } else {
          router.push('/dashboard/organizer');
        }
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation logic
  const password = formData.password;
  const passwordChecks = {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    length: password.length >= 8,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizer Signup</h1>
          <p className="text-gray-600">Join FormCo to organize and manage competitions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            required
          />

          <Input
            label="Department"
            type="text"
            placeholder="e.g., Computer Science, Mathematics"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            error={errors.department}
            required
          />

          <Select
            label="Position"
            options={positionOptions}
            placeholder="Select your position"
            value={formData.position}
            onChange={(value) => {
              handleInputChange('position', value);
              if (value !== 'Other') setCustomPosition('');
            }}
            error={errors.position}
            required
          />
          {formData.position === 'Other' && (
            <Input
              label="Custom Position"
              type="text"
              placeholder="Enter your position"
              value={customPosition}
              onChange={e => setCustomPosition(e.target.value)}
              error={errors.position}
              required
            />
          )}

          {/* Password Field with Eye Icon */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              required
              //style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="mt-2 mb-4">
            <div className="font-semibold text-sm mb-1">Password must contain:</div>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                {passwordChecks.lower ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-500" />}
                <span className={passwordChecks.lower ? 'text-green-700' : 'text-red-600'}>At least one lowercase letter</span>
              </li>
              <li className="flex items-center gap-2">
                {passwordChecks.upper ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-500" />}
                <span className={passwordChecks.upper ? 'text-green-700' : 'text-red-600'}>At least one uppercase letter</span>
              </li>
              <li className="flex items-center gap-2">
                {passwordChecks.number ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-500" />}
                <span className={passwordChecks.number ? 'text-green-700' : 'text-red-600'}>At least one number</span>
              </li>
              <li className="flex items-center gap-2">
                {passwordChecks.special ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-500" />}
                <span className={passwordChecks.special ? 'text-green-700' : 'text-red-600'}>At least one special character</span>
              </li>
              <li className="flex items-center gap-2">
                {passwordChecks.length ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-red-500" />}
                <span className={passwordChecks.length ? 'text-green-700' : 'text-red-600'}>Minimum 8 characters</span>
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Create Organizer Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 