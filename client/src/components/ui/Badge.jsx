const styles = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-600",
};

export default function Badge({ tone = "info", children }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone] || styles.info}`}>{children}</span>;
}
