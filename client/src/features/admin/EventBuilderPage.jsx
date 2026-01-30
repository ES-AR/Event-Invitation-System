import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, FileText, Layers3, Link2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import {
  checkSlugAvailability,
  closeRegistration,
  createEvent,
  deleteEvent as deleteEventApi,
  getEvent,
  openRegistration,
  updateEvent,
  issueCheckInToken,
} from "../../services/event.service";
import LocationPicker from "./components/LocationPicker";

const localTimeZone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "UTC";
const timezoneCatalog = [
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];
const timezoneOptions = Array.from(new Set([localTimeZone, ...timezoneCatalog]));

const defaultEvent = {
  title: "",
  description: "",
  venueName: "",
  location: "",
  locationLatitude: null,
  locationLongitude: null,
  venueAddress: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  maxMainSlots: 100,
  maxOverflowSlots: 0,
  requiresApproval: true,
  allowWalkIns: false,
  registrationClosesAt: "",
  registrationClosesTime: "",
  publicSlug: "",
  publicInviteEnabled: true,
  checkInInstructions: "",
  contactEmail: "",
  timezone: localTimeZone,
  checkInLink: "",
  checkInTokenHint: "",
  checkInTokenIssuedAt: "",
};

const inviteOrigin = typeof window !== "undefined" ? window.location.origin : "https://invite.local";

const formatDateForInput = (value, timeZone = localTimeZone) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    console.warn("Unable to format date for input", error);
    return new Date(value).toISOString().slice(0, 10);
  }
};

const formatTimeForInput = (value, timeZone = localTimeZone) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch (error) {
    console.warn("Unable to format time for input", error);
    return new Date(value).toISOString().slice(11, 16);
  }
};

const getTimeZoneOffset = (timeZone, date = new Date()) => {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = dtf.formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});
    const asUTC = Date.UTC(
      parts.year,
      Number(parts.month) - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    return asUTC - date.getTime();
  } catch (error) {
    console.warn("Unable to compute timezone offset", error);
    return 0;
  }
};

const combineDateTime = (date, time, timeZone = localTimeZone) => {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour = 0, minute = 0] = (time || "00:00").split(":").map(Number);
  const assumedUTC = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hour, minute));
  const offset = getTimeZoneOffset(timeZone, assumedUTC);
  return new Date(assumedUTC.getTime() - offset).toISOString();
};

