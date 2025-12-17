import React from 'react';

const Sidebar = ({ isMobileOpen, onClose }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', active: true },
    { icon: 'calendar_today', label: 'Events', active: false },
    { icon: 'group', label: 'Guests', active: false },
    { icon: 'analytics', label: 'Reports', active: false },
    { icon: 'settings', label: 'Settings', active: false },
  ];

  const sidebarClasses = `
    fixed md:relative z-30
    w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 
    bg-white dark:bg-slate-900 
    flex flex-col justify-between p-4 h-full
    transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-primary/10 rounded-lg p-2 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined icon-filled text-2xl">confirmation_number</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-none">EventHub</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Organizer Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                item.active
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined ${item.active ? 'icon-filled' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-sm ${item.active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto transition-colors">
        <div 
          className="size-9 rounded-full bg-cover bg-center bg-slate-200" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC9e_vVt5AzSljQkDjF5y5y7kXfi1oWeChSP7caWdOIxNxZp5nGRRt5Mr5W27_H1Yga7zIihrOdPg4YdGv11pfS3sIpBO1vGdXuMdyz6mvYyv2ALJasFzSXDOrLu5giCegATt2rSQUdxIkgCl5BAqNbkwW6tv1v9tb7-bEEPuV9taTuBqDx5qp80QLn-AwE_P0qMLDraAjc2XyU6fOETRN3_ctpphZkD3Yi2hSPkJC3zcNwMDq_DJPLAvIDqMGbF0A1x-PYNqgXDpA")' }}
        ></div>
        <div className="flex flex-col overflow-hidden">
          <p className="text-slate-900 dark:text-white text-sm font-semibold truncate">{userInfo.name || 'User'}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs truncate">View Profile</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;