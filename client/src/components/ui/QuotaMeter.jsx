import { asPercentage } from "../../utils/formatters";

export default function QuotaMeter({ label, used = 0, capacity = 0, accent = "from-primary-500 to-primary-400" }) {
  const pct = capacity ? Math.min((used / capacity) * 100, 100) : 0;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        <span className="font-semibold text-slate-900">
          {used}/{capacity}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{asPercentage(used, capacity)} full</p>
    </div>
  );
}
