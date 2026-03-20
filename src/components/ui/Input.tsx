import { InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white transition-colors duration-150
          ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-blush-dark focus:border-blush focus:ring-2 focus:ring-blush/50"
          }
          focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
