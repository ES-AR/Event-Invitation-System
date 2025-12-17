import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/admin/Dashboard';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Home from './pages/public/Home';

// Layout component for Authenticated Users
const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header onMenuClick={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 md:p-10 scroll-smooth">
          {children}
        </main>
      </div>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

// Protected Route Component
const RequireAuth = ({ children }) => {
  const userInfo = localStorage.getItem('userInfo');
  const location = useLocation();

  if (!userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/dashboard" 
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;