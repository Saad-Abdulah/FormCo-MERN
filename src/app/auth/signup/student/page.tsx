'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

interface Organization {
  id: string;
  name: string;
  logo?: string;
  website?: string;
}

export default function StudentSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    organizationId: '',
    educationLevel: '',
    yearOrSemester: '',
    country: 'Pakistan',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const educationLevelOptions = [
    { value: 'high-school', label: 'High School' },
    { value: 'college', label: 'College' },
    { value: 'higher-ed', label: 'Higher Education' },
  ];

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // organizationId is now optional, so no validation here
    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Please select your education level';
    }

    if (!formData.yearOrSemester.trim()) {
      newErrors.yearOrSemester = 'Year/semester is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created successfully!');
        router.push('/auth/signin');
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      const result = await signIn('google', {
        callbackUrl: '/auth/select-organization',
      });

      if (result?.error) {
        toast.error('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const selectedOrganization = organizations.find(org => org.id === formData.organizationId);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Signup</h1>
          <p className="text-gray-600">Join FormCo to participate in competitions</p>
        </div>

        {/* Google Sign In */}
        <div className="mb-6">
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <select
              value={formData.organizationId}
              onChange={(e) => handleInputChange('organizationId', e.target.value)}
              className={`
                block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.organizationId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
              `}
            >
              <option value="">Select your institution (optional)</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {selectedOrganization && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md flex items-center gap-3">
                <img 
                  src={`/Org-Logos/${selectedOrganization.id}.png`}
                  alt={selectedOrganization.name}
                  className="w-8 h-8 object-contain rounded"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOrganization.name}
                  </p>
                  {selectedOrganization.website && (
                    <p className="text-xs text-gray-500">
                      {selectedOrganization.website}
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Remove required error for organizationId */}
          </div>

          <Select
            label="Education Level"
            options={educationLevelOptions}
            placeholder="Select your education level"
            value={formData.educationLevel}
            onChange={(value) => handleInputChange('educationLevel', value)}
            error={errors.educationLevel}
            required
          />

          <Input
            label="Year/Semester"
            type="text"
            placeholder="e.g., 3rd Year, 5th Semester"
            value={formData.yearOrSemester}
            onChange={(e) => handleInputChange('yearOrSemester', e.target.value)}
            error={errors.yearOrSemester}
            required
          />

          <Input
            label="Country"
            type="text"
            placeholder="Enter your country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            required
          />

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
            Create Student Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
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