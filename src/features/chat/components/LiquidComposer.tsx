import React from "react";
import { cn } from "@/global/lib/utils";
import { Send } from "lucide-react";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassComposer({
  children,
  className = "",
}: GlassEffectProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden text-foreground cursor-pointer transition-all duration-300",
        className
      )}
    >
      {/* Frosted refraction layer */}
      <div
        className="absolute inset-0 z-0 rounded-2xl"
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          background: "rgba(255, 255, 255, 0.08)",
          isolation: "isolate",
        }}
      />
      {/* White luminous overlay */}
      <div
        className="absolute inset-0 z-10 rounded-2xl"
        style={{ background: "rgba(255, 255, 255, 0.12)" }}
      />
      {/* Top-left highlight bevel */}
      <div
        className="absolute inset-0 z-20 rounded-2xl pointer-events-none"
        style={{
          boxShadow:
            "inset 0.5px 0.5px 1px 0 rgba(255, 255, 255, 0.5), inset -0.5px -0.5px 1px 0 rgba(0, 0, 0, 0.15)",
        }}
      />
      {/* Outer drop shadow */}
      <div
        className="absolute inset-0 z-20 rounded-2xl pointer-events-none"
        style={{
          boxShadow:
            "0 4px 16px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.08)",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
}

interface GlassSendButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default";
}

export function GlassSendButton({
  className,
  size = "default",
  children,
  ...props
}: GlassSendButtonProps) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <button
      type="button"
      className={cn(
        "relative overflow-hidden text-foreground cursor-pointer transition-all duration-200",
        "hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
        sizeClass,
        className
      )}
      {...props}
    >
      {/* Frosted refraction layer */}
      <div
        className="absolute inset-0 z-0 rounded-full"
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          background: "rgba(134, 59, 255, 0.6)",
          isolation: "isolate",
        }}
      />
      {/* Purple luminous overlay */}
      <div
        className="absolute inset-0 z-10 rounded-full"
        style={{ background: "rgba(134, 59, 255, 0.75)" }}
      />
      {/* Edge highlights */}
      <div
        className="absolute inset-0 z-20 rounded-full pointer-events-none"
        style={{
          boxShadow:
            "inset 0.5px 0.5px 0.5px 0 rgba(255, 255, 255, 0.4), inset -0.5px -0.5px 0.5px 0 rgba(0, 0, 0, 0.1)",
        }}
      />
      {/* Outer drop shadow */}
      <div
        className="absolute inset-0 z-20 rounded-full pointer-events-none"
        style={{
          boxShadow: "0 2px 8px rgba(134, 59, 255, 0.4)",
        }}
      />

      {/* Icon */}
      <span className="relative z-30 flex items-center justify-center text-white">
        {children ?? <Send size={14} />}
      </span>
    </button>
  );
}
