export default function Card({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component className={`rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-soft ${className}`} {...props}>
      {children}
    </Component>
  );
}
