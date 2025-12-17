import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { getCheckInDetails, submitCheckIn } from "../../services/registration.service";

const FILE_HOST = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api$/, "");

export default function CheckInPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [details, setDetails] = useState(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("This check-in link is invalid");
      setLoading(false);
      return;
    }

    getCheckInDetails(token)
      .then((payload) => {
        setDetails(payload);
        setForm((prev) => ({
          ...prev,
          fullName: payload.attendee?.fullName || "",
          email: payload.attendee?.email || "",
          phone: payload.attendee?.phone || prev.phone,
        }));
        setError(null);
      })
      .catch((err) => setError(err.message || "Unable to load check-in details"))
      .finally(() => setLoading(false));
  }, [token]);

  const statusLabel = useMemo(() => {
    if (!details) return "";
    if (details.attendee?.checkedIn) return "Already Checked In";
    if (details.attendee?.status === "approved") return "Approved";
    return "Pending Verification";
  }, [details]);

  const handleFile = (file) => {
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError("Photo ID is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("photo", photo);
      const response = await submitCheckIn(token, formData);
      setSuccess(response);
    } catch (err) {
      setError(err.message || "Unable to check in");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <Card className="text-center">
          <h2 className="font-display text-3xl text-slate-900">Secure access required</h2>
          <p className="mt-3 text-slate-500">Please open the personalized link from your confirmation email.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      </div>
    );
  }

  if (success) {
    const photoUrl = success.attendee?.checkInPhoto?.startsWith("http")
      ? success.attendee.checkInPhoto
      : `${FILE_HOST}${success.attendee?.checkInPhoto || ""}`;
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-success">Verified</p>
          <h2 className="mt-4 font-display text-3xl text-slate-900">Check-in complete</h2>
          <p className="mt-2 text-slate-500">{success.message}</p>
          {success.attendee?.checkInPhoto && (
            <img src={photoUrl} alt="Check-in" className="mx-auto mt-6 h-56 w-56 rounded-2xl object-cover" />
          )}
        </Card>
      </div>
    );
  }

  if (details?.attendee?.checkedIn) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Already Checked In</p>
          <h2 className="mt-4 font-display text-3xl text-slate-900">See you inside!</h2>
          <p className="mt-2 text-slate-500">Our records show this badge has already been verified.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-10 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">TechConf 2024 Check-in</p>
            <h2 className="mt-2 font-display text-3xl text-slate-900">Verify your identity</h2>
          </div>
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">Secure Access</div>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
            <p className="font-semibold text-slate-800">Photo ID Upload</p>
            <p className="mt-2 text-sm text-slate-500">Click to upload or drag and drop. PNG/JPG up to 5MB.</p>
            <input type="file" accept="image/*" className="hidden" id="photo-input" onChange={(e) => handleFile(e.target.files?.[0])} />
            <label htmlFor="photo-input" className="mt-4 inline-flex cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-primary-600">
              {photo ? "Replace photo" : "Upload photo"}
            </label>
            {preview && <img src={preview} alt="Preview" className="mx-auto mt-4 h-48 w-48 rounded-2xl object-cover" />}
          </div>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>Status: {statusLabel}</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
              SSL encrypted
            </span>
          </div>
          <Button type="submit" disabled={submitting} className="justify-center">
            {submitting ? "Verifying..." : "Verify & Check-in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
