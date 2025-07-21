import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (session?.user?.organizationId && session?.user?.organization) {
      setCurrentOrganization({
        id: session.user.organizationId,
        name: session.user.organization
      });
    }
  }, [session]);

  return (
    <OrganizationContext.Provider value={{ currentOrganization, setCurrentOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
} 