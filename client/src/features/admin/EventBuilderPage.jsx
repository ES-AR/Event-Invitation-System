import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarRange, Copy, FileText, Layers3, Link2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import {
  closeRegistration,
  createEvent,
  deleteEvent as deleteEventApi,
  listEvents,
  openRegistration,
  updateEvent,
} from "../../services/event.service";
import { formatDateRange } from "../../utils/formatters";

const defaultEvent = {
  title: "",
  description: "",
  venueName: "",
  location: "",
  venueAddress: "",
  startDate: "",
  endDate: "",
  maxMainSlots: 100,
  maxOverflowSlots: 0,
  requiresApproval: true,
  allowWalkIns: false,
  registrationClosesAt: "",
  publicSlug: "",
  publicInviteEnabled: true,
  checkInInstructions: "",
  contactEmail: "",
};

const isoDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const hydrateForm = (event = defaultEvent) => ({
  ...defaultEvent,
  ...event,
  startDate: isoDate(event.startDate),
  endDate: isoDate(event.endDate),
  registrationClosesAt: isoDate(event.registrationClosesAt),
});

export default function EventBuilderPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(defaultEvent);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copyState, setCopyState] = useState(null);
  const copyTimer = useRef(null);
  const selectedIdRef = useRef(null);

  const inviteOrigin = typeof window !== "undefined" ? window.location.origin : "https://invite.local";
  const previewLink = form.shareUrl || `${inviteOrigin}/invite/${form.publicSlug || "your-slug"}`;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setEventsLoading(true);
    try {
      const response = await listEvents(token);
      const eventList = response.events || [];
      setEvents(eventList);

      if (eventList.length === 0) {
        setMode("create");
        setSelectedId(null);
        setForm(defaultEvent);
        return;
      }

      const fallbackId = eventList[0]?.id || null;
      const desiredId = selectedIdRef.current;
      const nextId = desiredId && eventList.find((evt) => evt.id === desiredId) ? desiredId : fallbackId;
      setSelectedId(nextId);
      setMode("edit");
      const active = eventList.find((evt) => evt.id === nextId);
      if (active) {
        setForm(hydrateForm(active));
      }
    } catch (err) {
      console.error("Unable to load events", err);
    } finally {
      setEventsLoading(false);
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

  const handleSelectEvent = (eventId) => {
    const event = events.find((evt) => evt.id === eventId);
    if (!event) return;
    setSelectedId(eventId);
    setForm(hydrateForm(event));
    setMode("edit");
    setMessage("");
  };

  const startCreateFlow = () => {
    setSelectedId(null);
    setMode("create");
    setForm(defaultEvent);
    setMessage("");
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => {
    const { id, shareUrl, createdAt, updatedAt, quota, ...payload } = form;
    return {
      ...payload,
      maxMainSlots: Number(payload.maxMainSlots) || 0,
      maxOverflowSlots: Number(payload.maxOverflowSlots) || 0,
    };
  };

  const upsertEventLocally = (event) => {
    setEvents((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === event.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = event;
        return next;
      }
      return [event, ...prev];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = buildPayload();
      let response;
      if (mode === "create") {
        response = await createEvent(token, payload);
        setMode("edit");
      } else if (selectedId) {
        response = await updateEvent(selectedId, token, payload);
      }

      if (response?.event) {
        setForm(hydrateForm(response.event));
        setSelectedId(response.event.id);
        upsertEventLocally(response.event);
        setMessage(mode === "create" ? "Event created" : "Event updated");
      }
    } catch (err) {
      setMessage(err.message || "Unable to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!token || !selectedId) return;
    try {
      const response = form.isRegistrationOpen
        ? await closeRegistration(selectedId, token, "Paused via builder")
        : await openRegistration(selectedId, token);

      if (response?.event) {
        setForm(hydrateForm(response.event));
        upsertEventLocally(response.event);
      }
    } catch (err) {
      setMessage(err.message || "Unable to update status");
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedId) return;
    const confirmed = window.confirm("Delete this event and all its registrations?");
    if (!confirmed) return;
    try {
      await deleteEventApi(selectedId, token);
      setEvents((prev) => prev.filter((evt) => evt.id !== selectedId));
      startCreateFlow();
      setMessage("Event deleted");
    } catch (err) {
      setMessage(err.message || "Unable to delete event");
    }
  };

  const handleCopy = async (link) => {
    if (!link) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        window.prompt("Copy invite link", link);
      }
      setCopyState(link);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyState(null), 2000);
    } catch (err) {
      console.error("Unable to copy invite link", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Event Builder</h1>
          <p className="text-sm text-slate-500">Launch unique landing links, control quotas, and reopen when ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedId && (
            <Button type="button" variant="secondary" onClick={handleToggleRegistration}>
              {form.isRegistrationOpen ? "Close registration" : "Open registration"}
            </Button>
          )}
          <Button type="button" variant="subtle" onClick={startCreateFlow}>
            New event
          </Button>
          <Button type="submit" form="event-form" disabled={saving}>
            {saving ? "Saving..." : mode === "create" ? "Create event" : "Save changes"}
          </Button>
        </div>
      </div>
      {message && <p className="text-sm text-primary-600">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[0.45fr_1fr]">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <CalendarRange className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Your events
              </p>
              <h2 className="font-display text-xl text-slate-900">Invite links</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={startCreateFlow}>
              + New
            </Button>
          </div>
          {eventsLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet. Create one to generate a unique invite link.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: "70vh" }}>
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleSelectEvent(event.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === event.id ? "border-primary-400 bg-primary-50/60" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                      <p className="text-xs text-slate-500">{formatDateRange(event.startDate, event.endDate) || "Schedule pending"}</p>
                    </div>
                    <Badge tone={event.isRegistrationOpen ? "success" : "warning"}>
                      {event.isRegistrationOpen ? "Live" : "Closed"}
                    </Badge>
                  </div>
                  <p className="mt-2 break-all text-xs text-slate-500">{event.shareUrl}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-6">
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <FileText className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Event Identity
              </p>
              <h2 className="font-display text-2xl text-slate-900">Basics</h2>
            </div>
            <Input label="Event Title" value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
            <label className="text-sm font-medium text-slate-700">
              Description
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Venue name" value={form.venueName} onChange={(e) => handleChange("venueName", e.target.value)} />
              <Input label="City / Location" value={form.location} onChange={(e) => handleChange("location", e.target.value)} />
            </div>
            <Input label="Address" value={form.venueAddress} onChange={(e) => handleChange("venueAddress", e.target.value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Start date" type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
              <Input label="End date" type="date" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Invite slug"
                value={form.publicSlug}
                onChange={(e) => handleChange("publicSlug", e.target.value)}
                hint="This becomes the shareable link suffix"
              />
              <Input label="Support email" value={form.contactEmail || ""} onChange={(e) => handleChange("contactEmail", e.target.value)} />
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Link2 className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Live link
              </p>
              <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                <span className="break-all font-mono text-xs text-slate-500">{previewLink}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="self-start"
                  onClick={() => handleCopy(previewLink)}
                >
                  <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                  {copyState === previewLink ? "Copied" : "Copy share link"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Layers3 className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Capacity Settings
              </p>
              <Input
                label="Main slots"
                type="number"
                value={form.maxMainSlots}
                onChange={(e) => handleChange("maxMainSlots", e.target.value)}
              />
              <Input
                label="Overflow slots"
                type="number"
                value={form.maxOverflowSlots}
                onChange={(e) => handleChange("maxOverflowSlots", e.target.value)}
              />
            </Card>
            <Card className="space-y-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <SlidersHorizontal className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Registration Logic
              </p>
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.requiresApproval}
                  onChange={(e) => handleChange("requiresApproval", e.target.checked)}
                />
                Require manual approval
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input type="checkbox" checked={form.allowWalkIns} onChange={(e) => handleChange("allowWalkIns", e.target.checked)} />
                Allow walk-ins when capacity allows
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.publicInviteEnabled}
                  onChange={(e) => handleChange("publicInviteEnabled", e.target.checked)}
                />
                Public invite link enabled
              </label>
              <Input
                label="Registration closes on"
                type="date"
                value={form.registrationClosesAt}
                onChange={(e) => handleChange("registrationClosesAt", e.target.value)}
              />
            </Card>
          </div>

          <Card className="space-y-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Check-in guidance
            </p>
            <label className="text-sm font-medium text-slate-700">
              Instructions for staff
              <textarea
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
                rows={3}
                value={form.checkInInstructions}
                onChange={(e) => handleChange("checkInInstructions", e.target.value)}
              />
            </label>
          </Card>

          {selectedId && (
            <div className="flex items-center justify-between rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              <span>Need to retire this event?</span>
              <button type="button" onClick={handleDelete} className="font-semibold">
                Delete event
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
