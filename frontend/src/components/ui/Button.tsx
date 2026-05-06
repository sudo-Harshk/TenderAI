import { Link, type LinkProps } from "react-router-dom";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-btn hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0",
  secondary:
    "bg-white text-[#202124] border border-border hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-card active:translate-y-0",
  ghost: "text-[#5f6368] hover:text-primary hover:bg-primary-bg",
};

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
}

export function ButtonLink({ className, variant = "primary", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill px-5 py-3 text-sm font-semibold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-[rgba(26,115,232,0.16)]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
