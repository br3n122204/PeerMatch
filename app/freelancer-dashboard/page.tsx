"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { DashboardStatCard } from "@/app/components/freelancer/DashboardStatCard";
import { useFreelancerDashboardUser } from "./FreelancerDashboardShell";
import { fetchApprovedCommunityPosts, formatPhpBudget, urgencyBadgeClass } from "@/app/lib/communityPosts";
import type { CommunityPost } from "@/app/lib/postsStorage";
import {
  resolveFreelancerGreetingDisplayName,
  resolveFreelancerGreetingMode,
} from "@/app/lib/freelancerStorage";

export default function FreelancerDashboardPage() {
  const router = useRouter();
  const { user } = useFreelancerDashboardUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const greetingName = useMemo(
    () => (user ? resolveFreelancerGreetingDisplayName(user) : ""),
    [user],
  );

  const leadLabel = useMemo(() => {
    if (!user?.id) return "Welcome";
    const mode = resolveFreelancerGreetingMode(String(user.id));
    return mode === "welcome_back" ? "Welcome back" : "Welcome";
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const feed = await fetchApprovedCommunityPosts();
        if (!cancelled) setPosts(feed);
      } catch {
        if (!cancelled) setPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          <span className="text-zinc-900">{leadLabel},</span>{" "}
          <span className="text-zinc-900">{greetingName || "…"}</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Here&apos;s what&apos;s happening in your learning community</p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <DashboardStatCard
          title="Active Connections"
          description="Students you're helping or getting help from"
          icon={<Users className="h-6 w-6" strokeWidth={1.75} />}
          onClick={() => router.push("/freelancer-dashboard?panel=connections")}
        />
        <DashboardStatCard
          title="Hours This Week"
          description="Time spent in peer collaboration"
          icon={<Clock className="h-6 w-6" strokeWidth={1.75} />}
          onClick={() => router.push("/freelancer-dashboard?panel=hours")}
        />
      </div>

      <hr className="my-10 border-zinc-200" />

      <section aria-labelledby="latest-posts-heading">
        <h2 id="latest-posts-heading" className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          Latest Post By CIT Community
        </h2>
        <div className="mt-5 space-y-4">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => router.push(`/freelancer-dashboard/client/${encodeURIComponent(post.authorId)}`)}
              className="block w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-left hover:bg-zinc-100 lg:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatarDataUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Client"}
                    alt={`${post.authorName} avatar`}
                    className="h-10 w-10 rounded-full border border-zinc-300"
                  />
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900">{post.authorName || "Client User"}</p>
                    <p className="text-xs text-zinc-500">{formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-zinc-400 px-4 py-1 text-xs text-zinc-800">
                    {post.category || "General"}
                  </span>
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${urgencyBadgeClass(post.priority)}`}>
                    {post.priority}
                  </span>
                  {post.budget > 0 ? (
                    <span className="rounded-full bg-[#FFF2EB] px-4 py-1 text-xs font-semibold text-[#C2410C]">
                      {formatPhpBudget(post.budget)}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold leading-tight text-zinc-900">{post.title}</p>
              <p className="mt-5 text-base leading-[1.6] text-zinc-700">{post.content}</p>
            </button>
          ))}
          {posts.length === 0 ? <p className="text-sm text-zinc-500">No posts yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
