import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { getPublicEvent } from "../../services/event.service";
import { requestCaptcha, submitRegistration } from "../../services/registration.service";
import { formatDateRange } from "../../utils/formatters";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  jobTitle: "",
  dietaryRestrictions: "None",
  note: "",
  captchaAnswer: "",
  agree: false,
};

const trustPoints = [
  "Tiered quotas and overflow lists keep commitments precise.",
  "Instant duplicate detection prevents double-booking.",
  "Integrated check-in photo audit for security teams.",
];

export default function RegistrationPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [captcha, setCaptcha] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [{ event: eventData }, captchaData] = await Promise.all([
          getPublicEvent(slug),
          requestCaptcha(),
        ]);
        if (isMounted) {
          setEvent(eventData);
          setCaptcha(captchaData);
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
    const remaining = event.quota?.main?.remaining ?? 0;
    const soldOut = remaining <= 0;
    return (
      <Badge tone={soldOut ? "warning" : "success"}>{soldOut ? "Overflow Registration" : "Main Slot"}</Badge>
    );
  }, [event]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const refreshCaptcha = async () => {
    const updated = await requestCaptcha();
    setCaptcha(updated);
    handleChange("captchaAnswer", "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agree) {
      setError("Please agree to the terms to continue");
      return;
    }
    if (!captcha?.token) {
      setError("Captcha expired. Please refresh and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        captchaToken: captcha.token,
        slug: slug || event?.publicSlug,
        ticketTier: event?.quota?.main?.remaining > 0 ? "Main" : "Overflow",
      };
      const { message, registration } = await submitRegistration(payload);
      setStatus({ message, registration });
    } catch (err) {
      setError(err.message || "Registration failed");
      refreshCaptcha();
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
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Registration Received</p>
          <h2 className="mt-4 font-display text-3xl text-slate-900">{status.registration?.fullName}</h2>
          <p className="mt-2 text-slate-500">{status.message}</p>
          <div className="mt-8">
            <Button onClick={() => window.print()} className="w-full justify-center">
              Save confirmation
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1fr_1.1fr]">
      <section className="space-y-6">
        <Card className="bg-white/90">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Event Overview</p>
          <h2 className="mt-3 font-display text-3xl text-slate-900">{event?.title}</h2>
          <p className="mt-2 text-slate-500">{event?.description}</p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-primary-600">
                <CalendarClock className="h-4 w-4" strokeWidth={1.8} />
                <p className="text-xs uppercase tracking-[0.3em] text-primary-600">When</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatDateRange(event?.startDate, event?.endDate, event?.timezone)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-primary-600">
                <MapPin className="h-4 w-4" strokeWidth={1.8} />
                <p className="text-xs uppercase tracking-[0.3em] text-primary-600">Where</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800">{event?.venueName || event?.location}</p>
              <p className="text-xs text-slate-500">{event?.venueAddress}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-primary-600">
                <Activity className="h-4 w-4" strokeWidth={1.8} />
                <p className="text-xs uppercase tracking-[0.3em] text-primary-600">Registration Status</p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                {tierPill}
                <span className="text-sm text-slate-500">
                  {event?.isRegistrationOpen ? "Open" : event?.closeReason || "Closed"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>Main slots remaining: {event?.quota?.main?.remaining ?? "—"}</p>
                <p>Overflow slots remaining: {event?.quota?.overflow?.remaining ?? "—"}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-800">Why organizers trust EventHub</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary-500" strokeWidth={2} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <section>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-card">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Secure Registration</p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">Attendee Information</h2>
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
            label="Work email"
            type="email"
            icon={<Mail className="h-4 w-4" strokeWidth={1.8} />}
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            hint="We’ll send confirmations here"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Phone"
              icon={<Phone className="h-4 w-4" strokeWidth={1.8} />}
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Organization"
              icon={<Building2 className="h-4 w-4" strokeWidth={1.8} />}
              value={form.organization}
              onChange={(e) => handleChange("organization", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Job title"
              icon={<Briefcase className="h-4 w-4" strokeWidth={1.8} />}
              value={form.jobTitle}
              onChange={(e) => handleChange("jobTitle", e.target.value)}
            />
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Dietary preferences
              <select
                value={form.dietaryRestrictions}
                onChange={(e) => handleChange("dietaryRestrictions", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-primary-400 focus:outline-none"
              >
                <option>None</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>Gluten-free</option>
                <option>Halal</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Notes for organizers
            <textarea
              rows={4}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-primary-400 focus:outline-none"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
            />
          </label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-primary-500" strokeWidth={1.8} /> Security Check
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-xl bg-white px-4 py-2 font-mono text-lg text-slate-900">{captcha?.prompt}</span>
              <Input
                label="Your answer"
                icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.8} />}
                value={form.captchaAnswer}
                onChange={(e) => handleChange("captchaAnswer", e.target.value)}
                className="flex-1"
                required
              />
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> Refresh
                </button>
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              checked={form.agree}
              onChange={(e) => handleChange("agree", e.target.checked)}
            />
            I agree to the <a className="text-primary-600" href="#terms">Terms of Service</a> and <a className="text-primary-600" href="#privacy">Privacy Policy</a>.
          </label>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? "Submitting..." : "Secure my spot"}
          </Button>
        </form>
      </section>
    </div>
  );
}
