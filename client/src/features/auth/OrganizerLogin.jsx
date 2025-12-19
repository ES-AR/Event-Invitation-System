import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

export default function OrganizerLogin() {
  const { login, error } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await login(form);
      navigate("/admin", { replace: true });
    } catch (err) {
      setFormError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-between bg-slate-900 bg-[url('https://images.unsplash.com/photo-1503424886308-418b744a73b5?auto=format&fit=crop&w=900&q=60')] bg-cover bg-center px-12 py-10 text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">EventQuota</p>
          <h1 className="mt-4 font-display text-4xl">Organizer Login</h1>
          <p className="mt-3 max-w-md text-white/80">
            Manage quotas, approvals, and live check-ins from anywhere. Built for precision operations teams.
          </p>
        </div>
        <div className="rounded-3xl bg-white/10 p-6 text-white backdrop-blur">
          <p className="text-lg font-semibold">“Real-time attendance tracking is a game changer for our team.”</p>
          <p className="mt-3 text-sm text-white/80">Elena Rodriguez · Head of Operations, GlobalTech</p>
        </div>
      </section>
      <section className="flex items-center bg-white px-8 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Secure Portal</p>
            <h2 className="mt-2 font-display text-3xl text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Use the organizer credentials provided during onboarding.</p>
          </div>
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
          <div className="flex items-center justify-between text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => handleChange("remember", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600"
              />
              Keep me logged in
            </label>
            <a href="#forgot" className="font-semibold text-primary-600">
              Forgot password?
            </a>
          </div>
          {(formError || error) && <p className="text-sm font-semibold text-danger">{formError || error}</p>}
          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? "Signing in..." : "Log In"}
          </Button>
          <p className="text-sm text-slate-500">
            Need an organizer seat? <Link to="/admin/register" className="text-primary-600">Request access</Link>
            {" "}or <Link to="/" className="text-primary-600">contact support</Link>.
          </p>
        </form>
      </section>
    </div>
  );
}
