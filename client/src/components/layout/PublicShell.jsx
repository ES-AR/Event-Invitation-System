import { Outlet, Link } from "react-router-dom";

export default function PublicShell() {
  return (
    <div className="min-h-screen bg-white/80">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-500/10 p-2 text-primary-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="16" rx="5" fill="currentColor" opacity="0.15" />
              <path
                d="M7 9h10M7 13h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-600">EventHub</p>
            <p className="font-display text-xl text-slate-900">Quota Suite</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">Need help?</span>
          <a href="mailto:support@eventhub.com" className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700">
            support@eventhub.com
          </a>
        </div>
      </header>
      <main className="pb-16">
        <Outlet />
      </main>
      <footer className="border-t border-slate-100 bg-white/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EventHub Suite. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#accessibility">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
