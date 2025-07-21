import { Fragment, useEffect, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/context/OrganizationContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
}

interface OrgResponse {
  _id: string;
  name: string;
}

export default function OrganizationSwitcher() {
  const { data: session, update } = useSession();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizer/organizations');
      const data = await response.json();
      
      if (data.organizations) {
        const orgs = data.organizations.map((org: OrgResponse) => ({
          id: org._id,
          name: org.name
        }));
        setOrganizations(orgs);
        
        // Set initial selected org based on session
        if (session?.user?.organizationId) {
          const currentOrg = orgs.find((org: Organization) => org.id === session.user.organizationId);
          if (currentOrg) {
            setCurrentOrganization(currentOrg);
          } else if (orgs.length > 0) {
            setCurrentOrganization(orgs[0]);
          }
        } else if (orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'organizer') {
      fetchOrganizations();
    }
  }, [session]);

  const handleOrgChange = async (org: Organization) => {
    if (org.id === currentOrganization?.id) return;

    try {
      setIsLoading(true);
      // Update context first for immediate UI feedback
      setCurrentOrganization(org);
      
      // Update session
      const result = await update({
        ...session,
        user: {
          ...session?.user,
          organizationId: org.id,
          organization: org.name
        }
      });

      if (!result) {
        throw new Error('Failed to update session');
      }

      // Refresh the router to update server-side data
      router.refresh();
      
      // Refetch organizations to ensure everything is in sync
      await fetchOrganizations();

      toast.success(`Switched to ${org.name}`);
    } catch (error) {
      console.error('Error changing organization:', error);
      toast.error('Failed to switch organization');
      // Revert context if session update failed
      if (session?.user?.organizationId) {
        const previousOrg = organizations.find(o => o.id === session.user.organizationId);
        if (previousOrg) {
          setCurrentOrganization(previousOrg);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.role || session.user.role !== 'organizer' || organizations.length === 0) {
    return null;
  }

  return (
    <div className="w-72">
      <Listbox value={currentOrganization} onChange={handleOrgChange} disabled={isLoading}>
        <div className="relative mt-1">
          <Listbox.Button className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="block truncate">
              {isLoading ? 'Switching...' : currentOrganization?.name || 'Select Organization'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {organizations.map((org) => (
                <Listbox.Option
                  key={org.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                    }`
                  }
                  value={org}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {org.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
} 