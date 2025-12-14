// client/src/components/common/Input.jsx
import React from "react";

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  name,
  placeholder,
  required,
  error,
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 
        ${error ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-black"}`}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
