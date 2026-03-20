import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 border border-lavender ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
