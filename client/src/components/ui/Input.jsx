export default function Input({
  label,
  hint,
  error,
  icon,
  rightSlot,
  className = "",
  inputClass = "",
  ...props
}) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <div className={`flex items-center rounded-2xl border px-4 transition ${
        error ? "border-danger bg-danger/5" : "border-slate-200 bg-white focus-within:border-primary-400"
      }`}>
        {icon && <span className="mr-2 flex items-center text-slate-400">{icon}</span>}
        <input className={`w-full border-none bg-transparent py-3 text-base text-slate-900 outline-none ${inputClass}`} {...props} />
        {rightSlot && <span className="ml-2 flex items-center text-slate-400">{rightSlot}</span>}
      </div>
      {hint && !error && <p className="text-xs font-normal text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </label>
  );
}
