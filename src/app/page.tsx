'use client';
import Image from "next/image";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      if (session.user.role === 'student') router.replace('/dashboard/student');
      else if (session.user.role === 'organizer') router.replace('/dashboard/organizer');
      else if (session.user.role === 'organization') router.replace('/dashboard/organization');
    }
  }, [session, status, router]);

  const roles = [
    {
      title: "Student",
      description: "Discover and apply for competitions from various organizations. Track your applications, view results, and showcase your achievements in a centralized platform designed for academic excellence.",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200 hover:border-blue-300",
      textColor: "text-blue-900",
      signupLink: "/auth/signup/student"
    },
    {
      title: "Organisation",
      description: "Manage your institution's competition ecosystem. Create and oversee competitions, review applications, and connect with talented students while maintaining full control over your organizational presence.",
      bgColor: "bg-green-50 hover:bg-green-100", 
      borderColor: "border-green-200 hover:border-green-300",
      textColor: "text-green-900",
      signupLink: "/auth/signup/organization"
    },
    {
      title: "Organiser",
      description: "Design and coordinate competitions within authorized organizations. Manage competition workflows, evaluate participants, and facilitate seamless interaction between students and institutions.",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      borderColor: "border-purple-200 hover:border-purple-300", 
      textColor: "text-purple-900",
      signupLink: "/auth/signup/organizer"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to FormCo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Choose your role to get started with our comprehensive competition management platform
          </p>
          
          {/* Sign In Link */}
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/signin"
              className="text-gray-600 hover:text-gray-800 font-medium underline decoration-2 underline-offset-4"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <Link
              key={role.title}
              href={role.signupLink}
              className={`${role.bgColor} ${role.borderColor} border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer block`}
            >
              {/* Role Title */}
              <h2 className={`text-2xl font-bold ${role.textColor} mb-6 text-center`}>
                {role.title}
              </h2>

              {/* Role Description */}
              <p className="text-gray-700 text-base leading-relaxed mb-8 text-center">
                {role.description}
              </p>

              {/* Call to Action */}
              <div className="text-center">
                <span className={`${role.textColor} text-sm font-medium border-b-2 ${role.borderColor.replace('border-', 'border-b-').replace('hover:', '')} pb-1`}>
                  Sign Up as {role.title}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 text-sm">
            Connecting students, organizations, and organizers through seamless competition management
          </p>
        </div>
      </div>
    </div>
  );
}
