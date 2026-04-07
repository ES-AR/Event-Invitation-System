import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Search,
  ShieldCheck,
  Undo2,
  Users,
} from "lucide-react";
import Input from "../../components/ui/Input";
import {
  startCheckInSession,
  searchCheckInAttendees,
  markCheckIn,
  undoCheckIn,
} from "../../services/checkin.service";

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
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatTime = (value) => {
  if (!value) return null;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const statusMeta = (attendee, allowWalkIns) => {
  if (!attendee) {
    return {
      label: "Waiting for a selection",
      accent: "bg-white/10 text-white/70 border-white/20",
      subtext: "Use the search panel to pull up a guest",
    };
  }

  if (attendee.isCheckedIn) {
    return {
      label: "Already checked in",
      accent: "bg-rose-100 text-rose-800 border-rose-200",
      subtext: formatTime(attendee.checkedInAt) ? `Marked at ${formatTime(attendee.checkedInAt)}` : "Entry recorded earlier",
    };
  }

  if (["rejected", "cancelled"].includes(attendee.status)) {
    return {
      label: "Flagged / Hold",
      accent: "bg-amber-100 text-amber-900 border-amber-200",
      subtext: "Escalate to lead before admitting",
    };
  }

  if (attendee.status === "approved" || allowWalkIns) {
    return {
      label: "Ready for check-in",
      accent: "bg-emerald-100 text-emerald-900 border-emerald-200",
      subtext:
        attendee.status === "approved"
          ? "Quota reserved · verify photo before toggling"
          : "Walk-in enabled — confirm ID before marking present",
    };
  }

  return {
    label: "Pending organizer approval",
    accent: "bg-sky-100 text-sky-900 border-sky-200",
    subtext: "Hold until approval or override from command"
  };
};

const quotaLine = (attendee) => {
  if (!attendee) return "Select a guest to view their quota";
  const used = attendee.isCheckedIn ? 1 : 0;
  const label = attendee.slotType === "overflow" ? "Overflow waitlist" : "Admit One";
  return `${label} · ${used}/1 used`;
};

const listStatusMeta = (attendee) => {
  if (!attendee) {
    return { label: "Awaiting", dot: "bg-slate-500", text: "text-slate-500" };
  }
  if (attendee.isCheckedIn) {
    return { label: "Checked in", dot: "bg-emerald-400", text: "text-emerald-300" };
  }
  if (["rejected", "cancelled"].includes(attendee.status)) {
    return { label: "Blocked", dot: "bg-rose-500", text: "text-rose-300" };
  }
  if (attendee.status === "pending" && !attendee.isApproved) {
    return { label: "Pending", dot: "bg-amber-400", text: "text-amber-200" };
  }
  return { label: "Ready", dot: "bg-cyan-400", text: "text-cyan-200" };
};

export default function CheckInPage() {
  const { slug = "" } = useParams();
  const storageKey = slug ? `checkin_token_${slug}` : null;
  const [session, setSession] = useState(null);
  const [activeToken, setActiveToken] = useState(() => {
    if (!storageKey || typeof window === "undefined") return "";
    return window.localStorage.getItem(storageKey) || "";
  });
  const [tokenInput, setTokenInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeAttendee, setActiveAttendee] = useState(null);
  const [actionState, setActionState] = useState({ type: null, loading: false, error: "" });
  const [recentScans, setRecentScans] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistToken = useCallback(
    (value) => {
      if (!storageKey || typeof window === "undefined") return;
      if (value) {
        window.localStorage.setItem(storageKey, value);
      } else {
        window.localStorage.removeItem(storageKey);
      }
    },
    [storageKey]
  );

  const runSession = useCallback(
    async (tokenValue, { silent = false } = {}) => {
      const trimmed = tokenValue.trim();
      if (!trimmed) {
        if (!silent) {
          setAuthError("Enter the token shared by the organizer");
        }
        return;
      }

      if (!silent) {
        setAuthLoading(true);
        setAuthError("");
      }

      try {
        const data = await startCheckInSession(slug, trimmed);
        if (!mountedRef.current) return;
        setSession(data);
        setActiveToken(trimmed);
        persistToken(trimmed);
        if (!silent) {
          setTokenInput("");
        }
        setAuthError("");
      } catch (err) {
        if (!mountedRef.current) return;
        if (silent) {
          persistToken("");
          setActiveToken("");
        } else {
          setAuthError(err.message || "Unable to verify token");
        }
        setSession(null);
      } finally {
        if (!silent && mountedRef.current) {
          setAuthLoading(false);
        }
      }
    },
    [persistToken, slug]
  );

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      runSession(stored, { silent: true });
    }
  }, [runSession, storageKey]);

  useEffect(() => {
    if (!session || !activeToken) {
      setSearchResults([]);
      return;
    }
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);
    setSearchError("");
    searchCheckInAttendees(slug, searchTerm.trim(), activeToken, controller.signal)
      .then((response) => {
        if (!mountedRef.current) return;
        setSearchResults(response.attendees || []);
      })
      .catch((err) => {
        if (err.name === "AbortError" || !mountedRef.current) return;
        setSearchError(err.message || "Unable to search attendees");
      })
      .finally(() => {
        if (mountedRef.current) {
          setSearchLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeToken, searchTerm, session, slug]);

  const handleTokenSubmit = (event) => {
    event.preventDefault();
    runSession(tokenInput, { silent: false });
  };

  const handleResetToken = () => {
    persistToken("");
    setActiveToken("");
    setSession(null);
    setActiveAttendee(null);
    setSearchResults([]);
    setSearchTerm("");
    setAuthError("");
  };

  const handleSelectAttendee = (attendee) => {
    setActiveAttendee(attendee);
    setSearchTerm(attendee.fullName);
    setSearchResults([]);
    setRecentScans((prev) => {
      const filtered = prev.filter((entry) => entry.id !== attendee.id);
      return [{ ...attendee }, ...filtered].slice(0, 6);
    });
  };

  const updateAttendeeState = (next) => {
    setActiveAttendee(next);
    setSearchResults((prev) => prev.map((entry) => (entry.id === next.id ? next : entry)));
    setRecentScans((prev) => prev.map((entry) => (entry.id === next.id ? { ...entry, ...next } : entry)));
  };

  const triggerCheckIn = async () => {
    if (!activeAttendee || !activeToken) return;
    setActionState({ type: "checkin", loading: true, error: "" });
    try {
      const response = await markCheckIn(slug, activeAttendee.id, activeToken);
      updateAttendeeState(response.attendee);
    } catch (err) {
      setActionState({ type: "checkin", loading: false, error: err.message || "Unable to check in" });
      return;
    }
    setActionState({ type: null, loading: false, error: "" });
  };

  const triggerUndo = async () => {
    if (!activeAttendee || !activeToken) return;
    setActionState({ type: "undo", loading: true, error: "" });
    try {
      const response = await undoCheckIn(slug, activeAttendee.id, activeToken);
      updateAttendeeState(response.attendee);
    } catch (err) {
      setActionState({ type: "undo", loading: false, error: err.message || "Unable to undo" });
      return;
    }
    setActionState({ type: null, loading: false, error: "" });
  };

  const canCheckIn = Boolean(
    activeAttendee &&
      !activeAttendee.isCheckedIn &&
      (activeAttendee.status === "approved" || session?.event?.allowWalkIns)
  );
  const canUndo = Boolean(activeAttendee?.isCheckedIn);
  const banner = useMemo(() => statusMeta(activeAttendee, session?.event?.allowWalkIns), [activeAttendee, session]);
  const quotaSummary = useMemo(() => quotaLine(activeAttendee), [activeAttendee]);
  const hasSearchTerm = Boolean(searchTerm.trim());
  const visibleList = hasSearchTerm && searchResults.length > 0 ? searchResults : recentScans;
  const listCaption = hasSearchTerm && searchResults.length > 0 ? "Matches" : "Recent scans";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050714] text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary-500/10 blur-[160px]" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-[200px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          {/* <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} /> Back to Admin
          </Link> */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.55em] text-primary-200">Gate Check-In</p>
            <h1 className="mt-2 font-display text-3xl text-white">{session?.event?.title || "Secure Entry"}</h1>
            {/* <p className="text-xs text-slate-400">Manual verification · link {slug}</p> */}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> System online
            </span>
            {session && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <Users className="h-4 w-4 text-primary-300" strokeWidth={1.6} />
                {session.stats?.checkedIn || 0} / {session.stats?.approved || 0} checked
              </span>
            )}
            {session && (
              <button
                type="button"
                onClick={handleResetToken}
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/50"
              >
                Switch code
              </button>
            )}
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          <aside className="flex min-h-[560px] flex-col rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Fingerprint className="h-4 w-4" strokeWidth={1.5} />
                <span>Search name, ID, or email</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!session}
                  placeholder={session ? "Sarah Jenkins · #MSG-204 · 0803" : "Enter access code first"}
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex-1 overflow-hidden">
              <p className="text-xs uppercase tracking-[0.45em] text-slate-500">{listCaption}</p>
              <div className="mt-3 h-full overflow-y-auto pr-1">
                {session ? (
                  visibleList.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {visibleList.map((entry) => {
                        const photo = buildPhotoUrl(entry.photoUrl);
                        const status = listStatusMeta(entry);
                        const isActive = activeAttendee?.id === entry.id;
                        return (
                          <button
                            type="button"
                            key={entry.id}
                            onClick={() => handleSelectAttendee(entry)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                              isActive ? "border-primary-400 bg-primary-500/15" : "border-white/5 bg-white/0 hover:border-white/20"
                            }`}
                          >
                            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-slate-800">
                              {photo ? (
                                <img src={photo} alt={entry.fullName} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-300">
                                  {initialsFromName(entry.fullName)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-1 flex-col">
                              <span className="font-semibold text-white">{entry.fullName}</span>
                              <span className="text-xs text-slate-400">{entry.ticketCode || "—"} · {entry.email}</span>
                            </div>
                            <div className={`flex items-center gap-2 text-xs font-semibold ${status.text}`}>
                              <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-3xl border border-white/5 bg-white/0 text-sm text-slate-500">
                      {hasSearchTerm ? "No matches yet" : "Scans will appear here"}
                    </div>
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 p-6 text-center text-sm text-slate-400">
                    <ShieldCheck className="mb-3 h-10 w-10 text-slate-500" strokeWidth={1.4} />
                    Unlock the Page with your access code.
                  </div>
                )}
              </div>
            </div>

            {session && (
              <div className="mt-6 grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-black/30 p-4 text-center text-xs uppercase tracking-[0.35em] text-slate-400">
                {[{
                  label: "Approved",
                  value: session.stats?.approved || 0,
                }, {
                  label: "Checked",
                  value: session.stats?.checkedIn || 0,
                }, {
                  label: "Pending",
                  value: session.stats?.pending || 0,
                }].map((item) => (
                  <div key={item.label}>
                    <p>{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-normal text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main className="rounded-[40px] border border-white/10 bg-gradient-to-br from-[#0B1025] to-[#0A1331] p-8 text-center shadow-[0_40px_120px_rgba(2,6,23,0.65)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-slate-200">
              Status · {banner.label}
            </span>
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-primary-400/40 bg-slate-900 shadow-[0_20px_60px_rgba(14,165,233,0.25)]">
                {activeAttendee ? (
                  (() => {
                    const photo = buildPhotoUrl(activeAttendee.photoUrl);
                    if (photo) {
                      return <img src={photo} alt={activeAttendee.fullName} className="h-full w-full object-cover" />;
                    }
                    return (
                      <div className="flex h-full items-center justify-center text-5xl font-semibold text-slate-500">
                        {initialsFromName(activeAttendee.fullName)}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-500">
                    <ShieldCheck className="mb-3 h-10 w-10" strokeWidth={1.5} />
                    Awaiting guest
                  </div>
                )}
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                  {activeAttendee?.slotType ? activeAttendee.slotType.toUpperCase() : "ALL ACCESS"}
                </span>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">{activeAttendee?.fullName || "Select an attendee"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.6em] text-primary-100">
                  {activeAttendee?.ticketCode || "Ticket will display here"}
                </p>
                <p className="mt-3 text-sm text-slate-400">{banner.subtext}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 text-left text-sm md:grid-cols-2">
              {[{
                label: "Email",
                value: activeAttendee?.email || "—",
              }, {
                label: "Phone",
                value: activeAttendee?.phone || "—",
              }
              // , {
              //   label: "Organization",
              //   value: activeAttendee?.organization || "Not provided",
              // }, 
              // {
              //   label: "Quota",
              //   value: quotaSummary,
              // }
            ].map((field) => (
                <div key={field.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{field.label}</p>
                  <p className="mt-2 text-base text-white">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-sm shadow-2xl shadow-indigo-900/40">
              {/* <p className="text-xs uppercase tracking-[0.4em] text-white/70">Action center</p> */}
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={triggerCheckIn}
                  disabled={!canCheckIn || actionState.loading}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-semibold text-white shadow-lg transition ${
                    canCheckIn && !actionState.loading ? "bg-white/10 hover:bg-white/20" : "bg-white/5 text-white/60"
                  }`}
                >
                  {actionState.loading && actionState.type === "checkin" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.6} />
                  )}
                  Check-in attendee
                </button>
                <button
                  type="button"
                  onClick={triggerUndo}
                  disabled={!canUndo || actionState.loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-transparent px-4 py-3 font-semibold text-white transition hover:border-white/60 disabled:opacity-50"
                >
                  {actionState.loading && actionState.type === "undo" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Undo2 className="h-5 w-5" strokeWidth={1.6} />
                  )}
                  Undo check-in
                </button>
                {actionState.error && (
                  <p className="mt-1 flex items-center gap-2 text-xs text-white/80">
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.8} /> {actionState.error}
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm shadow-2xl shadow-black/30">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Check-in details</p>
            <div className="mt-4 space-y-3 text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Organization</span>
                <span>{activeAttendee?.organization || "QEIAS"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Guest quota</span>
                <span>{activeAttendee ? (activeAttendee.isCheckedIn ? "1 / 1 used" : "0 / 1 used") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registration</span>
                <span>
                  {activeAttendee?.createdAt
                    ? new Date(activeAttendee.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">
            <p className="text-xs uppercase tracking-[0.4em]">Special instructions</p>
            <p className="mt-3 text-amber-50">
              {activeAttendee?.note || session?.event?.checkInInstructions || "Verify photo before admitting."}
            </p>
          </div>
        </section>
      </div>

      {!session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center text-slate-200 shadow-[0_40px_120px_rgba(2,6,23,0.9)]">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary-300" strokeWidth={1.4} />
            <h2 className="mt-4 font-display text-2xl text-white">Enter Access Code</h2>
            <p className="mt-2 text-sm text-slate-400">Only authorized gate staff can unlock this Page.</p>
            <form onSubmit={handleTokenSubmit} className="mt-6 space-y-4 text-left">
              <Input
                label="Access token"
                placeholder="e.g. ZETA-4821"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
                icon={<Fingerprint className="h-4 w-4 text-slate-400" strokeWidth={1.6} />}
              />
              {authError && <p className="text-sm text-rose-300">{authError}</p>}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-primary-500/90 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-400"
                disabled={authLoading}
              >
                {authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Unlock Page"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
