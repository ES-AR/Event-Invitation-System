import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

export default function OrganizerLogin() {
  const { login, error: authError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) {
      setFormError(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
            Sign back in to edit events, approve guests, and monitor approvals—all from your personal dashboard.
          </p>
        </div>
        <div className="rounded-3xl bg-white/10 p-6 text-white backdrop-blur">
          <p className="text-lg font-semibold">“I set up my birthday launch and community meetup in one weekend.”</p>
          <p className="mt-3 text-sm text-white/80">Elena · Creator & Host</p>
        </div>
      </section>
      <section className="flex items-center bg-white px-8 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Secure Portal</p>
            <h2 className="mt-2 font-display text-3xl text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Log in with the email and password you used during signup.</p>
          </div>
          <Input
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            icon={<Mail className="h-4 w-4" strokeWidth={1.8} />}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            icon={<Lock className="h-4 w-4" strokeWidth={1.8} />}
            error={formError || authError}
            rightSlot={
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="inline-flex items-center justify-center text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.8} /> : <Eye className="h-4 w-4" strokeWidth={1.8} />}
              </button>
            }
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
          {(formError || authError) && <p className="text-sm font-semibold text-danger">{formError || authError}</p>}
          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? "Signing in..." : "Log In"}
          </Button>
          <p className="text-sm text-slate-500">
            Need an account? <Link to="/admin/register" className="text-primary-600">Create one</Link>
            {" "}or <Link to="/" className="text-primary-600">explore the public site</Link>.
          </p>
        </form>
      </section>
    </div>
  );
}
