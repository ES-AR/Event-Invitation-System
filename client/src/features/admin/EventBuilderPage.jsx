import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { closeRegistration, getEventSettings, openRegistration, updateEventSettings } from "../../services/event.service";

export default function EventBuilderPage() {
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isoDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

  useEffect(() => {
    if (!token) return;
    getEventSettings(token).then(({ event }) => setEvent(event));
  }, [token]);

  const handleChange = (key, value) => {
    setEvent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { event: updated } = await updateEventSettings(token, event);
      setEvent(updated);
      setMessage("Event settings updated");
    } catch (err) {
      setMessage(err.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleRegistration = async () => {
    if (!event) return;
    try {
      if (event.isRegistrationOpen) {
        const { event: updated } = await closeRegistration(token, "Closed from builder");
        setEvent(updated);
      } else {
        const { event: updated } = await openRegistration(token);
        setEvent(updated);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-slate-900">Event Builder</h1>
          <p className="text-sm text-slate-500">Define identity, quotas, and registration rules</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={toggleRegistration}>
            {event.isRegistrationOpen ? "Close registration" : "Open registration"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Publish event"}
          </Button>
        </div>
      </div>
      {message && <p className="text-sm text-primary-600">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Event Identity</p>
            <h2 className="font-display text-2xl text-slate-900">Basics</h2>
          </div>
          <Input label="Event Title" value={event.title} onChange={(e) => handleChange("title", e.target.value)} required />
          <label className="text-sm font-medium text-slate-700">
            Description
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
              rows={4}
              value={event.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Venue name" value={event.venueName} onChange={(e) => handleChange("venueName", e.target.value)} />
            <Input label="City / Location" value={event.location} onChange={(e) => handleChange("location", e.target.value)} />
          </div>
          <Input label="Address" value={event.venueAddress} onChange={(e) => handleChange("venueAddress", e.target.value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Start date" type="date" value={isoDate(event.startDate)} onChange={(e) => handleChange("startDate", e.target.value)} />
            <Input label="End date" type="date" value={isoDate(event.endDate)} onChange={(e) => handleChange("endDate", e.target.value)} />
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Capacity Settings</p>
            <Input
              label="Main slots"
              type="number"
              value={event.maxMainSlots}
              onChange={(e) => handleChange("maxMainSlots", Number(e.target.value))}
            />
            <Input
              label="Overflow slots"
              type="number"
              value={event.maxOverflowSlots}
              onChange={(e) => handleChange("maxOverflowSlots", Number(e.target.value))}
            />
          </Card>
          <Card className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Registration Logic</p>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={event.requiresApproval}
                onChange={(e) => handleChange("requiresApproval", e.target.checked)}
              />
              Require approval before auto-confirming spots
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={event.allowWalkIns} onChange={(e) => handleChange("allowWalkIns", e.target.checked)} />
              Allow walk-ins if quota permits
            </label>
            <Input
              label="Registration closes on"
              type="date"
              value={isoDate(event.registrationClosesAt)}
              onChange={(e) => handleChange("registrationClosesAt", e.target.value)}
            />
          </Card>
        </div>
      </div>
    </form>
  );
}
