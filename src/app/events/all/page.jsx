'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import getCompetitionStatus from '@/lib/utils/getCompetitionStatus';
import { FaFilter } from 'react-icons/fa';

const CATEGORIES = [
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Social', label: 'Social' },
  { value: 'Computing', label: 'Computing' },
  { value: 'Business', label: 'Business' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'happening', label: 'Happening' },
  { value: 'happened', label: 'Happened' }
];

export default function AllEventsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch competitions
        const compResponse = await fetch('/api/competitions');
        const compData = await compResponse.json();
        if (!compResponse.ok) throw new Error(compData.error || 'Failed to fetch competitions');
        
        // Fetch organizations
        const orgResponse = await fetch('/api/organizations');
        const orgData = await orgResponse.json();
        if (!orgResponse.ok) throw new Error(orgData.error || 'Failed to fetch organizations');
        
        console.log('Organizations API response:', orgData);
        console.log('Organizations array:', orgData.organizations);
        
        // Log the first organization to see its structure
        if (orgData.organizations && orgData.organizations.length > 0) {
          console.log('First organization structure:', orgData.organizations[0]);
        }
        
        setCompetitions(compData.competitions || []);
        setOrganizations(orgData.organizations || []);
        
        // Debug: Log the first competition structure
        if (compData.competitions && compData.competitions.length > 0) {
          console.log('First competition structure:', compData.competitions[0]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  function highlightMatch(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-blue-200 px-1 rounded">{part}</span> : <span key={i}>{part}</span>
    );
  }

  // Unique event names for dropdown
  const eventOptions = [
    { value: 'all', label: 'All Events' },
    ...Array.from(new Set(competitions.map(c => c.event).filter(Boolean))).map(e => ({ value: e, label: e }))
  ];

  // Organization options for dropdown
  const organizationOptions = [
    { value: 'all', label: 'All Organizations' },
    ...organizations.map(org => {
      // Try different possible ID field names
      const orgId = org._id || org.id || org.organizationId;
      const option = { value: orgId, label: org.name };
      console.log('Creating org option:', option, 'from org:', org);
      return option;
    })
  ];

  console.log('Organizations data:', organizations);
  console.log('Organization options:', organizationOptions);
  console.log('Selected organization value:', selectedOrganization);

  const filteredCompetitions = competitions.filter(c => {
    // Search filter
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Event filter
    if (selectedEvent !== 'all' && c.event !== selectedEvent) return false;
    // Category filter
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    // Organization filter
    if (selectedOrganization !== 'all') {
      console.log('Filtering by organization ID:', selectedOrganization);
      console.log('Competition organization:', c.organization);
      
      // Get the organization ID from the competition
      const orgId = c.organization?._id;
      console.log('Competition org ID:', orgId, 'Selected org ID:', selectedOrganization);
      
      if (orgId !== selectedOrganization) {
        console.log('Filtered out competition:', c.title, 'Org ID:', orgId, 'Selected:', selectedOrganization);
        return false;
      }
    }
    // Status filter
    const status = getCompetitionStatus(c.startDate || '', c.endDate || '', c.deadlineToApply || '');
    const statusText = typeof status === 'string' ? status : status.props?.children?.toLowerCase();
    if (selectedStatus !== 'all' && statusText !== selectedStatus) return false;
    // Date range filter
    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      const compStart = new Date(c.startDate || '').getTime();
      if (isNaN(compStart) || compStart < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).getTime();
      const compEnd = new Date(c.endDate || '').getTime();
      if (isNaN(compEnd) || compEnd > end) return false;
    }
    return true;
  });

  console.log('Total competitions:', competitions.length);
  console.log('Filtered competitions:', filteredCompetitions.length);
  console.log('Selected organization:', selectedOrganization);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">All Competitions</h1>
        
        {/* Search Bar */}
        <div className="flex flex-col items-center mb-4">
          <input
            type="text"
            placeholder="Search competitions by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500"
          />
        </div>

        {/* Filters Section */}
        <div className="w-full bg-white rounded-lg py-4 px-4 sm:px-6 shadow-sm border mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* Event Dropdown */}
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              {eventOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Organization Dropdown */}
            <select
              value={selectedOrganization}
              onChange={e => {
                console.log('Organization dropdown changed to:', e.target.value);
                setSelectedOrganization(e.target.value);
              }}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              {organizationOptions.map(opt => (
                // Display Logo
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                className="px-2 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 flex-1"
                placeholder="Start date"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                className="px-2 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 flex-1"
                placeholder="End date"
              />
            </div>
          </div>
          
          {/* Filter Icon */}
          <div className="flex justify-center mt-3">
            <FaFilter className="text-blue-500" size={20} title="Filters" />
          </div>
        </div>

        {/* Results */}
        {filteredCompetitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No competitions found</h2>
            <p className="text-gray-600">There are currently no competitions available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredCompetitions.map((competition) => {
              const status = getCompetitionStatus(
                competition.startDate || '',
                competition.endDate || '',
                competition.deadlineToApply || ''
              );
              return (
                <div
                  key={competition._id}
                  onClick={() => router.push(`/events/${competition._id}`)}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer transform transition-transform duration-200 hover:scale-105 hover:shadow-2xl flex flex-col h-full"
                >
                  <div className="p-4 sm:p-6 flex flex-col h-full">
                    {/* Title and Status */}
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight flex-1 mr-2">
                        {highlightMatch(truncateText(competition.title, 50), search)}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0`}>
                        {status}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-700 mb-3 text-sm">
                      {truncateText(competition.description, 70)}
                      <span className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 underline cursor-pointer">Read more...</span>
                    </p>
                    
                    <div className="border-b border-gray-200 my-2" />
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        {competition.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                        {competition.mode}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium border border-yellow-100">
                        {!competition.registrationFee ? 'No Entry Fee' : `${competition.registrationFee} /- rs`}
                      </span>
                    </div>
                    
                    {competition.deadlineToApply && (
                      <div className="flex items-center text-xs text-gray-600 mb-2">
                        <svg className="w-4 h-4 mr-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Apply by: <span className="font-semibold">{format(new Date(competition.deadlineToApply), 'PPP')}</span></span>
                      </div>
                    )}
                    
                    {/* Organization Info */}
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      {competition.organization?._id && (
                        <Image
                          src={`/Org-Logos/${competition.organization._id}.png`}
                          alt={competition.organization.name}
                          width={28}
                          height={28}
                          className="mr-2 rounded-full border border-gray-200 bg-white flex-shrink-0"
                          onError={(e) => {
                            const target = e.target;
                            if (target && target instanceof HTMLElement) target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {competition.organization?.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
