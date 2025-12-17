import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } else {
            setError(data.message || 'Registration failed');
        }
    } catch (err) {
        setError('Network error, please try again');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        {/* Left Side - Blue Brand Area */}
        <div className="hidden lg:flex w-1/3 bg-primary text-white flex-col p-12 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-2 mb-12">
                 <div className="bg-white/20 backdrop-blur rounded-lg p-2 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                </div>
                <h1 className="text-2xl font-bold">EventHub</h1>
            </div>

            <div className="relative z-10 mt-auto">
                <span className="material-symbols-outlined text-4xl mb-6 opacity-80">format_quote</span>
                <h2 className="text-3xl font-bold leading-snug mb-6">
                    The quota system saved us from overbooking our flagship tech conference. It's the precision tool every organizer needs.
                </h2>
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full border-2 border-white/30 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80")' }}></div>
                    <div>
                        <p className="font-bold text-lg">Sarah Jenkins</p>
                        <p className="text-white/70">Lead Organizer, TechSummit 2024</p>
                    </div>
                </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 size-96 rounded-full border border-white/10"></div>
            <div className="absolute top-40 -left-20 size-72 rounded-full bg-blue-500/30 blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div className="w-full max-w-lg">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h2>
                    <p className="text-slate-500 dark:text-slate-400">Join thousands of organizers managing quota-controlled events efficiently.</p>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                        <input 
                            type="text" 
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Organization Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input 
                            type="text" 
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3"
                            placeholder="Enter your organization's name"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 pr-10"
                                placeholder="name@company.com"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 text-xl">mail</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-primary focus:border-primary p-3 pr-10"
                                placeholder="Create a password"
                            />
                            <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 text-xl">visibility_off</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Must be at least 8 characters.</p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer my-2">
                        <input type="checkbox" required className="rounded text-primary focus:ring-primary border-slate-300 dark:border-slate-700 bg-transparent" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</span>
                    </label>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Google
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
                        <img src="https://www.svgrepo.com/show/452062/microsoft.svg" className="w-5 h-5" alt="Microsoft" />
                        Microsoft
                    </button>
                </div>

                <p className="text-center text-sm text-slate-500 mt-8">
                    Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
                </p>
            </div>
        </div>
    </div>
  );
};

export default Register;