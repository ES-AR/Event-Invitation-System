import React from 'react';

// Example of a Public page structure
const Home = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">EventHub Public Portal</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">This is a public facing page placeholder.</p>
        <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Go to Admin Login
        </button>
      </div>
    </div>
  );
};

export default Home;