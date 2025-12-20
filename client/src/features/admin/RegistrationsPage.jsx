import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import { CalendarRange, CheckCircle2, ListChecks, Search, Trash2, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { listEvents } from "../../services/event.service";
import { approveAttendee, deleteAttendee, fetchAttendees } from "../../services/registration.service";
import { formatNumber } from "../../utils/formatters";

const statusTone = {
  approved: "success",
  pending: "warning",
  "checked-in": "info",
  rejected: "danger",
};

export default function RegistrationsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ status: "", q: "" });
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const initialEventId = searchParams.get("eventId") || "";
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);

  const load = async (overrides = {}) => {
    if (!token || !selectedEventId) return;
    setLoading(true);
    const params = { ...query, ...overrides, eventId: selectedEventId };
    try {
      const response = await fetchAttendees(params, token);
      setData(response.attendees);
      setMeta(response.meta);
    } catch (err) {
      console.error("Unable to load attendees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    setEventsLoading(true);
    listEvents(token)
      .then((response) => {
        const list = response.events || [];
        setEvents(list);
        const hasSelected = selectedEventId && list.some((event) => event.id === selectedEventId);
        if (!hasSelected && list.length) {
          const nextId = list[0].id;
          setSelectedEventId(nextId);
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("eventId", nextId);
            return params;
          });
        }
      })
      .finally(() => setEventsLoading(false));
  }, [selectedEventId, setSearchParams, token]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedEventId]);

  useEffect(() => {
    setSelected(new Set());
  }, [selectedEventId]);

  const toggleSelection = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approve = async (id) => {
    await approveAttendee(id, token);
    load();
  };

  const remove = async (id) => {
    await deleteAttendee(id, token);
    load();
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (eventId) {
        params.set("eventId", eventId);
      } else {
        params.delete("eventId");
      }
      return params;
    });
  };

  const noEvents = !eventsLoading && events.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-slate-900">
            <Users className="h-5 w-5 text-primary-600" strokeWidth={1.8} /> Registrations
          </h1>
          <p className="text-sm text-slate-500">
            {selectedEvent ? `Tracking ${selectedEvent.title}` : "Select an event to view registrants"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" disabled>
            Export CSV
          </Button>
          <Button disabled>Add registrant</Button>
        </div>
      </div>

      {noEvents ? (
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No events configured</p>
          <p className="mt-3 text-sm text-slate-500">Create an event first to start collecting registrations.</p>
          <div className="mt-4 flex justify-center">
            <Button as="a" href="/admin/events/builder">
              Launch an event
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Event
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="mt-2 rounded-xl border border-slate-200 px-4 py-2"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" strokeWidth={1.8} />}
              value={query.q}
              onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Name or email"
            />
            <label className="text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Status
              </span>
              <select
                value={query.status}
                onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-2 rounded-xl border border-slate-200 px-4 py-2"
              >
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="checked-in">Checked-in</option>
              </select>
            </label>
            <Button onClick={() => load()} className="self-end">
              Apply
            </Button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3">
                    <input
                      type="checkbox"
                      onChange={(e) => setSelected(e.target.checked ? new Set(data.map((d) => d._id)) : new Set())}
                    />
                  </th>
                  <th className="py-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Registered</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      {selectedEventId ? "Loading attendees..." : "Select an event to load attendees"}
                    </td>
                  </tr>
                ) : (
                  data.map((attendee) => (
                    <tr key={attendee._id} className="border-t border-slate-100">
                      <td className="py-4">
                        <input type="checkbox" checked={selected.has(attendee._id)} onChange={() => toggleSelection(attendee._id)} />
                      </td>
                      <td className="py-4 font-semibold text-slate-800">{attendee.fullName}</td>
                      <td className="py-4 text-slate-500">{attendee.email}</td>
                      <td className="py-4 text-slate-500">{new Date(attendee.createdAt).toLocaleString()}</td>
                      <td className="py-4">
                        <Badge tone={statusTone[attendee.status] || "neutral"}>{attendee.status}</Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-3">
                          <button className="inline-flex items-center gap-1 text-primary-600" onClick={() => approve(attendee._id)}>
                            <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} /> Approve
                          </button>
                          <button className="inline-flex items-center gap-1 text-danger" onClick={() => remove(attendee._id)}>
                            <Trash2 className="h-4 w-4" strokeWidth={1.8} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
