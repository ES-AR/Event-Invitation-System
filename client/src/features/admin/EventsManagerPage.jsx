import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Link2, PenSquare, Power } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { closeRegistration, listEvents, openRegistration } from "../../services/event.service";
import { formatDateRange } from "../../utils/formatters";

export default function EventsManagerPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [updatingEventId, setUpdatingEventId] = useState(null);
  const copyTimer = useRef(null);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await listEvents(token);
      setEvents(response.events || []);
    } catch (err) {
      console.error("Unable to load events", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadEvents();
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, [loadEvents]);

  const handleCopyLink = async (event) => {
    if (!event?.shareUrl) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(event.shareUrl);
      } else {
        window.prompt("Copy invite link", event.shareUrl);
      }
      setCopiedEventId(event.id);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedEventId(null), 2000);
    } catch (err) {
      console.error("Unable to copy link", err);
    }
  };

  const handleToggleRegistration = async (event) => {
    if (!token || !event?.id) return;
    setUpdatingEventId(event.id);
    try {
      const response = event.isRegistrationOpen
        ? await closeRegistration(event.id, token, "Closed via manager")
        : await openRegistration(event.id, token);
      if (response?.event) {
        setEvents((prev) => prev.map((item) => (item.id === response.event.id ? response.event : item)));
      }
    } catch (err) {
      console.error("Unable to update registration status", err);
    } finally {
      setUpdatingEventId(null);
    }
  };

  const emptyState = !loading && events.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">All live and archived invitation links</p>
          <h1 className="font-display text-3xl text-slate-900">Manage events</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadEvents} disabled={loading}>
            Refresh
          </Button>
          <Button as={Link} to="/admin/events/builder">
            New event
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="spinner-ring" />
        </div>
      ) : emptyState ? (
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No events yet</p>
          <p className="mt-3 text-sm text-slate-500">Create your first event to generate invite-only links.</p>
          <div className="mt-4 flex justify-center">
            <Button as={Link} to="/admin/events/builder">
              Launch an event
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{formatDateRange(event.startDate, event.endDate) || "Schedule pending"}</p>
                </div>
                <Badge tone={event.isRegistrationOpen ? "success" : "warning"}>
                  {event.isRegistrationOpen ? "Live" : "Closed"}
                </Badge>
              </div>
              <div>
                <p className="pill-label">
                  <Link2 className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Share link
                </p>
                <div className="card-panel mt-2 flex flex-col gap-3 p-4 text-sm text-slate-600">
                  <span className="break-all font-mono text-xs text-slate-500">{event.shareUrl || "Link not generated yet"}</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyLink(event)}
                      disabled={!event.shareUrl}
                    >
                      <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                      {copiedEventId === event.id ? "Copied" : "Copy link"}
                    </Button>
                    <Button size="sm" variant="subtle" as={Link} to={`/admin/events/builder?eventId=${event.id}`}>
                      <PenSquare className="mr-2 h-4 w-4" strokeWidth={1.8} /> Edit event
                    </Button>
                    <Button size="sm" variant="ghost" as={Link} to={`/admin/attendees?eventId=${event.id}`}>
                      View attendees
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant={event.isRegistrationOpen ? "secondary" : "primary"}
                  onClick={() => handleToggleRegistration(event)}
                  disabled={updatingEventId === event.id}
                >
                  <Power className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  {event.isRegistrationOpen ? "Close registration" : "Open registration"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
