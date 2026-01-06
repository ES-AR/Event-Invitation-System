import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clock9, Copy, Link2, UserCheck, UserX } from "lucide-react";
import Card from "../../components/ui/Card";
import QuotaMeter from "../../components/ui/QuotaMeter";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { getEventStats, listEvents } from "../../services/event.service";
import { formatDateRange } from "../../utils/formatters";

const statConfig = [
  { key: "approved", label: "Approved RSVPs", icon: UserCheck },
  { key: "pending", label: "Pending Reviews", icon: Clock9 },
  { key: "cancelled", label: "Cancelled", icon: UserX },
];

export default function DashboardPage() {
  const { token, admin } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const copyTimer = useRef(null);

  const selectedEvent = useMemo(
    () => events.find((evt) => evt.id === selectedEventId),
    [events, selectedEventId]
  );

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setEventsLoading(true);
    try {
      const response = await listEvents(token);
      const eventList = response.events || [];
      setEvents(eventList);
      setSelectedEventId((current) => {
        if (eventList.find((evt) => evt.id === current)) {
          return current;
        }
        return eventList[0]?.id || "";
      });
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!token || !selectedEventId) {
      setStats(null);
      return;
    }

    let active = true;
    setStatsLoading(true);
    getEventStats(selectedEventId, token)
      .then((response) => {
        if (active) setStats(response);
      })
      .catch((err) => console.error("Failed to load stats", err))
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, selectedEventId]);

  useEffect(() => () => {
    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
    }
  }, []);

  const handleCopyLink = async (url, eventId) => {
    if (!url || !eventId) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        window.prompt("Copy invite link", url);
      }
      setCopiedEventId(eventId);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedEventId(null), 2000);
    } catch (err) {
      console.error("Unable to copy", err);
    }
  };

  const showEmptyState = !eventsLoading && events.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Overview · {admin?.displayName}</p>
          <h1 className="font-display text-3xl text-slate-900">Craft unforgettable guest flows.</h1>
        </div>
        <Button as={Link} to="/admin/events/builder" className="px-6">
          Create event
        </Button>
      </div>

      {eventsLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="spinner-ring" />
        </div>
      ) : showEmptyState ? (
        <Card className="flex flex-col gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No events yet</p>
          <h2 className="font-display text-2xl text-slate-900">Launch your first invite-only experience</h2>
          <p className="text-sm text-slate-500">
            Spin up a branded landing link, define quotas, and start inviting guests in minutes.
          </p>
          <div className="flex justify-center">
            <Button as={Link} to="/admin/events/builder">
              Create an event
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Select event</p>
                <h2 className="font-display text-2xl text-slate-900">{selectedEvent?.title}</h2>
                <p className="text-sm text-slate-500">
                  {formatDateRange(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.timezone || "UTC") ||
                    "Schedule pending"}
                </p>
              </div>
              <label className="text-sm font-medium text-slate-700">
                Active invites
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="mt-2 rounded-2xl border border-slate-200 px-4 py-2"
                >
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>
              <Badge tone={selectedEvent?.isRegistrationOpen ? "success" : "warning"}>
                {selectedEvent?.isRegistrationOpen ? "Live" : "Closed"}
              </Badge>
            </div>
            <div>
              <p className="pill-label">
                <Link2 className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Share link
              </p>
              <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                <span className="break-all font-mono text-xs text-slate-500">{selectedEvent?.shareUrl}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyLink(selectedEvent?.shareUrl, selectedEvent?.id)}
                >
                  <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  {copiedEventId === selectedEvent?.id ? "Copied" : "Copy invite"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {statConfig.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.key}>
                  <div className="flex items-center gap-2 text-primary-600">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {statsLoading ? "—" : stats?.totals?.[stat.key] ?? 0}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-6">
              {statsLoading ? (
                <div className="flex min-h-[180px] items-center justify-center">
                  <div className="spinner-ring-sm" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quota health</p>
                      <h2 className="font-display text-2xl text-slate-900">{selectedEvent?.title}</h2>
                      <p className="text-sm text-slate-500">
                        {formatDateRange(selectedEvent?.startDate, selectedEvent?.endDate, selectedEvent?.timezone || "UTC")}
                      </p>
                    </div>
                    <Badge tone={selectedEvent?.isRegistrationOpen ? "success" : "warning"}>
                      {selectedEvent?.isRegistrationOpen ? "Accepting" : "Closed"}
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <QuotaMeter label="Main capacity" used={stats?.slots?.main?.used} capacity={stats?.slots?.main?.capacity} />
                    <QuotaMeter label="Overflow" used={stats?.slots?.overflow?.used} capacity={stats?.slots?.overflow?.capacity} accent="from-violet-500 to-purple-400" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Guest instructions</p>
                    <p className="mt-2">{selectedEvent?.checkInInstructions || "Share arrival notes and ID requirements here."}</p>
                  </div>
                </>
              )}
            </Card>
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Event roster</p>
                  <h2 className="font-display text-xl text-slate-900">All links</h2>
                </div>
                <Button as={Link} to="/admin/events" size="sm" variant="secondary">
                  Manage events
                </Button>
              </div>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateRange(event.startDate, event.endDate, event.timezone || "UTC") || "Schedule pending"}
                        </p>
                      </div>
                      <Badge tone={event.isRegistrationOpen ? "success" : "warning"}>
                        {event.isRegistrationOpen ? "Live" : "Closed"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyLink(event.shareUrl, event.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                        {copiedEventId === event.id ? "Copied" : "Copy link"}
                      </Button>
                      <Button size="sm" as={Link} to={`/admin/attendees?eventId=${event.id}`}>
                        View attendees
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
