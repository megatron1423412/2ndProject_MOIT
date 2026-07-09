import React from "react";

interface IconButtonProps {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export default function IconButton({ label, children, active = false, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-all hover:border-accent/40 hover:bg-hover-background active:scale-[0.98] ${
        active ? "border-accent/35 bg-accent/15 text-accent" : "border-border bg-card text-primary"
      }`}
    >
      {children}
    </button>
  );
}
