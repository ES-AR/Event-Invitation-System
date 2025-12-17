import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import QuotaMeter from "../../components/ui/QuotaMeter";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { getEventStats } from "../../services/event.service";
import { formatDateRange } from "../../utils/formatters";

const statConfig = [
  { key: "approved", label: "Total Registrations" },
  { key: "checkedIn", label: "Check-in Rate" },
  { key: "pending", label: "Pending Reviews" },
];

export default function DashboardPage() {
  const { token, admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      try {
        const response = await getEventStats(token);
        if (active) setStats(response);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  const event = stats?.event;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Overview · {admin?.displayName}</p>
          <h1 className="font-display text-3xl text-slate-900">Welcome back!</h1>
        </div>
        <Button as="a" href="/admin/events" className="px-6">
          Create new event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statConfig.map((stat) => (
          <Card key={stat.key}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {stats?.totals?.[stat.key] ?? 0}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Featured Event</p>
              <h2 className="font-display text-2xl text-slate-900">{event?.title}</h2>
              <p className="text-sm text-slate-500">{formatDateRange(event?.startDate, event?.endDate)}</p>
            </div>
            <Badge tone={event?.isRegistrationOpen ? "success" : "warning"}>
              {event?.isRegistrationOpen ? "Live" : "Closed"}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <QuotaMeter label="Main capacity" used={stats?.slots?.main?.used} capacity={stats?.slots?.main?.capacity} />
            <QuotaMeter label="Overflow" used={stats?.slots?.overflow?.used} capacity={stats?.slots?.overflow?.capacity} accent="from-violet-500 to-purple-400" />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Check-in instructions</p>
            <p className="mt-2">{event?.checkInInstructions || "Remind guests to bring government ID."}</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Activity</p>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            <li>• {stats?.totals?.checkedIn ?? 0} attendees already checked in.</li>
            <li>• {stats?.totals?.pending ?? 0} approvals awaiting review.</li>
            <li>• {stats?.totals?.cancelled ?? 0} cancellations this week.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
