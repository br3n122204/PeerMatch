"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGetJson, apiPostJson, ApiError } from "../lib/api";

type PostItem = {
  id: string;
  author: string;
  timeAgo: string;
  title: string;
  content: string;
  category: string;
  priority: "Normal" | "Important";
  avatar: string;
};

type ActivityItem = {
  id: string;
  name: string;
  message: string;
  timeAgo: string;
  avatar: string;
};

export default function ClientHomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");
  const posts: PostItem[] = [];
  const recentActivities: ActivityItem[] = [];
  const notifications: string[] = [];

  const activeConnections: number | null | undefined = undefined;
  const hoursThisWeek: number | null | undefined = undefined;
  const displayConnectionsRaw =
    typeof activeConnections === "number" && Number.isFinite(activeConnections) ? activeConnections : 0;
  const displayHoursRaw = typeof hoursThisWeek === "number" && Number.isFinite(hoursThisWeek) ? hoursThisWeek : 0;

  const displayConnections = displayConnectionsRaw;
  const displayHours = displayHoursRaw;

  const postsHeading = posts.length === 0 ? "No latest Post By CIT Community" : "Latest Posts By CIT Community";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGetJson<{ id: string; name: string; email: string; role: string }>("/api/auth/me");
        const firstName = String(me.name || "").trim().split(/\s+/)[0] || "";
        if (!cancelled) setDisplayName(firstName);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiPostJson<{ message: string }>("/api/auth/logout", {});
    } finally {
      router.push("/login");
    }
  };
  return (
    <div className="min-h-screen bg-[#D9ECE9] px-4 py-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[300px_1fr_360px]">
        <aside className="flex h-full flex-col rounded border border-zinc-300 bg-[#D7E3E1] p-5">
          <div className="flex items-center gap-3 rounded border border-zinc-300 bg-white p-3">
            <Image src="/logo.png" alt="PeerMatch logo" width={30} height={30} />
            <div>
              <p className="text-sm font-semibold text-zinc-900">PeerMatch</p>
              <p className="text-[11px] text-zinc-500">Student Collaboration</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            <Link href="/client-home" className="block rounded-xl bg-[#FA642C] px-4 py-3 text-sm font-semibold text-white">
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=create-post")}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-white"
            >
              Create Post
            </button>
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=messages")}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-white"
            >
              Message
            </button>
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=profile")}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-white"
            >
              Profile
            </button>
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Logout
          </button>
        </aside>

        <main className="h-full rounded border border-zinc-300 bg-[#DDF0EE] p-6 lg:p-8">
          <h1 className="text-3xl font-semibold text-zinc-900">
            {displayName ? `Welcome back, ${displayName}!` : "Welcome back!"}
          </h1>
          <p className="text-sm text-zinc-600">Here's what's happening in your learning community</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=connections")}
              className="rounded-xl border border-zinc-300 bg-zinc-100 p-6 text-left hover:bg-zinc-50 lg:p-7"
            >
              <p className="text-lg font-semibold text-zinc-900">Active Connections</p>
              <p className="mt-5 text-5xl font-semibold text-zinc-900">{displayConnections || 0}</p>
              <p className="mt-2 text-sm text-zinc-600">Students you're helping or getting help from</p>
            </button>
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=hours")}
              className="rounded-xl border border-zinc-300 bg-zinc-100 p-6 text-left hover:bg-zinc-50 lg:p-7"
            >
              <p className="text-lg font-semibold text-zinc-900">Hours This Week</p>
              <p className="mt-5 text-5xl font-semibold text-zinc-900">{displayHours || 0}</p>
              <p className="mt-2 text-sm text-zinc-600">Time spent in peer collaboration</p>
            </button>
          </div>

          <hr className="my-6 border-zinc-400/60" />

          <h2 className="text-[44px] font-semibold leading-tight text-zinc-900">{postsHeading}</h2>

          <div className="mt-5 space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-6 text-zinc-700 lg:p-8">No latest post</div>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => router.push(`/client-home?post=${encodeURIComponent(post.id)}`)}
                  className="block w-full rounded-2xl border border-zinc-300 bg-zinc-100 p-5 text-left hover:bg-zinc-50 lg:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={post.avatar} alt={`${post.author} avatar`} className="h-10 w-10 rounded-full border border-zinc-300" />
                      <div>
                        <p className="text-2xl font-semibold text-zinc-900">{post.author}</p>
                        <p className="text-xs text-zinc-500">{post.timeAgo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-zinc-400 px-4 py-1 text-xs text-zinc-800">{post.category}</span>
                      <span
                        className={`rounded-full px-4 py-1 text-xs font-semibold ${
                          post.priority === "Important" ? "bg-[#FFC31E] text-zinc-900" : "bg-[#56BA54] text-zinc-900"
                        }`}
                      >
                        {post.priority}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-[38px] font-semibold leading-tight text-zinc-900">{post.title}</p>
                  <p className="mt-5 text-[26px] leading-[1.35] text-zinc-700">{post.content}</p>
                </button>
              ))
            )}
          </div>
        </main>

        <aside className="h-full rounded border border-zinc-300 bg-[#D7E3E1] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=notifications")}
              className="mt-3 w-full rounded-lg border border-zinc-400 bg-white px-3 py-3 text-left text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="inline-flex items-center gap-2">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-zinc-600">
                  <path
                    d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Z"
                    fill="currentColor"
                  />
                  <path
                    d="M18 16.5H6c.6-.9 1.5-2 1.5-5.5a4.5 4.5 0 0 1 9 0c0 3.5.9 4.6 1.5 5.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>No Notification Yet</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/client-home?panel=notifications")}
              className="mt-3 w-full rounded-lg border border-zinc-400 bg-white px-3 py-3 text-left text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-zinc-600"
                >
                  <path
                    d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Z"
                    fill="currentColor"
                  />
                  <path
                    d="M18 16.5H6c.6-.9 1.5-2 1.5-5.5a4.5 4.5 0 0 1 9 0c0 3.5.9 4.6 1.5 5.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{notifications[0]}</span>
              </span>
            </button>
          )}

          <div className="mt-7 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Recent Activities</h3>
          </div>
          <div className="mt-3 space-y-2">
            {recentActivities.length === 0 ? (
              <div className="rounded-lg bg-zinc-200 p-3 text-xs text-zinc-700">No Recent Activities</div>
            ) : (
              recentActivities.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => router.push(`/client-home?activity=${encodeURIComponent(activity.id)}`)}
                  className="w-full rounded-lg bg-zinc-200 p-3 text-left hover:bg-zinc-300"
                >
                  <div className="flex gap-2">
                    <img src={activity.avatar} alt={`${activity.name} avatar`} className="h-6 w-6 rounded-full border border-zinc-300" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">{activity.name}</p>
                      <p className="text-[11px] text-zinc-700">{activity.message}</p>
                      <p className="text-[10px] text-zinc-500">{activity.timeAgo}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
