"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCommunityPosts, isCommunityPostWithinLast24Hours, type CommunityPost } from "@/app/lib/postsStorage";

function formatTimeAgo(value: string) {
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return "Just now";
  const diffMs = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
  return `${Math.floor(diffMs / day)} day${Math.floor(diffMs / day) > 1 ? "s" : ""} ago`;
}

export function FreelancerRightAside() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const loadPosts = () => setPosts(getCommunityPosts());
    loadPosts();
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "peermatch_community_posts_v1") return;
      loadPosts();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recentPosts = useMemo(
    () => posts.filter((post) => isCommunityPostWithinLast24Hours(post.createdAt)),
    [posts],
  );

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
        <h3 className="text-sm font-semibold text-zinc-900">Recent Posts</h3>
        <ul className="mt-3 space-y-3">
          {recentPosts.length === 0 ? (
            <li className="rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 text-xs text-zinc-500 shadow-sm">
              No recent post
            </li>
          ) : (
            recentPosts.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/freelancer-dashboard/client/${encodeURIComponent(post.authorId)}`)
                  }
                  className="w-full rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 text-left shadow-sm hover:bg-[#efe4dd]"
                >
                  <p className="text-sm font-semibold text-zinc-900">{post.authorName || "Client User"}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-snug text-zinc-700">{post.title}</p>
                  <p className="mt-3 text-xs text-zinc-500">{formatTimeAgo(post.createdAt)}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
}
