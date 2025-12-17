import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { getPublicEvent } from "../../services/event.service";
import { formatDateRange } from "../../utils/formatters";

export default function LandingPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicEvent()
      .then(({ event }) => setEvent(event))
      .finally(() => setLoading(false));
  }, []);

  const heroStats = [
    { label: "Total Registrations", value: "1,245" },
    { label: "Seats Remaining", value: event?.quota?.main?.remaining ?? "—" },
    { label: "Check-in Rate", value: "82%" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-6 lg:flex-row lg:py-12">
      <section className="flex w-full flex-col gap-10 lg:w-1/2">
        <div className="primary-gradient rounded-3xl p-8 text-white shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">EventHub Organizer Portal</p>
          <h1 className="mt-6 font-display text-4xl leading-tight">
            Precision quotas for unforgettable, oversubscription-proof events.
          </h1>
          <p className="mt-4 text-white/80">
            Manage tiers, approvals, and live check-ins from a single organizer dashboard inspired by enterprise playbooks.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button as={Link} to="/invite/main-event" className="px-8">
              Secure My Spot
            </Button>
            <Button as={Link} to="/admin/login" variant="secondary">
              Organizer Login
            </Button>
          </div>
          <div className="mt-10 rounded-2xl bg-white/10 p-4 text-sm text-white/90">
            <p className="font-semibold">“Our quota system keeps VIP, overflow, and press lists perfectly balanced.”</p>
            <p className="text-white/70">Sarah Jenkins · Lead Organizer, TechSummit</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <Card key={stat.label} className="bg-white/80 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="lg:w-1/2">
        <Card className="glass-card bg-white/90 p-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
            </div>
          ) : (
            <>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Featured Event</p>
              <h2 className="mt-4 font-display text-3xl text-slate-900">{event?.title}</h2>
              <p className="mt-2 text-slate-500">{event?.description || "Curated programming for product leaders and operators."}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Schedule</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDateRange(event?.startDate, event?.endDate)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Location</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{event?.venueName || event?.location}</p>
                  <p className="text-xs text-slate-500">{event?.venueAddress}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-700">Registration Status</p>
                <p className="mt-1 text-slate-500">
                  {event?.isRegistrationOpen ? "Open" : event?.closeReason || "Closed"}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-primary-500/10 px-4 py-1 text-primary-600">
                    Main Slots: {event?.quota?.main?.remaining ?? "—"} left
                  </span>
                  <span className="rounded-full bg-slate-200 px-4 py-1 text-slate-700">
                    Overflow Slots: {event?.quota?.overflow?.remaining ?? "—"}
                  </span>
                </div>
              </div>
              <Link to={`/invite/${event?.publicSlug || "main-event"}`} className="mt-8 block">
                <Button className="w-full justify-center">Register Now</Button>
              </Link>
            </>
          )}
        </Card>
      </section>
    </div>
  );
}
