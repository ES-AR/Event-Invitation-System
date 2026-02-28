const base = "inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants = {
  primary: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-soft hover:from-primary-600 hover:to-primary-700",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:border-slate-400",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  ghost: "text-slate-600 hover:text-slate-900",
  danger: "bg-danger text-white shadow-soft hover:bg-danger/90",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-6 py-4 text-base",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const disabledStyles = props.disabled ? "opacity-60 pointer-events-none" : "";
  const classes = [base, variants[variant], sizes[size], disabledStyles, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
