import React from 'react';

const StatCard = ({ stat }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-primary', bgDark: 'dark:bg-blue-900/20' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', bgDark: 'dark:bg-orange-900/20' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bgDark: 'dark:bg-purple-900/20' },
  };

  const colors = colorMap[stat.colorClass] || colorMap['blue'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${colors.bg} ${colors.bgDark} rounded-lg ${colors.text}`}>
          <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
        </div>
        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
          <span className="material-symbols-outlined text-base mr-0.5">
            {stat.trendDirection === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          {stat.trend}
        </span>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
      </div>
    </div>
  );
};

export default StatCard;