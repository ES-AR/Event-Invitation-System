import React from 'react';

const EventRow = ({ event }) => {
  const percentage = Math.round((event.registered / event.capacity) * 100) || 0;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Live':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Sold Out':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Draft':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
      case 'Near Capacity':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getProgressColor = (status, percentage) => {
    if (status === 'Sold Out') return 'bg-orange-500';
    if (percentage > 90) return 'bg-yellow-500';
    if (status === 'Draft') return 'bg-slate-400';
    return 'bg-primary';
  };

  const getPercentageColor = (status, percentage) => {
    if (status === 'Sold Out') return 'text-orange-600';
    if (percentage > 90) return 'text-yellow-600 dark:text-yellow-400';
    if (status === 'Draft') return 'text-slate-400';
    return 'text-primary';
  };

  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div
            className={`size-10 rounded-lg bg-cover bg-center shrink-0 ${event.status === 'Draft' ? 'grayscale opacity-70' : ''}`}
            style={{ backgroundImage: `url("${event.imageUrl}")` }}
          ></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{event.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{event.date}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
            event.status
          )}`}
        >
          {event.status === 'Live' && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
          {event.status === 'Near Capacity' && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
           {event.status === 'Near Capacity' ? 'Live' : event.status}
        </span>
      </td>
      <td className="py-4 px-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-700 dark:text-slate-300">
              {event.registered} / {event.capacity} Registered
            </span>
            <span className={`${getPercentageColor(event.status, percentage)} font-bold`}>{percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`${getProgressColor(event.status, percentage)} h-2 rounded-full`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
};

export default EventRow;