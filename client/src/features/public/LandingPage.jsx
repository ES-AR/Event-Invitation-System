import { Link } from "react-router-dom";
import {
  Aperture,
  ArrowRight,
  CalendarClock,
  Compass,
  Globe2,
  HeartHandshake,
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
  { label: "Events built", value: "12,480" },
  { label: "Hosts worldwide", value: "83 countries" },
  { label: "Guests checked in", value: "1.4M+" },
];

const featureCards = [
  {
    title: "Visual event builder",
    copy: "Design branded invites, registration flows, and ticket tiers without touching code.",
    icon: Palette,
  },
  {
    title: "Smart guest controls",
    copy: "Cap RSVP counts, auto-move to overflow, and pause invites with a single tap.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time signals",
    copy: "Watch approvals, check-ins, and attendance health update like a live scoreboard.",
    icon: Sparkles,
  },
  {
    title: "Global-ready links",
    copy: "Share short invite URLs across WhatsApp, Instagram, or email with localized time zones.",
    icon: Globe2,
  },
];

const timeline = [
  {
    title: "Claim your host space",
    detail: "Create a personal organizer profile in under a minute—no access codes needed.",
    icon: UserRoundCheck,
  },
  {
    title: "Launch a signature invite",
    detail: "Stack agendas, galleries, and FAQs into a modern landing page your guests trust.",
    icon: CalendarClock,
  },
  {
    title: "Share + track",
    detail: "Drop the unique link anywhere. Live quota meters and alerts keep you in control.",
    icon: Megaphone,
  },
  {
    title: "Welcome guests in style",
    detail: "Self-serve check-ins with photo verification keep entrances smooth and secure.",
    icon: Compass,
  },
];

const testimonials = [
  {
    quote: "I hosted a rooftop listening party and moved 200 RSVP approvals in two hours.",
    name: "Maya Anozie",
    role: "Creative director, Lagos",
  },
  {
    quote: "Campus tours, tech meetups, even my wedding shower—the same dashboard handled all three.",
    name: "Diego Fernandez",
    role: "Community builder, Buenos Aires",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16 pt-10">
      <section className="relative mx-auto grid w-full max-w-6xl gap-8 overflow-hidden rounded-[36px] border border-slate-900/20 bg-[#020617] px-8 py-14 text-white shadow-[0_40px_120px_-60px_rgba(15,23,42,0.9)] lg:grid-cols-[1.1fr_0.9fr] lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),rgba(2,6,23,0))]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.45em] text-white/60">
            <Aperture className="h-4 w-4" strokeWidth={1.6} /> Event Invitation System
          </span>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
            Launch modern invite sites for every gathering—studio openings, weddings, hackathons, you name it.
          </h1>
          <p className="text-base text-white/80">
            EventQuota gives solo hosts and teams the same tooling: branded RSVP pages, quota automation, and instant check-in links
            that feel premium on any device.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button as={Link} to="/admin/register" className="gap-2 px-8">
              Create free organizer
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button as={Link} to="/admin/login" variant="secondary" className="bg-white/10 text-white">
              Log in to dashboard
            </Button>
          </div>
          <div className="mt-6 grid gap-6 text-sm text-white/80 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <Card className="relative flex flex-col gap-5 bg-white/95 p-8 text-slate-900">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
            <Layers3 className="h-4 w-4" /> Live host preview
          </div>
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Tonight</p>
            <p className="mt-3 text-2xl font-semibold">Rooftop Listening Session</p>
            <p className="text-sm text-white/70">Brooklyn · Slots left: 18</p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1">Auto approvals on</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Photo check-in enforced</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Share link copied</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Toolkit highlights</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Overflow routing happens automatically.
              </li>
              <li className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Send magic links to VIPs in one tap.
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary-600" strokeWidth={1.8} /> Export guest lists to CSV or PDF anytime.
              </li>
            </ul>
          </div>
        </Card>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-2">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="relative overflow-hidden border border-slate-100/60 bg-white/95 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-primary-50 opacity-70" aria-hidden="true" />
              <div className="relative flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-600/10 px-3 py-1 text-xs font-semibold text-primary-700">
                  <Icon className="h-4 w-4" strokeWidth={1.8} /> Feature
                </span>
                <p className="text-lg font-semibold text-slate-900">{feature.title}</p>
                <p className="text-sm text-slate-600">{feature.copy}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">How it works</p>
          <h2 className="font-display text-3xl text-slate-900">From idea to doors-open in four beats.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {timeline.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600/10 font-semibold text-primary-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon className="h-5 w-5 text-primary-600" strokeWidth={1.8} />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-slate-100 bg-gradient-to-br from-primary-600 via-primary-500 to-rose-500 p-8 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Bring your people closer</p>
          <h3 className="mt-3 font-display text-3xl">Effortless invites for creators, couples, teams, and collectives.</h3>
          <p className="mt-3 text-sm text-white/80">
            EventQuota adapts to casual picnics, black-tie fundraisers, and anything in-between. Unlimited events, zero design debt.
          </p>
          <Button as={Link} to="/invite/main-event" variant="secondary" className="mt-8 bg-white text-slate-900">
            Preview a public invite
          </Button>
        </Card>
        <Card className="space-y-4 border border-slate-100 bg-white/95 p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-400">
            <HeartHandshake className="h-4 w-4" /> Host stories
          </div>
          <div className="space-y-6">
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
