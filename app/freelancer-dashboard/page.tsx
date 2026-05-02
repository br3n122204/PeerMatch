"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { DashboardStatCard } from "@/app/components/freelancer/DashboardStatCard";
import { useFreelancerDashboardUser } from "./FreelancerDashboardShell";
import { getCommunityPosts } from "@/app/lib/postsStorage";
import {
  resolveFreelancerGreetingDisplayName,
  resolveFreelancerGreetingMode,
} from "@/app/lib/freelancerStorage";

export default function FreelancerDashboardPage() {
  const router = useRouter();
  const { user } = useFreelancerDashboardUser();
  const [posts, setPosts] = useState(() => getCommunityPosts());

  
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

  const formatTimeAgo = (value: string) => {
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
  };

  return (
    <main className="h-full rounded-2xl border border-zinc-100/80 bg-white p-6 shadow-[0_4px_32px_rgba(15,23,42,0.04)] sm:p-8 lg:p-10">
      
      
      <hr className="my-10 border-zinc-200" />

      <section aria-labelledby="latest-posts-heading">
        <h2 id="latest-posts-heading" className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          Community Feed
        </h2>
        <div className="mt-5 space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="cursor-pointer rounded-2xl border border-zinc-100 bg-zinc-50 p-5 lg:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/freelancer-dashboard/client/${encodeURIComponent(post.authorId)}`)}
                  className="flex items-center gap-3 text-left"
                >
                  <img
                    src={post.authorAvatarDataUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Client"}
                    alt={`${post.authorName} avatar`}
                    className="h-10 w-10 rounded-full border border-zinc-300"
                  />
                  <div>
                    <p className="text-lg font-semibold text-zinc-900 hover:text-[#FF6B35]">{post.authorName || "Client User"}</p>
                    <p className="text-xs text-zinc-500">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-zinc-400 px-4 py-1 text-xs text-zinc-800">
                    {post.category || "General"}
                  </span>
                  <span
                    className={`rounded-full px-4 py-1 text-xs font-semibold ${
                      post.priority === "Important" ? "bg-[#FFC31E] text-zinc-900" : "bg-[#56BA54] text-zinc-900"
                    }`}
                  >
                    {post.priority}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xl font-semibold leading-tight text-zinc-900">{post.title}</p>
              <p className="mt-3 text-base leading-[1.6] text-zinc-700">{post.content}</p>
            </article>
          ))}
          {posts.length === 0 ? <p className="text-sm text-zinc-500">No posts yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
