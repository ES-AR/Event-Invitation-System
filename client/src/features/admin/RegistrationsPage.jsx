import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { approveAttendee, deleteAttendee, fetchAttendees } from "../../services/registration.service";
import { formatNumber } from "../../utils/formatters";

const statusTone = {
  approved: "success",
  pending: "warning",
  "checked-in": "info",
  rejected: "danger",
};

export default function RegistrationsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState({ status: "", q: "" });
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const load = async (overrides = {}) => {
    if (!token) return;
    setLoading(true);
    const params = { ...query, ...overrides };
    try {
      const response = await fetchAttendees(params, token);
      setData(response.attendees);
      setMeta(response.meta);
    } catch (err) {
      console.error("Unable to load attendees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleSelection = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approve = async (id) => {
    await approveAttendee(id, token);
    load();
  };

  const remove = async (id) => {
    await deleteAttendee(id, token);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Registrations</h1>
          <p className="text-sm text-slate-500">Showing {formatNumber(meta.total)} attendees</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Export CSV</Button>
          <Button>Add registrant</Button>
        </div>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            label="Search"
            value={query.q}
            onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Name or email"
          />
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={query.status}
              onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-2 rounded-xl border border-slate-200 px-4 py-2"
            >
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="checked-in">Checked-in</option>
            </select>
          </label>
          <Button onClick={() => load()} className="self-end">Apply</Button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3">
                  <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(data.map((d) => d._id)) : new Set())} />
                </th>
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Registered</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Loading attendees...
                  </td>
                </tr>
              ) : (
                data.map((attendee) => (
                  <tr key={attendee._id} className="border-t border-slate-100">
                    <td className="py-4">
                      <input type="checkbox" checked={selected.has(attendee._id)} onChange={() => toggleSelection(attendee._id)} />
                    </td>
                    <td className="py-4 font-semibold text-slate-800">{attendee.fullName}</td>
                    <td className="py-4 text-slate-500">{attendee.email}</td>
                    <td className="py-4 text-slate-500">{new Date(attendee.createdAt).toLocaleString()}</td>
                    <td className="py-4">
                      <Badge tone={statusTone[attendee.status] || "neutral"}>{attendee.status}</Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-3">
                        <button className="text-primary-600" onClick={() => approve(attendee._id)}>
                          Approve
                        </button>
                        <button className="text-danger" onClick={() => remove(attendee._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
