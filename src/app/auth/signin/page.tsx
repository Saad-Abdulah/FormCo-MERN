'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'organizer', label: 'Organizer' },
    { value: 'organization', label: 'Organization' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === 'CredentialsSignin' 
          ? 'Invalid email or password' 
          : result.error
        );
      } else if (result?.ok) {
        toast.success('Login successful!');
        
        // Get session to check user role and redirect accordingly
        const session = await getSession();
        if (session?.user?.role) {
          switch (session.user.role) {
            case 'student':
              router.push('/dashboard/student');
              break;
            case 'organizer':
              router.push('/dashboard/organizer');
              break;
            case 'organization':
              router.push('/dashboard/organization');
              break;
            default:
              router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!formData.role) {
      toast.error('Please select your role first');
      return;
    }

    if (formData.role === 'organization') {
      toast.error('Google sign-in is not available for organizations');
      return;
    }

    setIsGoogleLoading(true);

    try {
      const result = await signIn('google', {
        callbackUrl: `/dashboard/${formData.role}`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your FormCo account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="I am a"
            options={roleOptions}
            placeholder="Select your role"
            value={formData.role || ''}
            onChange={(value) => handleInputChange('role', value)}
            error={errors.role}
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
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Google Sign In */}
        {formData.role && formData.role !== 'organization' && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        )}

        {/* Sign Up Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">Don&apos;t have an account?</p>
          <div className="mt-2 space-y-2">
            <Link 
              href="/auth/signup/student" 
              className="block text-blue-600 hover:text-blue-800"
            >
              Sign up as Student
            </Link>
            <Link 
              href="/auth/signup/organizer" 
              className="block text-blue-600 hover:text-blue-800"
            >
              Sign up as Organizer
            </Link>
            <Link 
              href="/auth/signup/organization" 
              className="block text-blue-600 hover:text-blue-800"
            >
              Sign up as Organization
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 