const hydrateForm = (event = defaultEvent) => {
  const timeZone = event.timezone || localTimeZone;
  return {
    ...defaultEvent,
    ...event,
    locationLatitude: event.locationLatitude ?? null,
    locationLongitude: event.locationLongitude ?? null,
    timezone: timeZone,
    startDate: formatDateForInput(event.startDate, timeZone),
    startTime: formatTimeForInput(event.startDate, timeZone),
    endDate: formatDateForInput(event.endDate, timeZone),
    endTime: formatTimeForInput(event.endDate, timeZone),
    registrationClosesAt: formatDateForInput(event.registrationClosesAt, timeZone),
    registrationClosesTime: formatTimeForInput(event.registrationClosesAt, timeZone),
    checkInLink: event.checkIn?.link || event.checkInLink || "",
    checkInTokenHint: event.checkIn?.tokenHint || event.checkInTokenHint || "",
    checkInTokenIssuedAt: event.checkIn?.tokenIssuedAt || event.checkInTokenIssuedAt || "",
  };
};
export default function EventBuilderPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...defaultEvent });
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copyState, setCopyState] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [issuingToken, setIssuingToken] = useState(false);
  const [freshToken, setFreshToken] = useState("");
  const copyTimer = useRef(null);
  const slugCheckTimer = useRef(null);
  const freshTokenTimer = useRef(null);
  const [slugStatus, setSlugStatus] = useState({ state: "idle" });
  const eventIdParam = searchParams.get("eventId");

  const previewLinks = useMemo(() => {
    const slugSegment = form.publicSlug?.trim() || "your-slug";
    const baseLink = `${inviteOrigin}/invite/${slugSegment}`;
    return {
      main: baseLink,
      overflow: `${baseLink}?tier=overflow`,
      checkIn: `${inviteOrigin}/checkin/${slugSegment}`,
    };
  }, [form.publicSlug, inviteOrigin]);
  const resolvedCheckInLink = form.checkInLink?.trim() || previewLinks.checkIn;
  const tokenIssuedLabel = form.checkInTokenIssuedAt
    ? new Date(form.checkInTokenIssuedAt).toLocaleString()
    : "Never issued";
  const slugHint = useMemo(() => {
    switch (slugStatus.state) {
      case "checking":
        return "Checking availability...";
      case "available":
        return "Slug looks good.";
      case "adjusted":
        return `Slug in use. Updated to ${slugStatus.slug}.`;
      case "unavailable":
        return "Slug already in use.";
      case "error":
        return slugStatus.message || "Unable to verify slug.";
      default:
        return "This becomes the shareable link suffix.";
    }
  }, [slugStatus]);


  const loadEvent = useCallback(
    async (eventId) => {
      if (!token || !eventId) return;
      setLoadingEvent(true);
      try {
        const response = await getEvent(eventId, token);
        if (response?.event) {
          setForm(hydrateForm(response.event));
          setSelectedId(response.event.id);
          setMode("edit");
          setMessage("");
          setFreshToken("");
        }
      } catch (err) {
        console.error("Unable to load event", err);
      } finally {
        setLoadingEvent(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    if (eventIdParam) {
      loadEvent(eventIdParam);
    } else {
      setSelectedId(null);
      setMode("create");
      setForm({ ...defaultEvent });
      setMessage("");
    }
  }, [eventIdParam, loadEvent, token]);

  useEffect(() => {
    if (!token) return;
    const slugCandidate = (form.publicSlug || "").trim();
    if (!slugCandidate) {
      setSlugStatus({ state: "idle" });
      if (slugCheckTimer.current) {
        clearTimeout(slugCheckTimer.current);
      }
      return;
    }

    if (slugCheckTimer.current) {
      clearTimeout(slugCheckTimer.current);
    }

    slugCheckTimer.current = setTimeout(async () => {
      try {
        setSlugStatus({ state: "checking", slug: slugCandidate });
        const response = await checkSlugAvailability(token, slugCandidate, selectedId);
        const resolvedSlug = response?.slug || slugCandidate;
        if (response?.available) {
          setSlugStatus({ state: "available", slug: resolvedSlug });
          return;
        }

        if (resolvedSlug !== slugCandidate) {
          setSlugStatus({ state: "adjusted", slug: resolvedSlug });
          setForm((prev) => ({ ...prev, publicSlug: resolvedSlug }));
        } else {
          setSlugStatus({ state: "unavailable", slug: resolvedSlug });
        }
      } catch (error) {
        setSlugStatus({ state: "error", message: error.message || "Unable to verify slug" });
      }
    }, 450);

    return () => {
      if (slugCheckTimer.current) {
        clearTimeout(slugCheckTimer.current);
      }
    };
  }, [form.publicSlug, token, selectedId]);

  useEffect(
    () => () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
      if (freshTokenTimer.current) {
        clearTimeout(freshTokenTimer.current);
      }
    },
    []
  );

  const startCreateFlow = () => {
    setSelectedId(null);
    setMode("create");
    setForm({ ...defaultEvent });
    setMessage("");
    setFreshToken("");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("eventId");
      return params;
    });
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "publicSlug") {
        next.checkInLink = "";
      }
      return next;
    });
  };

  const buildPayload = () => {
    const {
      id,
      shareUrl,
      createdAt,
      updatedAt,
      quota,
      checkInLink,
      checkInTokenHint,
      checkInTokenIssuedAt,
      startTime,
      endTime,
      registrationClosesTime,
      timezone,
      ...payload
    } = form;
    const resolvedTimeZone = timezone || localTimeZone;

    const builtPayload = {
      ...payload,
      timezone: resolvedTimeZone,
      startDate: combineDateTime(payload.startDate, startTime, resolvedTimeZone),
      endDate: combineDateTime(payload.endDate, endTime, resolvedTimeZone),
      registrationClosesAt: combineDateTime(
        payload.registrationClosesAt,
        registrationClosesTime,
        resolvedTimeZone
      ),
      maxMainSlots: Number(payload.maxMainSlots) || 0,
      maxOverflowSlots: Number(payload.maxOverflowSlots) || 0,
    };

    if (builtPayload.locationLatitude !== null && builtPayload.locationLatitude !== undefined) {
      builtPayload.locationLatitude = Number(builtPayload.locationLatitude);
    }

    if (builtPayload.locationLongitude !== null && builtPayload.locationLongitude !== undefined) {
      builtPayload.locationLongitude = Number(builtPayload.locationLongitude);
    }

    return builtPayload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = buildPayload();
      const wasCreating = mode === "create";
      let response;
      if (wasCreating) {
        response = await createEvent(token, payload);
      } else if (selectedId) {
        response = await updateEvent(selectedId, token, payload);
      }

      if (response?.event) {
        setForm(hydrateForm(response.event));
        setSelectedId(response.event.id);
        setMode("edit");
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.set("eventId", response.event.id);
          return params;
        });
        setMessage(wasCreating ? "Event created" : "Event updated");
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

  const handleIssueToken = async () => {
    if (!token || !selectedId) return;
    setIssuingToken(true);
    try {
      const response = await issueCheckInToken(selectedId, token);
      if (response?.event) {
        setForm(hydrateForm(response.event));
      }
      if (response?.token) {
        setFreshToken(response.token);
        if (freshTokenTimer.current) {
          clearTimeout(freshTokenTimer.current);
        }
        freshTokenTimer.current = setTimeout(() => setFreshToken(""), 60000);
      }
    } catch (err) {
      setMessage(err.message || "Unable to refresh the check-in token");
    } finally {
      setIssuingToken(false);
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

      {loadingEvent ? (
        <Card className="flex min-h-[40vh] items-center justify-center">
          <div className="spinner-ring" />
        </Card>
      ) : (
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
              <Input label="Venue address" value={form.venueAddress} onChange={(e) => handleChange("venueAddress", e.target.value)} />
            </div>
            <LocationPicker
              token={token}
              value={{
                label: form.location,
                latitude: form.locationLatitude,
                longitude: form.locationLongitude,
              }}
              onChange={(next) => {
                handleChange("location", next.label || "");
                handleChange("locationLatitude", next.latitude ?? null);
                handleChange("locationLongitude", next.longitude ?? null);
              }}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Start date" type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} />
              <Input label="End date" type="date" value={form.endDate} onChange={(e) => handleChange("endDate", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Start time" type="time" value={form.startTime} onChange={(e) => handleChange("startTime", e.target.value)} />
              <Input label="End time" type="time" value={form.endTime} onChange={(e) => handleChange("endTime", e.target.value)} />
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Event timezone
              <select
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-primary-400 focus:outline-none"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Invite slug"
                value={form.publicSlug}
                onChange={(e) => handleChange("publicSlug", e.target.value)}
                hint={slugHint}
                required
              />
              <Input label="Support email" value={form.contactEmail || ""} onChange={(e) => handleChange("contactEmail", e.target.value)} />
            </div>
            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <Link2 className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Live link
              </p>
              <div className="mt-2 space-y-3">
                {[{ key: "main", label: "Main registration", value: previewLinks.main }]
                  .concat(
                    Number(form.maxOverflowSlots) > 0
                      ? [{ key: "overflow", label: "Overflow backup link", value: previewLinks.overflow }]
                      : []
                  )
                  .map((link) => (
                    <div
                      key={link.key}
                      className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                        {link.label}
                      </span>
                      <span className="break-all font-mono text-xs text-slate-500">{link.value}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="self-start"
                        onClick={() => handleCopy(link.value)}
                      >
                        <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                        {copyState === link.value ? "Copied" : "Copy link"}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Check-in desk
              </p>
              <div className="mt-2 space-y-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Staff link</span>
                  <span className="break-all font-mono text-xs text-slate-500">{resolvedCheckInLink}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    onClick={() => handleCopy(resolvedCheckInLink)}
                  >
                    <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                    {copyState === resolvedCheckInLink ? "Copied" : "Copy link"}
                  </Button>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active token hint</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.checkInTokenHint ? `Ends with ${form.checkInTokenHint}` : "Not issued yet"}
                  </p>
                  <p className="text-xs text-slate-400">Last rotated · {tokenIssuedLabel}</p>
                  {freshToken && (
                    <div className="mt-3 space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-500">New token</p>
                      <p className="font-mono text-lg">{freshToken}</p>
                      <p className="text-xs text-emerald-700">Visible for 60 seconds — share directly with gate staff.</p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="border-emerald-400 text-emerald-800"
                        onClick={() => handleCopy(freshToken)}
                      >
                        <Copy className="mr-2 h-4 w-4" strokeWidth={1.8} />
                        {copyState === freshToken ? "Copied" : "Copy token"}
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    className="mt-3"
                    variant="primary"
                    disabled={!selectedId || issuingToken}
                    onClick={handleIssueToken}
                  >
                    {issuingToken ? "Generating…" : form.checkInTokenHint ? "Rotate token" : "Generate token"}
                  </Button>
                </div>
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
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Registration closes on"
                  type="date"
                  value={form.registrationClosesAt}
                  onChange={(e) => handleChange("registrationClosesAt", e.target.value)}
                />
                <Input
                  label="Registration closes at"
                  type="time"
                  value={form.registrationClosesTime}
                  onChange={(e) => handleChange("registrationClosesTime", e.target.value)}
                />
              </div>
            </Card>
          </div>

          <Card className="space-y-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Guest guidance
            </p>
            <label className="text-sm font-medium text-slate-700">
              Arrival instructions for staff/guests
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
      )}
    </div>
  );
}
