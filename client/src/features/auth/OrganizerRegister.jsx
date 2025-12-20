import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { registerAdmin } from "../../services/auth.service";

export default function OrganizerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await registerAdmin({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
      await login({ email: form.email, password: form.password });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create organizer account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-primary-900 px-10 py-12 text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">EventQuota</p>
          <h1 className="mt-4 font-display text-4xl">Start inviting in minutes</h1>
          <p className="mt-3 max-w-lg text-white/80">
            Anyone can create an organizer profile, publish events, and track RSVPs. All you need is an email address
            and a strong password.
          </p>
        </div>
        <ul className="space-y-3 text-white/80">
          <li className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-semibold">1</span>
            Enter your name so attendees recognize you
          </li>
          <li className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-semibold">2</span>
            Use any email (personal or work) and choose a strong password
          </li>
          <li className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-semibold">3</span>
            Sign in instantly to start creating events
          </li>
        </ul>
      </section>
      <section className="flex items-center bg-white px-8 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">New organizer</p>
            <h2 className="mt-2 font-display text-3xl text-slate-900">Create your account</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your dashboard is private to you. Use an email you can verify so attendees receive notifications from a name
              they trust.
            </p>
          </div>
          <Input
            label="Full name"
            value={form.displayName}
            onChange={(e) => handleChange("displayName", e.target.value)}
            required
          />
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            required
          />
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? "Creating account..." : "Register organizer"}
          </Button>
          <p className="text-sm text-slate-500">
            Already have credentials? <Link to="/admin/login" className="text-primary-600">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
