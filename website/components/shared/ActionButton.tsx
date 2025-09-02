"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function ActionButton({
  children,
  isLoading,
  loadingText = "Processing...",
  icon,
  className,
  variant = "default",
  ...props
}: ActionButtonProps) {
  return (
    <Button
      className={cn("flex items-center gap-2", className)}
      disabled={isLoading}
      variant={variant}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}
