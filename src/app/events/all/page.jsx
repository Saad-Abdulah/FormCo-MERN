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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch('/api/competitions');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch competitions');
        setCompetitions(data.competitions || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch competitions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompetitions();
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

  const filteredCompetitions = competitions.filter(c => {
    // Search filter
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    // Event filter
    if (selectedEvent !== 'all' && c.event !== selectedEvent) return false;
    // Category filter
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    // Status filter
    const status = getCompetitionStatus(c.startDate || '', c.endDate || '', c.deadlineToApply || '');
    const statusText = typeof status === 'string' ? status : status.props.children?.toLowerCase();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Competitions</h1>
        <div className="flex flex-col items-center mb-4">
          <input
            type="text"
            placeholder="Search competitions by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
          />
          {/* Filters Row */}
          <div className="w-full flex flex-wrap items-center gap-3 mt-4 justify-center bg-white rounded-lg py-3 px-4 shadow-sm border">
            {/* Event Dropdown */}
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {eventOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                className="px-2 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start date"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                className="px-2 py-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="End date"
              />
            </div>
            {/* Filter Icon */}
            <FaFilter className="text-blue-500 ml-2" size={20} title="Filters" />
          </div>
        </div>
        {filteredCompetitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No competitions found</h2>
            <p className="text-gray-500">There are currently no competitions available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <div className="p-6 flex flex-col h-full">
                    {/* Title and Status */}
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-bold text-gray-900 leading-tight">
                        {highlightMatch(truncateText(competition.title, 50), search)}
                      </h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ml-2`}>
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
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Apply by: <span className="font-semibold">{format(new Date(competition.deadlineToApply), 'PPP')}</span></span>
                      </div>
                    )}
                    {/* Organization Info */}
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      {competition.organization?.logo && (
                        <Image
                          src={competition.organization.logo}
                          alt={competition.organization.name}
                          width={28}
                          height={28}
                          className="mr-2 rounded-full border border-gray-200 bg-white"
                          onError={(e) => {
                            const target = e.target;
                            if (target && target instanceof HTMLElement) target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="font-medium text-gray-900 text-sm">
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
