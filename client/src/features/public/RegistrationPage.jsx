import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Ticket,
  UploadCloud,
  UserRound,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { getPublicEvent } from "../../services/event.service";
import { submitRegistration } from "../../services/registration.service";
import { formatDateRange } from "../../utils/formatters";
import EventLocationMap from "./components/EventLocationMap";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  jobTitle: "",
};

const trustPoints = [
  "Duplicate detection keeps your invite unique.",
  "Hosts may approve RSVP before sharing directions.",
  "Photo ID is captured with your RSVP so approvals move faster.",
];

export default function RegistrationPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tierParam = (searchParams.get("tier") || "").toLowerCase();
  const derivedTier = tierParam === "overflow" ? "overflow" : "main";
  const [slotChoice, setSlotChoice] = useState(derivedTier);
  const isOverflowView = slotChoice === "overflow";
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    setSlotChoice(derivedTier);
  }, [derivedTier]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const { event: eventData } = await getPublicEvent(slug);
        if (isMounted) {
          setEvent(eventData);
          setError(null);
        }
      } catch (err) {
        setError(err.message || "Unable to load event");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const tierPill = useMemo(() => {
    if (!event) return null;
    const label = slotChoice === "overflow" ? "Overflow Waitlist" : "Main Slot";
    const tone = slotChoice === "overflow" ? "warning" : "success";
    return <Badge tone={tone}>{label}</Badge>;
  }, [event, slotChoice]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoChange = (file) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(nextPreview);
  };

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const quotaStats = useMemo(() => {
    const main = event?.quota?.main || { capacity: 0, used: 0, remaining: 0 };
    const overflow = event?.quota?.overflow || { capacity: 0, used: 0, remaining: 0 };
    const percent = (data) => {
      if (!data || !data.capacity) return 0;
      return Math.min((data.used / data.capacity) * 100, 100);
    };
    return {
      main: { ...main, percent: percent(main) },
      overflow: { ...overflow, percent: percent(overflow) },
    };
  }, [event]);
  const visibleTierData = isOverflowView ? quotaStats.overflow : quotaStats.main;
  const mainRemaining = quotaStats.main?.remaining ?? 0;
  const overflowRemaining = quotaStats.overflow?.remaining ?? 0;
  const overflowConfigured = (event?.maxOverflowSlots ?? quotaStats.overflow?.capacity ?? 0) > 0;
  const overflowHasRoom = overflowRemaining > 0;
  const mainCapacityConfigured = (event?.maxMainSlots ?? quotaStats.main?.capacity ?? 0) > 0;
  const mainFull = mainCapacityConfigured && mainRemaining <= 0;
  const waitlistOfferActive = !isOverflowView && mainFull && overflowConfigured && overflowHasRoom;
  const waitlistUnavailable = mainFull && (!overflowConfigured || !overflowHasRoom);
  const overflowClosed = isOverflowView && (!overflowConfigured || !overflowHasRoom);
  const submitDisabled =
    submitting || (!isOverflowView && waitlistUnavailable) || overflowClosed;
  const submitLabel = !isOverflowView && waitlistUnavailable
    ? "Registration full"
    : overflowClosed
      ? "Waitlist full"
      : submitting
        ? "Submitting..."
        : isOverflowView
          ? "Join overflow waitlist"
          : "Request my invite";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) {
      setError("Event details are still loading. Try again.");
      return;
    }

    if (!photoFile) {
      setError("Please upload a photo to continue.");
      return;
    }

    if (!isOverflowView && waitlistUnavailable) {
      setError("Registration is currently full. Please check back later.");
      return;
    }

    if (!isOverflowView && waitlistOfferActive) {
      setError("Main registration is full. Tap \"Join overflow waitlist\" to continue.");
      return;
    }

    if (isOverflowView) {
      if (!overflowConfigured) {
        setError("Overflow quota is not available for this event.");
        return;
      }
      if (!mainFull) {
        setError("Main quota still has space. Use the primary registration link.");
        return;
      }
      if (!overflowHasRoom) {
        setError("Overflow quota is currently full.");
        return;
      }
    }

    if (!isOverflowView && mainFull) {
      setError("Main quota is currently full. Please join the overflow waitlist.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("fullName", `${form.firstName} ${form.lastName}`.trim());
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("jobTitle", form.jobTitle);
      formData.append("slug", slug || event?.publicSlug);
      formData.append("ticketTier", isOverflowView ? "Overflow" : "Main");
      formData.append("dietaryRestrictions", "None");
      formData.append("note", "");
      formData.append("photo", photoFile);
      const { message, registration } = await submitRegistration(formData);
      setStatus({ message, registration });
      setForm(initialForm);
      handlePhotoChange(null);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  if (status) {
    const suffix = isOverflowView ? "?tier=overflow" : "";
    const inviteUrl = typeof window !== "undefined" && event?.publicSlug
      ? `https://${window.location.host}/invite/${event.publicSlug}${suffix}`
      : event?.publicSlug
        ? `/invite/${event.publicSlug}${suffix}`
        : "";
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-primary-900 to-rose-800 p-10 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Registration confirmed</p>
          <h2 className="mt-4 text-3xl font-semibold">Thanks, {status.registration?.fullName}!</h2>
          <p className="mt-2 text-sm text-white/80">{status.message}</p>
          <p className="text-xs text-white/70">If your event requires approval, the full details will arrive via email as soon as a host reviews your RSVP.</p>
          <div className="mt-8 grid gap-4 text-sm">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-semibold">Invite link</p>
              <p className="text-white/70">{inviteUrl}</p>
            </div>
            <Button onClick={() => window.print()} variant="secondary" className="bg-white text-slate-900">
              Save confirmation
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 lg:flex-row">
        <section className="flex-1 space-y-6">
          <article className="overflow-hidden rounded-[32px] border border-slate-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 text-white shadow-2xl">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/70">
              <Sparkles className="h-4 w-4" strokeWidth={1.6} /> RSVP portal
              {tierPill}
            </div>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{event?.title}</h2>
            <p className="mt-2 text-sm text-white/70">{event?.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60">
                  <CalendarClock className="h-4 w-4" /> When
                </div>
                <p className="mt-2 text-base font-semibold text-white">
                  {formatDateRange(event?.startDate, event?.endDate, event?.timezone)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60">
                  <MapPin className="h-4 w-4" /> Where
                </div>
                <p className="mt-2 text-base font-semibold text-white">{event?.venueName || event?.location}</p>
                <p className="text-xs text-white/70">{event?.venueAddress || "Exact address shared post-approval."}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 text-sm text-white/80 sm:grid-cols-2">
              <div>
                <p className="uppercase text-white/60">Host contact</p>
                <p className="font-semibold">{event?.contactEmail || "Shared after approval"}</p>
                <p>{event?.contactPhone}</p>
              </div>
              <div>
                <p className="uppercase text-white/60">Arrival notes</p>
                <p>{event?.badgeMessaging || "Bring valid ID for entry."}</p>
              </div>
            </div>
          </article>

          {typeof event?.locationLatitude === "number" && typeof event?.locationLongitude === "number" && (
            <Card className="border border-slate-100/80 bg-white/95 p-6">
              <EventLocationMap
                title={event?.title}
                address={event?.venueAddress || event?.location}
                latitude={event.locationLatitude}
                longitude={event.locationLongitude}
              />
            </Card>
          )}

          <Card className="space-y-5 border border-slate-100/80 bg-white/95 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
              <Ticket className="h-4 w-4" /> Availability
            </div>
            <div className="space-y-4">
              {visibleTierData?.capacity ? (
                <div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-500">
                    <span>{isOverflowView ? "Overflow quota" : "Main quota"}</span>
                    <span>
                      {visibleTierData.used}/{visibleTierData.capacity}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${isOverflowView ? "bg-amber-500" : "bg-primary-500"}`}
                      style={{ width: `${visibleTierData.percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{Math.max(visibleTierData.remaining ?? 0, 0)} spots left</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {isOverflowView ? "Overflow" : "Main"} quota not configured.
                </p>
              )}
              {!isOverflowView && quotaStats.overflow?.capacity > 0 && (
                <p className="text-xs text-slate-500">
                  Overflow seats live at a separate link once the main quota fills.
                </p>
              )}
              {isOverflowView && quotaStats.main?.remaining > 0 && (
                <p className="text-xs font-semibold text-amber-600">
                  Main quota still has {quotaStats.main.remaining} spots. Hosts typically reserve overflow for later waves.
                </p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-100 bg-white/95 p-6">
            <p className="text-sm font-semibold text-slate-800">Before you submit</p>
            <ul className="space-y-3 text-sm text-slate-600">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary-500" strokeWidth={2} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="flex-1 space-y-6">
          {waitlistOfferActive && (
            <Card className="border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="text-sm font-semibold text-amber-900">Main registration is full.</p>
              <p className="mt-2 text-sm text-amber-800">
                Would you like to join the overflow waitlist? We'll notify you as soon as seats open up.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setSlotChoice("overflow");
                    setError(null);
                  }}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  Join overflow waitlist
                </Button>
              </div>
            </Card>
          )}

          {waitlistUnavailable && (
            <Card className="border border-slate-200 bg-slate-50 p-5 text-slate-700">
              <p className="text-sm font-semibold text-slate-900">Registration currently full</p>
              <p className="mt-2 text-sm">
                Both the main quota and overflow waitlist are at capacity. Please check back later or contact the host.
              </p>
            </Card>
          )}

          {isOverflowView && (
            <Card className="border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="text-sm font-semibold">You're joining the overflow waitlist</p>
              <p className="mt-2 text-sm text-amber-800">
                We'll email you if a seat opens up. In the meantime, your RSVP remains pending.
              </p>
              {!mainFull && (
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700"
                  onClick={() => {
                    setSlotChoice("main");
                    setError(null);
                  }}
                >
                  Return to main RSVP
                </button>
              )}
            </Card>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
              <span>Step 1 · RSVP Details</span>
              <span>{event?.publicSlug}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                icon={<UserRound className="h-4 w-4" strokeWidth={1.8} />}
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                required
              />
              <Input
                label="Last name"
                icon={<UserRound className="h-4 w-4" strokeWidth={1.8} />}
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                required
              />
            </div>
            <Input
              label="Email address"
              type="email"
              icon={<Mail className="h-4 w-4" strokeWidth={1.8} />}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              hint="Confirmation and invite updates arrive here"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                inputMode="tel"
                icon={<Phone className="h-4 w-4" strokeWidth={1.8} />}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+234 803 000 0000"
                hint="Include country code (e.g. +234...)"
              />
              <Input
                label="Role or title"
                icon={<Briefcase className="h-4 w-4" strokeWidth={1.8} />}
                value={form.jobTitle}
                onChange={(e) => handleChange("jobTitle", e.target.value)}
                hint="Optional"
              />
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-slate-700">
                <UploadCloud className="h-4 w-4 text-primary-500" strokeWidth={1.8} /> Photo verification
              </p>
              <p className="mt-1 text-xs text-slate-500">Upload a clear headshot (PNG or JPG, max 5MB). This is shared with the host for on-site validation.</p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="attendee-photo-input"
                onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="attendee-photo-input"
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700"
              >
                <UploadCloud className="h-4 w-4" strokeWidth={1.8} /> {photoFile ? "Replace photo" : "Upload photo"}
              </label>
              {photoPreview && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <img src={photoPreview} alt="RSVP preview" className="h-32 w-32 rounded-2xl object-cover shadow-sm" />
                  <button type="button" className="text-xs font-semibold text-danger" onClick={() => handlePhotoChange(null)}>
                    Remove photo
                  </button>
                </div>
              )}
            </div>
            {error && <p className="text-sm font-semibold text-danger">{error}</p>}
            <Button type="submit" disabled={submitDisabled} className="w-full justify-center">
              {submitLabel}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
