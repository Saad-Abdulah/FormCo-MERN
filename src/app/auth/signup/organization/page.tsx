'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function OrganizationSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    website: '',
    logo: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  // Add campus to formData
  const [campus, setCampus] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
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

    if (!logoFile) {
      newErrors.logo = 'Organization logo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      // Show preview
      setFormData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      let nameToSend = formData.name;
      if (campus.trim()) {
        nameToSend = `${formData.name} - ${campus.trim()}`;
      }
      // 1. Create organization
      const response = await fetch('/api/auth/register/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, name: nameToSend, logo: undefined }),
      });
      const data = await response.json();
      if (response.ok && data.organizationId) {
        let logoPath = '';
        // 2. If logo file selected, upload logo
        if (logoFile) {
          const formDataObj = new FormData();
          formDataObj.append('logo', logoFile);
          formDataObj.append('organizationId', data.organizationId);
          const logoRes = await fetch('/api/organization/upload-logo', {
            method: 'POST',
            body: formDataObj,
          });
          const logoData = await logoRes.json();
          if (logoRes.ok && logoData.path) {
            logoPath = logoData.path;
          }
        }
        // 3. Update org profile with logo path if uploaded
        if (logoPath) {
          await fetch('/api/organization/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: logoPath }),
          });
        }
        toast.success(`Organization created! Your secret code is: ${data.secretCode}`);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
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

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          verificationCode: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Email verified successfully! You can now log in.');
        router.push('/auth/signin');
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('New verification code sent!');
      } else {
        toast.error(data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('An unexpected error occurred');
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

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent a 6-digit verification code to
              <br />
              <span className="font-medium text-gray-900">{formData.email}</span>
            </p>
          </div>

          <form onSubmit={handleVerification} className="space-y-6">
            <Input
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setStep('signup')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Signup</h1>
          <p className="text-gray-600">Create your organization account on FormCo</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <Input
            label="Organization Name"
            type="text"
            placeholder="Enter organization name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Campus (Optional)"
            type="text"
            placeholder="e.g., Islamabad, Lahore, Karachi"
            value={campus}
            onChange={e => setCampus(e.target.value)}
          />

          <Input
            label="Official Email"
            type="email"
            placeholder="Enter organization email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            helperText="Enter official email carefully for verification"
            required
          />

          <Input
            label="Website (Optional)"
            type="url"
            placeholder="https://yourorganization.com"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {errors.logo && (
              <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
            )}
            {formData.logo && (
              <div className="mt-2">
                <img
                  src={formData.logo.startsWith('/Org-Logos') ? formData.logo : formData.logo}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain rounded border"
                />
              </div>
            )}
          </div>

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
              // style={{ fontSize: '1.0rem', letterSpacing: '0.1em' }}
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
            Create Organization Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-green-600 hover:text-green-700 font-medium">
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