import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-10">
      <button 
        onClick={onMenuClick}
        className="md:hidden p-2 text-slate-500 hover:text-primary"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
        <span>Overview</span>
        <span className="material-symbols-outlined text-base">chevron_right</span>
        <span className="font-semibold text-slate-900 dark:text-white">Dashboard</span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
          <input
            className="bg-transparent border-none text-sm w-full focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 ml-2 focus:outline-none"
            placeholder="Search events or guests..."
            type="text"
          />
        </div>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <button 
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;