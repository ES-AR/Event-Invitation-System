import { Link } from "react-router-dom";
import { CalendarClock, Infinity, Link2, Radar, ShieldCheck, UserRoundCheck } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const sellingPoints = [
  {
    title: "Spin up unlimited events",
    body: "Launch campaigns for each experience, each with its own quota and approvals.",
    icon: Infinity,
  },
  {
    title: "Shareable invite links",
    body: "Generate unique URLs for VIPs, partner nights, or press drops in one click.",
    icon: Link2,
  },
  {
    title: "Live compliance tools",
    body: "Close, edit, or reopen any guest list while auditing check-ins in real time.",
    icon: ShieldCheck,
  },
];

const workflow = [
  {
    step: "01",
    title: "Create organizer account",
    detail: "Secure portal access lets you manage teams and brand settings.",
    icon: UserRoundCheck,
  },
  {
    step: "02",
    title: "Publish a signature event",
    detail: "Control quotas, tiers, and messaging before sharing the link anywhere.",
    icon: CalendarClock,
  },
  {
    step: "03",
    title: "Track every RSVP",
    detail: "Follow approvals, seat usage, and check-ins per event from one dashboard.",
    icon: Radar,
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16 py-10">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-8 py-12 text-white shadow-2xl lg:flex-row lg:px-14">
        <div className="flex w-full flex-col gap-6 lg:w-1/2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Event Invitation System</p>
          <h1 className="font-display text-4xl leading-tight text-white lg:text-5xl">
            Host every invite-only moment with precision-grade tooling.
          </h1>
          <p className="text-base text-white/80">
            Create multiple events, drop unique registration links into WhatsApp groups, and watch every RSVP, approval, and
            check-in update instantly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button as={Link} to="/admin/register" className="px-8">
              Create organizer account
            </Button>
            <Button as={Link} to="/admin/login" variant="secondary">
              Log in to dashboard
            </Button>
          </div>
          <div className="mt-4 grid gap-4 text-sm text-white/80 md:grid-cols-3">
            <div>
              <p className="text-lg font-semibold text-white">∞</p>
              <p className="opacity-60">Events per organizer</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">99.9%</p>
              <p className="opacity-60">Uptime across launches</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">12K+</p>
              <p className="opacity-60">Invites generated</p>
            </div>
          </div>
        </div>
        <Card className="mt-10 bg-white/95 p-6 text-slate-900 lg:mt-0 lg:w-1/2 lg:translate-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Organizer Preview</p>
          <h2 className="mt-4 font-display text-2xl">Your multi-event control room</h2>
          <p className="mt-2 text-sm text-slate-500">
            Launch "Founder Dinner", "Campus Tour", or "Press Preview" as independent flows with their own invite slug and quota.
          </p>
          <div className="mt-6 space-y-3">
            {sellingPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="rounded-2xl border border-slate-100 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-1 text-primary-600">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    <span className="text-xs font-semibold">Toolkit</span>
                  </div>
                <p className="text-sm font-semibold text-slate-900">{point.title}</p>
                <p className="text-xs text-slate-500">{point.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-800">Share-ready invite</p>
            <p className="mt-2 break-all font-mono text-slate-600">https://invite.yourbrand.com/invite/product-summit</p>
            <p className="mt-1">Copy, drop into any chat, and watch registrations roll in.</p>
          </div>
        </Card>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 md:grid-cols-2">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Why organizers switch</p>
          <h3 className="font-display text-3xl text-slate-900">Purpose-built for invite-only launches.</h3>
          <p className="text-sm text-slate-600">
            Every event gets its own analytics, approvals, quota meters, and shareable slug. Close or reopen on the fly, edit details,
            and delete outdated campaigns without affecting your flagship events.
          </p>
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-800">“We coordinate campus tours, investor dinners, and town halls in one weekend.”</p>
            <p className="text-xs text-slate-500">Adaobi Uzor · Admissions Lead</p>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-card">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="flex gap-4">
              <span className="mt-1 rounded-full bg-primary-500/10 px-3 py-1 font-mono text-xs text-primary-600">{item.step}</span>
              <div>
                  <div className="mb-1 flex items-center gap-2 text-primary-600">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600/80">Milestone</p>
                  </div>
                  <p className="text-base font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.detail}</p>
              </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
