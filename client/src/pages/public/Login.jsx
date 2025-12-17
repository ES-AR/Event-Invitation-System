import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } else {
            setError(data.message || 'Login failed');
        }
    } catch (err) {
        setError('Network error, please try again');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined icon-filled text-2xl">confirmation_number</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">EventHub</h1>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Organizer Login</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Welcome back. Please enter your credentials to manage your event quotas and registrations.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 pr-10 text-slate-900 dark:text-white"
                  placeholder="name@organization.com"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400">mail</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 pr-10 text-slate-900 dark:text-white"
                  placeholder="Enter your password"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400">visibility</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 bg-transparent" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Keep me logged in</span>
              </label>
              <a href="#" className="text-sm font-semibold text-primary hover:text-blue-700">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <Link to="/register" className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold text-center transition-all">
            Sign Up as Organizer
          </Link>

          <div className="text-center text-xs text-slate-400 mt-auto">
             Don't have an account? <Link to="/register" className="text-primary font-bold">Contact Support</Link>
             <div className="flex justify-center gap-4 mt-2">
                 <span>Privacy</span>
                 <span>Terms</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-slate-900">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        <div className="absolute bottom-16 left-16 right-16 p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white">
            <div className="flex gap-1 mb-4 text-yellow-400">
                {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined icon-filled text-xl">star</span>)}
            </div>
            <p className="text-xl font-medium leading-relaxed mb-6">
                "Managing our global summits became effortless with EventHub. The real-time attendance tracking is a game changer for our team."
            </p>
            <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-slate-400 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")' }}></div>
                <div>
                    <p className="font-bold">Elena Rodriguez</p>
                    <p className="text-sm text-slate-300">Head of Operations, GlobalTech</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;