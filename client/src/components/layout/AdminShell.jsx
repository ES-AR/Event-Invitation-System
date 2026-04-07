import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/events", label: "Manage events", end: true },
  { to: "/admin/events/builder", label: "Event builder" },
  { to: "/admin/attendees", label: "Registrations" },
];

export default function AdminShell() {
  const { admin, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-100 bg-white/80 px-6 py-8 lg:flex">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">QEICS</p>
          <p className="font-display text-2xl text-slate-900">Organizer</p>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-primary-500/10 text-primary-600" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Organizer</p>
          <p className="font-semibold text-slate-800">{admin?.displayName}</p>
          <p className="text-xs text-slate-500">{admin?.email}</p>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
          >
            Sign out
          </button>
        </div>
      </aside>
      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-5 lg:hidden">
          <p className="font-display text-lg text-slate-900">Organizer Portal</p>
          <button onClick={logout} className="text-sm font-semibold text-primary-600">
            Logout
          </button>
        </div>
        <div className="flex-1 px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
