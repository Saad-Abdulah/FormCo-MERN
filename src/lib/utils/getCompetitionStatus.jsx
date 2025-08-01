
export default function getCompetitionStatusBadge(startDate, endDate, deadlineToApply, className = '') {
  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const deadline = new Date(deadlineToApply).getTime();

  let status = 'Open';

  if (now < deadline) status = 'Open';
  else if (now >= deadline && now < start) status = 'Closed';
  else if (now >= start && now <= end) status = 'Happening';
  else status = 'Happened';

  const badgeClass =
    status === 'Open'
      ? 'bg-green-100 text-green-700 border border-green-300'
      : status === 'Happening'
      ? 'bg-blue-100 text-blue-700 border border-blue-300'
      : status === 'Happened'
      ? 'bg-gray-200 text-gray-700 border border-gray-300'
      : 'bg-red-100 text-red-700 border border-red-300';

  return (
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ml-2 ${badgeClass} ${className}`}
    >
      {status}
    </div>
  );
}
