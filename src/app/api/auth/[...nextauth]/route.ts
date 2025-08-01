import NextAuth, { 
  NextAuthOptions, 
  Session, 
  DefaultSession,
  User as NextAuthUser,
  Account,
  Profile 
} from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/database';
import Student from '@/lib/models/Student';
import Organizer, { IOrganizer } from '@/lib/models/Organizer';
import Organization, { IOrganization } from '@/lib/models/Organization';

type UserRole = 'student' | 'organizer' | 'organization';

interface CustomUser {
  id: string;
  email: string;
  name: string;
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

declare module 'next-auth' {
  interface User extends Omit<CustomUser, 'organization'> {
    organization?: string;
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

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          return null;
        }

        const role = credentials.role as UserRole;
        if (!['student', 'organizer', 'organization'].includes(role)) {
          return null;
        }

        try {
          await connectToDatabase();

          let user: any;
          
          switch (role) {
            case 'student':
              user = await Student.findOne({ email: credentials.email }).populate('organizationId');
              break;
            case 'organizer':
              user = await Organizer.findOne({ email: credentials.email }).populate('organizations');
              break;
            case 'organization':
              user = await Organization.findOne({ email: credentials.email });
              break;
            default:
              return null;
          }

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password, 
            user.password
          );
          if (!isPasswordValid) {
            return null;
          }

          // Prepare user object for session
          const userObj: CustomUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: role,
            isApproved: user.isApproved,
          };

          // Add role-specific fields
          if (role === 'organization') {
            userObj.secretCode = user.secretCode;
            userObj.website = user.website;
            userObj.organizationId = user._id.toString();
            userObj.logo = user.logo;
            userObj.createdAt = user.createdAt?.toISOString?.() || '';
          } else if (role === 'student') {
            const orgId = user.organizationId?._id || user.organizationId;
            userObj.organizationId = orgId?.toString();
            userObj.organization = typeof user.organizationId?.name === 'string' ? user.organizationId.name : undefined;
            userObj.educationLevel = user.educationLevel;
            userObj.phone = user.phone;
          } else if (role === 'organizer') {
            userObj.department = user.department;
            userObj.position = user.position;
            userObj.phone = user.phone;
            // Add the first organization's ID if available
            if (user.organizations && user.organizations.length > 0) {
              const primaryOrg = user.organizations[0] as IOrganization;
              userObj.organizationId = primaryOrg._id.toString();
              userObj.organization = typeof primaryOrg.name === 'string' ? primaryOrg.name : undefined;
            }
          }

          return userObj as any;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organization = user.organization;
        token.secretCode = user.secretCode;
        token.department = user.department;
        token.position = user.position;
        token.educationLevel = user.educationLevel;
        token.phone = user.phone;
        token.website = user.website;
        token.isApproved = user.isApproved;
        token.logo = user.logo;
        token.createdAt = user.createdAt;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.organizationId = session.user.organizationId;
        token.organization = session.user.organization;
      }

      return token;
    },
    async session({ session, token, trigger }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.organization = token.organization;
        session.user.secretCode = token.secretCode;
        session.user.department = token.department;
        session.user.position = token.position;
        session.user.educationLevel = token.educationLevel;
        session.user.phone = token.phone;
        session.user.website = token.website;
        session.user.isApproved = token.isApproved;
        session.user.logo = token.logo;
        session.user.createdAt = token.createdAt;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectToDatabase();
          
          const existingStudent = await Student.findOne({ email: user.email });
          const existingOrganizer = await Organizer.findOne({ email: user.email }).populate('organizations');
          
          if (existingStudent || existingOrganizer) {
            // If it's an organizer, add their organization info
            if (existingOrganizer && existingOrganizer.organizations?.length > 0) {
              const primaryOrg = existingOrganizer.organizations[0] as IOrganization;
              (user as any).organizationId = primaryOrg._id.toString();
              (user as any).organization = typeof primaryOrg.name === 'string' ? primaryOrg.name : undefined;
            }
            return true;
          }
          
          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 