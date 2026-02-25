import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  Compass,
  Globe2,
  Layers3,
  Megaphone,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const heroStats = [
  { label: "Active invites", value: "3.2K" },
  { label: "Avg. approval time", value: "4 min" },
  { label: "Cities hosted", value: "128" },
];

const featureCards = [
  {
    title: "Modern invite studio",
    copy: "Build cinematic invite pages with gradients, media blocks, and RSVP flows in minutes.",
    icon: Palette,
  },
  {
    title: "Quota intelligence",
    copy: "Auto-route overflow, pause registration instantly, and keep capacity on autopilot.",
    icon: ShieldCheck,
  },
  {
    title: "Live engagement",
    copy: "Watch confirmations and attendance shift in real time with smart alerts.",
    icon: Sparkles,
  },
  {
    title: "Share-ready links",
    copy: "Short links, time-zone aware schedules, and personalized badges built in.",
    icon: Globe2,
  },
  {
    title: "Instant check-in",
    copy: "Scan arrivals, verify guests, and keep the entry line moving.",
    icon: Compass,
  },
  {
    title: "Story-first analytics",
    copy: "Export guest lists, approval history, and post-event summaries fast.",
    icon: Star,
  },
];

const workflow = [
  {
    title: "Create your host profile",
    detail: "Spin up an organizer account and reserve your branded invite URL.",
    icon: UserRoundCheck,
  },
  {
    title: "Design the experience",
    detail: "Add schedules, speakers, and ticket tiers in a visual builder.",
    icon: CalendarClock,
  },
  {
    title: "Invite + track",
    detail: "Share everywhere and monitor quota health across main and overflow lists.",
    icon: Megaphone,
  },
  {
    title: "Welcome with confidence",
    detail: "Check in guests with photo confirmation and automated arrival messages.",
    icon: Compass,
  },
];

const testimonials = [
  {
    quote: "We ran a community summit and approvals hit 90% before the first announcement ended.",
    name: "Maya Anozie",
    role: "Creative director, Lagos",
  },
  {
    quote: "Finally a tool that makes invite links look premium without a designer on staff.",
    name: "Diego Fernandez",
    role: "Community builder, Buenos Aires",
  },
  {
    quote: "Our pop-up gallery check-in was effortless. It felt like a concierge desk.",
    name: "Chloe Park",
    role: "Gallery manager, Seoul",
  },
];

const highlights = [
  "Unlimited event templates",
  "Auto-approval rules",
  "Overflow waitlist routing",
  "Guest badge exports",
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-20 pt-12">
      <section className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-[#0b1220] px-8 py-14 text-white shadow-[0_50px_140px_-70px_rgba(15,23,42,0.95)] lg:px-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-6 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,_rgba(45,212,191,0.65),rgba(11,18,32,0))] blur-2xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.45),rgba(11,18,32,0))] blur-3xl" />
        </div>
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
              Event Invitation System
            </span>
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
              Build invite pages that feel like a brand moment.
            </h1>
            <p className="text-base text-white/80">
              EventQuota combines a high-end RSVP experience with quota automation, so every gathering looks curated and runs
              flawlessly.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button as={Link} to="/admin/register" className="gap-2 px-8">
                Start free organizer
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/admin/login" variant="secondary" className="bg-white/10 text-white">
                Log in
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/70">
              {highlights.map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <Card className="relative overflow-hidden border border-white/10 bg-white/10 p-6 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                  <span>Live preview</span>
                  <Layers3 className="h-4 w-4" />
                </div>
                <div className="mt-6 rounded-3xl border border-white/10 bg-[#10192b] p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Tonight</p>
                  <p className="mt-3 text-2xl font-semibold">Night Market Sessions</p>
                  <p className="text-sm text-white/70">Chicago · 18 slots remaining</p>
                  <div className="mt-5 grid gap-3 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" strokeWidth={1.8} /> Auto-approval enabled
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-200" strokeWidth={1.8} /> VIP badges ready
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="border border-slate-100 bg-white/95 p-6 text-slate-900">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Host advantage</p>
              <p className="mt-3 text-xl font-semibold">One dashboard for every event type.</p>
              <p className="mt-2 text-sm text-slate-600">
                Launch pop-ups, ceremonies, meetups, and fundraisers with the same premium experience.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-6 px-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Capabilities</p>
          <h2 className="font-display text-3xl text-slate-900">A modern toolkit for premium invites.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden border border-slate-100 bg-white/95 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),transparent_60%)]" />
                <div className="relative flex flex-col gap-3">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    <Icon className="h-4 w-4" strokeWidth={1.8} /> Feature
                  </span>
                  <p className="text-lg font-semibold text-slate-900">{feature.title}</p>
                  <p className="text-sm text-slate-600">{feature.copy}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Workflow</p>
          <h2 className="font-display text-3xl text-slate-900">Four steps to a flawless guest list.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {workflow.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fef3c7] font-semibold text-[#b45309]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon className="h-5 w-5 text-slate-800" strokeWidth={1.8} />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-slate-100 bg-gradient-to-br from-[#0f172a] via-[#0b3b5a] to-[#072f2d] p-8 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Launch faster</p>
          <h3 className="mt-3 font-display text-3xl">Every invite feels curated and intentional.</h3>
          <p className="mt-3 text-sm text-white/80">
            Give guests a page that feels like a premium experience while keeping your approvals, limits, and check-ins effortless.
          </p>
          <Button as={Link} to="/invite/main-event" variant="secondary" className="mt-8 bg-white text-slate-900">
            Preview a public invite
          </Button>
        </Card>
        <Card className="space-y-5 border border-slate-100 bg-white/95 p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-400">
            <span>Host stories</span>
          </div>
          <div className="space-y-4">
            {testimonials.map((story) => (
              <div key={story.name} className="rounded-2xl border border-slate-100 bg-white/80 p-5">
                <p className="text-sm text-slate-700">“{story.quote}”</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {story.name} · {story.role}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
