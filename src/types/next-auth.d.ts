import NextAuth from 'next-auth';

interface Organization {
  _id: string;
  name: string;
  email: string;
  website?: string;
  logo?: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'student' | 'organization' | 'organizer';
      organizationId?: Organization | string;
      organization?: Organization;
      secretCode?: string;
      department?: string;
      position?: string;
      educationLevel?: string;
      phone?: string;
      website?: string;
      isApproved?: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'organization' | 'organizer';
    organizationId?: Organization | string;
    organization?: Organization;
    secretCode?: string;
    department?: string;
    position?: string;
    educationLevel?: string;
    phone?: string;
    website?: string;
    isApproved?: boolean;
    image?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'student' | 'organization' | 'organizer';
    organizationId?: Organization | string;
    organization?: Organization;
    secretCode?: string;
    department?: string;
    position?: string;
    educationLevel?: string;
    phone?: string;
    website?: string;
    isApproved?: boolean;
  }
}

// Global type extension for mongoose
declare global {
  var mongoose: {
    conn: any;
    promise: any;
  };
} 