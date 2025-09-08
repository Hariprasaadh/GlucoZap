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
  // Enhanced visibility classes based on variant
  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case "outline":
        return "bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm";
      case "secondary":
        return "bg-gray-600 text-white border border-gray-500 hover:bg-gray-700";
      case "ghost":
        return "text-white/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20";
      case "destructive":
        return "bg-red-600 text-white hover:bg-red-700";
      case "link":
        return "text-blue-400 hover:text-blue-300 underline";
      default:
        return "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700 shadow-lg";
    }
  };

  return (
    <Button
      className={cn(
        "flex items-center gap-2 font-medium transition-all duration-200 min-h-[40px] px-4 py-2",
        getVariantClasses(variant),
        "force-visible", // Emergency fallback class
        className
      )}
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
