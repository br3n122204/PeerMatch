import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function DashboardStatCard({ title, description, icon }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] md:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F7F4] text-zinc-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-zinc-900">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
