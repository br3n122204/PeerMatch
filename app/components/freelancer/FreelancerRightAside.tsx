import { Bell } from "lucide-react";

const activities = [
  { id: "1", name: "Daddy", timeAgo: "2 min ago" },
  { id: "2", name: "Allosaur", timeAgo: "15 min ago" },
  { id: "3", name: "Hero", timeAgo: "1 hr ago" },
];

export function FreelancerRightAside() {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-8 rounded-2xl border border-zinc-200/80 bg-[#E8EFEC] p-6 shadow-sm">
      <section>
        <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-zinc-600">
              <Bell className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="text-sm leading-snug text-zinc-700">Someone responded to your post</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-900">Recent Activities</h3>
        <ul className="mt-3 space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 shadow-sm"
            >
              <p className="text-sm font-semibold text-zinc-900">{a.name}</p>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full max-w-[180px] rounded-full bg-zinc-300/80" />
                <div className="h-2 w-full max-w-[140px] rounded-full bg-zinc-300/60" />
              </div>
              <p className="mt-3 text-xs text-zinc-500">{a.timeAgo}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
