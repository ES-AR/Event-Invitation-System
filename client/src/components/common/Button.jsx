// client/src/components/common/Button.jsx
import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  loading,
  className = "",
}) {
  const variants = {
    primary: "bg-black text-white hover:bg-gray-900",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-400 text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-md font-medium transition-all text-sm 
      ${variants[variant]} 
      ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
