import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { api } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function Pill({ children, tone = 'info' }) {
  const colors = {
    info: 'bg-gray-100 text-secondary',
    success: 'bg-green-100 text-green-900',
    danger: 'bg-danger text-secondary'
  };
  return <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', colors[tone])}>{children}</span>;
}

export default function AdminPage() {
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({});
  const [registrations, setRegistrations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredRegistrations = useMemo(() => {
    if (filter === 'all') return registrations;
    return registrations.filter((r) => r.status === filter);
  }, [registrations, filter]);

  const loadData = async () => {
    const ev = await api.get('/event');
    setEvent(ev.data.event);
    setStats(ev.data.stats);
    const reg = await api.get('/registrations');
    setRegistrations(reg.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateEvent = async (updates) => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.post('/event', updates);
      setEvent(res.data);
      setMessage('Event settings saved.');
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save event.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const performBulk = async (action) => {
    if (!selected.length) return;
    setSaving(true);
    setMessage('');
    try {
      await api.post('/registrations/bulk', { ids: selected, action });
      setSelected([]);
      await loadData();
      setMessage(`Bulk ${action} completed.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Bulk action failed.');
    } finally {
      setSaving(false);
    }
  };

  const approveSingle = async (id) => {
    await api.post(`/registrations/${id}/approve`);
    await loadData();
  };

  const copyCheckIn = async (id) => {
    const res = await api.get(`/registrations/${id}/checkin-link`);
    const link = res.data.link;
    if (navigator.clipboard && link) {
      await navigator.clipboard.writeText(link);
      setMessage('Check-in link copied to clipboard.');
    } else {
      setMessage(link);
    }
  };

  const removeSingle = async (id) => {
    await api.delete(`/registrations/${id}`);
    await loadData();
  };

  const exportCsv = (status = 'approved') => {
    window.open(`${API_BASE}/export?status=${status}`, '_blank');
  };

  const toggleClosed = () => updateEvent({ isClosed: !event?.isClosed });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
            <h2 className="text-xl font-semibold text-secondary">Quota & Overflow Control</h2>
            <p className="text-gray-600">Approve guests, lock registration, export guest list, and send check-in links.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleClosed} className="btn btn-ghost">
              {event?.isClosed ? 'Open Registration' : 'Close Registration'}
            </button>
            <button onClick={() => exportCsv('approved')} className="btn btn-primary">
              Export Approved CSV
            </button>
          </div>
        </div>
        {message && <div className="mt-3 bg-muted border border-gray-200 rounded-lg p-3 text-secondary">{message}</div>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Main Slots</p>
              <p className="text-2xl font-semibold text-secondary">
                {stats.mainCount || 0}/{event?.maxMainSlots || 0}
              </p>
            </div>
            <button
              onClick={() => updateEvent({ maxMainSlots: (event?.maxMainSlots || 0) + 10 })}
              className="btn btn-ghost"
              disabled={saving}
            >
              +10
            </button>
          </div>
          <p className="text-sm text-gray-500">Adjust capacity on the fly.</p>
        </div>
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overflow Slots</p>
              <p className="text-2xl font-semibold text-secondary">
                {stats.overflowCount || 0}/{event?.overflowSlots || 0}
              </p>
            </div>
            <button
              onClick={() => updateEvent({ overflowSlots: (event?.overflowSlots || 0) + 5 })}
              className="btn btn-ghost"
              disabled={saving}
            >
              +5
            </button>
          </div>
          <p className="text-sm text-gray-500">Overflow control with approvals.</p>
        </div>
        <div className="card space-y-3">
          <p className="text-sm text-gray-500">Registration closes at</p>
          <input
            type="datetime-local"
            className="rounded-lg border border-gray-200 px-3 py-2 w-full"
            value={event?.registrationClosesAt ? new Date(event.registrationClosesAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateEvent({ registrationClosesAt: e.target.value })}
            disabled={saving}
          />
          <p className="text-sm text-gray-500">Automatically stop new sign-ups after this time.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={selected.length === filteredRegistrations.length && selected.length > 0}
              onChange={(e) =>
                e.target.checked
                  ? setSelected(filteredRegistrations.map((r) => r._id))
                  : setSelected([])
              }
            />
            <p className="font-semibold text-secondary">Select attendees</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked-in">Checked-In</option>
            </select>
            <button className="btn btn-primary" onClick={() => performBulk('approve')} disabled={!selected.length || saving}>
              Approve Selected
            </button>
            <button className="btn btn-danger" onClick={() => performBulk('remove')} disabled={!selected.length || saving}>
              Remove Selected
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-muted text-left text-sm text-gray-600">
                <th className="p-3"></th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 text-sm">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.includes(r._id)} onChange={() => toggleSelect(r._id)} />
                  </td>
                  <td className="p-3 font-semibold text-secondary">{r.name}</td>
                  <td className="p-3 text-gray-700">{r.email}</td>
                  <td className="p-3">{r.category === 'main' ? <Pill>Main</Pill> : <Pill>Overflow</Pill>}</td>
                  <td className="p-3">
                    {r.status === 'pending' && <Pill>Pending</Pill>}
                    {r.status === 'approved' && <Pill tone="success">Approved</Pill>}
                    {r.status === 'checked-in' && <Pill tone="success">Checked-In</Pill>}
                    {r.status === 'removed' && <Pill tone="danger">Removed</Pill>}
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    <button className="btn btn-ghost" onClick={() => approveSingle(r._id)} disabled={saving}>
                      Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => removeSingle(r._id)} disabled={saving}>
                      Delete
                    </button>
                    <button className="btn btn-ghost" onClick={() => copyCheckIn(r._id)} disabled={saving}>
                      Copy Check-in Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
