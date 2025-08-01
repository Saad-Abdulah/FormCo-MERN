import NextAuth from 'next-auth';

interface Organization {
  _id: string;
  name: string;
  email: string;
  website?: string;
  logo?: string;
}

declare module 'next-auth' {
  interface User extends Omit<CustomUser, 'organization'> {
    organization?: string;
    logo?: string;
    createdAt?: string;
  }
  interface Session {
    user: CustomUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    organizationId?: string;
    organization?: string;
    secretCode?: string;
    department?: string;
    position?: string;
    educationLevel?: string;
    phone?: string;
    website?: string;
    isApproved?: boolean;
    logo?: string;
    createdAt?: string;
  }
}

// Global type extension for mongoose
declare global {
  var mongoose: {
    conn: any;
    promise: any;
  };
} 