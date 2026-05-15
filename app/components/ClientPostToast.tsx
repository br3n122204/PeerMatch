"use client";

import { Bell, X } from "lucide-react";

export type ClientPostToastState = {
  variant: "pending" | "approved";
  message: string;
} | null;

type ClientPostToastProps = {
  toast: ClientPostToastState;
  onDismiss: () => void;
};

export function ClientPostToast({ toast, onDismiss }: ClientPostToastProps) {
  if (!toast) return null;

  const isPending = toast.variant === "pending";

  return (
    <div
      className={`fixed right-4 top-4 z-[100] flex w-[min(100%,22rem)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg shadow-zinc-900/10 sm:right-6 sm:top-6 ${
        isPending
          ? "border-[#FFD4C2] bg-[#FFF2EB] text-[#9A3412]"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <span
        className={`mt-0.5 inline-flex shrink-0 rounded-lg p-1.5 ${
          isPending ? "bg-[#FF6B35]/15 text-[#FF6B35]" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Bell className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 rounded-lg p-1 transition hover:bg-black/5 ${
          isPending ? "text-[#9A3412]" : "text-emerald-800"
        }`}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
