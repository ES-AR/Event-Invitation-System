import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-gray-100 text-black">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold">Admin Panel</h2>

        <nav className="flex flex-col gap-2">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/attendees">Attendees</Link>
          <Link to="/admin/settings">Event Settings</Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
