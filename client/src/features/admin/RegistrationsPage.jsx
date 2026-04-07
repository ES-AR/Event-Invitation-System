import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import { CalendarRange, CheckCircle2, ChevronLeft, ChevronRight, ListChecks, Search, Trash2, Users, XCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { listEvents } from "../../services/event.service";
import {
  approveAttendee,
  bulkApprove,
  bulkReject,
  bulkDelete,
  deleteAttendee,
  exportAttendeesCsv,
  exportAttendeesPdf,
  rejectAttendee,
  fetchAttendees,
} from "../../services/registration.service";

const PAGE_SIZE = 9;
const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");
let apiOrigin = "http://localhost:5000";
try {
  apiOrigin = new URL(apiBase).origin;
} catch (err) {
  if (apiBase.endsWith("/api")) {
    apiOrigin = apiBase.slice(0, -4);
  }
}

const buildPhotoUrl = (path) => {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
};

const initialsFromName = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const statusTone = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  cancelled: "neutral",
};

export default function RegistrationsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ status: "", q: "" });
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [listError, setListError] = useState(null);
  const initialEventId = searchParams.get("eventId") || "";
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionState, setActionState] = useState({});

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);

  const load = async (overrides = {}) => {
    if (!token || !selectedEventId) return;
    setLoading(true);
    setListError(null);
    const nextPage = overrides.page ?? page;
    const params = {
      ...query,
      ...overrides,
      page: nextPage || 1,
      limit: overrides.limit || PAGE_SIZE,
      eventId: selectedEventId,
    };
    try {
      const response = await fetchAttendees(params, token);
      setData(response.attendees);
      setMeta(response.meta);
      if (response?.meta?.page) {
        setPage(response.meta.page);
      } else {
        setPage(params.page);
      }
    } catch (err) {
      console.error("Unable to load attendees", err);
      setListError(err.message || "Unable to load attendees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    setEventsLoading(true);
    listEvents(token)
      .then((response) => {
        const list = response.events || [];
        setEvents(list);
        const hasSelected = selectedEventId && list.some((event) => event.id === selectedEventId);
        if (!hasSelected && list.length) {
          const nextId = list[0].id;
          setSelectedEventId(nextId);
          setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            params.set("eventId", nextId);
            return params;
          });
        }
      })
      .finally(() => setEventsLoading(false));
  }, [selectedEventId, setSearchParams, token]);

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedEventId]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => data.some((attendee) => attendee._id === id)));
  }, [data]);

  const approve = async (id) => {
    setActionState((prev) => ({ ...prev, [id]: "approve" }));
    try {
      await approveAttendee(id, token);
      load({ page });
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const remove = async (id) => {
    setActionState((prev) => ({ ...prev, [id]: "delete" }));
    try {
      await deleteAttendee(id, token);
      load({ page });
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const reject = async (id) => {
    setActionState((prev) => ({ ...prev, [id]: "reject" }));
    try {
      await rejectAttendee(id, token);
      load({ page });
    } finally {
      setActionState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleExportCsv = async () => {
    if (!token || !selectedEventId) return;
    const csv = await exportAttendeesCsv({ eventId: selectedEventId, status: "approved" }, token);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "approved-attendees.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!token || !selectedEventId) return;
    const pdfBlob = await exportAttendeesPdf({ eventId: selectedEventId, status: "approved" }, token);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "approved-attendees.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const allSelected = data.length > 0 && data.every((attendee) => selectedIds.includes(attendee._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(data.map((attendee) => attendee._id));
  };

  const approveSelected = async () => {
    if (!token || !selectedEventId || selectedIds.length === 0) return;
    await bulkApprove({ ids: selectedIds, eventId: selectedEventId }, token);
    setSelectedIds([]);
    load({ page });
  };

  const rejectSelected = async () => {
    if (!token || !selectedEventId || selectedIds.length === 0) return;
    const confirmed = window.confirm("Reject the selected attendees?");
    if (!confirmed) return;
    await bulkReject({ ids: selectedIds, eventId: selectedEventId }, token);
    setSelectedIds([]);
    load({ page });
  };

  const deleteSelected = async () => {
    if (!token || !selectedEventId || selectedIds.length === 0) return;
    const confirmed = window.confirm("Delete the selected attendees?");
    if (!confirmed) return;
    await bulkDelete({ ids: selectedIds, eventId: selectedEventId }, token);
    setSelectedIds([]);
    load({ page });
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (eventId) {
        params.set("eventId", eventId);
      } else {
        params.delete("eventId");
      }
      return params;
    });
  };

  const noEvents = !eventsLoading && events.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-slate-900">
            <Users className="h-5 w-5 text-primary-600" strokeWidth={1.8} /> Registrations
          </h1>
          <p className="text-sm text-slate-500">
            {selectedEvent ? `Tracking ${selectedEvent.title}` : "Select an event to view registrants"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportCsv} disabled={!selectedEventId || loading}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handleExportPdf} disabled={!selectedEventId || loading}>
            Export PDF
          </Button>
        </div>
      </div>

      {noEvents ? (
        <Card className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">No events configured</p>
          <p className="mt-3 text-sm text-slate-500">Create an event first to start collecting registrations.</p>
          <div className="mt-4 flex justify-center">
            <Button as="a" href="/admin/events/builder">
              Launch an event
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Event
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="mt-2 rounded-xl border border-slate-200 px-4 py-2"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Search"
              icon={<Search className="h-4 w-4" strokeWidth={1.8} />}
              value={query.q}
              onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Name or email"
            />
            <label className="text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Status
              </span>
              <select
                value={query.status}
                onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value }))}
                className="mt-2 rounded-xl border border-slate-200 px-4 py-2"
              >
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <Button
              onClick={() => {
                setPage(1);
                load({ page: 1 });
              }}
              className="self-end"
            >
              Apply
            </Button>
          </div>
          <div className="mt-6">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
                {selectedEventId ? "Loading attendees..." : "Select an event to load attendees"}
              </div>
            ) : listError ? (
              <div className="rounded-3xl border border-danger/30 bg-danger/5 p-6 text-center text-danger">
                {listError}
              </div>
            ) : data.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500">
                No attendees match your filters yet.
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600"
                    />
                    Select all on this page
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={approveSelected} disabled={selectedIds.length === 0}>
                      Approve selected
                    </Button>
                    <Button variant="secondary" size="sm" onClick={rejectSelected} disabled={selectedIds.length === 0}>
                      Reject selected
                    </Button>
                    <Button variant="danger" size="sm" onClick={deleteSelected} disabled={selectedIds.length === 0}>
                      Delete selected
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.map((attendee) => {
                    const photoSrc = buildPhotoUrl(attendee.photoUrl);
                    const initials = initialsFromName(attendee.fullName);
                    const isSelected = selectedIds.includes(attendee._id);
                    const actionInFlight = actionState[attendee._id];
                    return (
                      <div
                        key={attendee._id}
                        className={`flex h-full flex-col gap-4 rounded-3xl border bg-white/95 p-5 shadow-[0_25px_50px_-35px_rgba(15,23,42,0.35)] ${
                          isSelected ? "border-primary-200 ring-2 ring-primary-100" : "border-slate-100"
                        }`}
                      >
                        
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(attendee._id)}
                              className="h-4 w-4 rounded border-slate-300 text-primary-600"
                            />
                          </label>                        
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                            {photoSrc ? (
                              <img src={photoSrc} alt={attendee.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                                {initials}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-base font-semibold text-slate-900">{attendee.fullName}</p>
                            <p className="text-sm text-slate-500">{attendee.email}</p>
                            <p className="text-xs text-slate-400">Registered {new Date(attendee.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge tone={statusTone[attendee.status] || "neutral"}>{attendee.status}</Badge>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                            Slot Type: {(attendee.slotType || "main").toUpperCase()} • Ticket Tier: {attendee.ticketTier || "Main"}
                          </span>
                        </div>
                        <p className="flex-1 text-sm text-slate-600">{attendee.organization || attendee.jobTitle || " "}</p> {/*for additional note for feature dev*/}
                        <div className="flex flex-wrap gap-3">
                          <button
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => approve(attendee._id)}
                            disabled={attendee.status === "approved" || Boolean(actionInFlight)}
                          >
                            <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                            {actionInFlight === "approve" ? "Approving..." : "Approve"}
                          </button>
                          {attendee.status === "rejected" ? (
                            <button
                              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-danger/40 px-3 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => remove(attendee._id)}
                              disabled={Boolean(actionInFlight)}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                              {actionInFlight === "delete" ? "Deleting..." : "Delete"}
                            </button>
                          ) : (
                            <button
                              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-300/60 px-3 py-2 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => reject(attendee._id)}
                              disabled={Boolean(actionInFlight)}
                            >
                              <XCircle className="h-4 w-4" strokeWidth={1.8} />
                              {actionInFlight === "reject" ? "Rejecting..." : "Reject"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(meta?.pages || 1) > 1 && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
                      onClick={() => page > 1 && load({ page: page - 1 })}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.8} /> Prev
                    </button>
                    <p className="text-sm text-slate-500">
                      Page {page} of {meta.pages || 1} · Showing up to {PAGE_SIZE} attendees per view
                    </p>
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
                      onClick={() => page < (meta.pages || 1) && load({ page: page + 1 })}
                      disabled={page >= (meta.pages || 1)}
                    >
                      Next <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
