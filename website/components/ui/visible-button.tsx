"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface VisibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "success";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  asChild?: boolean;
}

const VisibleButton = forwardRef<HTMLButtonElement, VisibleButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const getVisibilityClasses = () => {
      switch (variant) {
        case "primary":
          return "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700 shadow-lg border-0";
        case "success":
          return "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg border-0";
        case "outline":
          return "bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm dark:bg-gray-800/50 dark:border-gray-600/50 dark:text-gray-200 dark:hover:bg-gray-700/50";
        case "secondary":
          return "bg-gray-600 text-white border border-gray-500 hover:bg-gray-700 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600";
        case "ghost":
          return "text-white/90 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20 dark:text-gray-200 dark:hover:bg-gray-800/50";
        case "destructive":
          return "bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700";
        case "link":
          return "text-blue-400 hover:text-blue-300 underline border-0 bg-transparent";
        default:
          return "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "h-8 px-3 text-sm";
        case "lg":
          return "h-12 px-6 text-lg";
        case "icon":
          return "h-9 w-9";
        default:
          return "h-10 px-4";
      }
    };

    return (
      <Button
        className={cn(
          "font-medium transition-all duration-200",
          getSizeClasses(),
          getVisibilityClasses(),
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

VisibleButton.displayName = "VisibleButton";

export { VisibleButton };
