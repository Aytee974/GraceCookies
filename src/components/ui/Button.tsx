import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-white hover:bg-gold-dark active:bg-gold-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  secondary:
    "border border-violet text-violet bg-transparent hover:bg-violet hover:text-white active:bg-violet-dark active:border-violet-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
  ghost:
    "bg-transparent text-violet hover:bg-lavender active:bg-lavender-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-base rounded-lg",
  lg: "px-6 py-3 text-lg rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
