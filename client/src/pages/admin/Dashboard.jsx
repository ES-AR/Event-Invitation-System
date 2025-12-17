import React, { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import EventRow from '../../components/EventRow';

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get User Name from LocalStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const firstName = userInfo.name ? userInfo.name.split(' ')[0] : 'Organizer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        // Use token if needed in future (currently API is open or mocked to ignore token for Dashboard)
        const response = await fetch(`${apiUrl}/dashboard`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setStats(data.stats);
        setEvents(data.events);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Could not load dashboard data. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2">
        <span className="material-symbols-outlined text-4xl">error</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-10">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {firstName}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">
            Here's what's happening with your events today.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/30 transition-all active:scale-95">
          <span className="material-symbols-outlined text-xl">add</span>
          Create New Event
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Events Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Events</h3>
          <a href="#" className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center gap-1">
            View All
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </a>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Event Name</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[200px]">Quota Usage</th>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">Showing {events.length} results</span>
            <div className="flex gap-2">
              <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;