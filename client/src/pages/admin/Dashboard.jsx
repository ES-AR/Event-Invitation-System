import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/event.service";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading dashboard...</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-xs text-gray-500">
          Ensure `VITE_ADMIN_KEY` matches the backend `ADMIN_KEY`.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600">Live snapshot of registrations.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats?.totals &&
          Object.entries(stats.totals).map(([label, value]) => (
            <div key={label} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-xs uppercase text-gray-500">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {stats?.slots &&
          Object.entries(stats.slots).map(([type, data]) => (
            <div key={type} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm font-medium capitalize">{type} slots</p>
              <p className="text-3xl font-semibold">
                {data.used}/{data.capacity}
              </p>
            </div>
          ))}
      </section>
    </div>
  );
}
