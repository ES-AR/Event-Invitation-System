import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-secondary">
    {label}
    <input
      className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40 bg-white"
      {...props}
    />
  </label>
);

function Stat({ title, value, highlight }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-secondary' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

export default function RegistrationPage() {
  const [eventData, setEventData] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', organization: '', note: '', captchaAnswer: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);

  const isClosed = useMemo(() => {
    if (!eventData) return false;
    return eventData.isClosed;
  }, [eventData]);

  const loadEvent = async () => {
    const res = await api.get('/event');
    setEventData(res.data);
  };

  const loadCaptcha = async () => {
    const res = await api.get('/captcha');
    setCaptcha(res.data);
    setForm((f) => ({ ...f, captchaAnswer: '' }));
  };

  useEffect(() => {
    loadEvent();
    loadCaptcha();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...form, captchaId: captcha?.id };
      const res = await api.post('/register', payload);
      setMessage(res.data.message);
      setForm({ name: '', email: '', phone: '', organization: '', note: '', captchaAnswer: '' });
      await loadEvent();
      await loadCaptcha();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit registration.');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const stats = eventData?.stats || {};

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Public Registration</p>
              <h1 className="text-2xl font-semibold text-secondary">{eventData?.event?.title || 'Event Registration'}</h1>
              <p className="text-gray-600 mt-1">{eventData?.event?.description}</p>
            </div>
            <div className={`px-3 py-2 rounded-full text-sm font-semibold ${isClosed ? 'bg-danger text-secondary' : 'bg-green-100 text-green-900'}`}>
              {isClosed ? 'Closed' : 'Open'}
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-gray-600">Main Capacity</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-secondary">{stats.mainCount || 0}</span>
                <span className="text-sm text-gray-600">/ {eventData?.event?.maxMainSlots || 0}</span>
              </div>
              <div className="h-2 bg-white rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-secondary"
                  style={{ width: `${Math.min(100, ((stats.mainCount || 0) / (eventData?.event?.maxMainSlots || 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-gray-600">Overflow Capacity</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-semibold text-secondary">{stats.overflowCount || 0}</span>
                <span className="text-sm text-gray-600">/ {eventData?.event?.overflowSlots || 0}</span>
              </div>
              <div className="h-2 bg-white rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{ width: `${Math.min(100, ((stats.overflowCount || 0) / (eventData?.event?.overflowSlots || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Single Public Link</p>
              <h2 className="text-lg font-semibold text-secondary">Register your attendance</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-xl font-semibold text-secondary">{stats.approved || 0}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Organization" name="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-secondary">
            Note (special requirements)
            <textarea
              className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary/40 bg-white"
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-gray-600">Captcha</p>
              <p className="text-lg font-semibold text-secondary mt-1">{captcha?.question || 'Loading...'}</p>
            </div>
            <Input
              label="Your Answer"
              name="captcha"
              value={form.captchaAnswer}
              onChange={(e) => setForm({ ...form, captchaAnswer: e.target.value })}
              required
            />
          </div>

          {message && <div className="bg-green-50 text-green-900 border border-green-200 rounded-lg p-3">{message}</div>}
          {error && <div className="bg-danger text-secondary border border-red-300 rounded-lg p-3">{error}</div>}

          <div className="flex gap-3 flex-wrap">
            <button type="submit" disabled={loading || isClosed} className="btn btn-primary disabled:opacity-60">
              {isClosed ? 'Registration Closed' : loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <button type="button" onClick={loadCaptcha} className="btn btn-ghost">
              Refresh Captcha
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <Stat title="Pending Approval" value={stats.pending || 0} highlight />
        <Stat title="Checked-In" value={stats.checkedIn || 0} />
        <div className="card space-y-2">
          <p className="font-semibold text-secondary">Event Access Control</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Quota-controlled main and overflow seats</li>
            <li>• Admin approval before invitations are sent</li>
            <li>• Personalized email check-in links</li>
            <li>• Photo-based verification at entry</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
