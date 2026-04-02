"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Clock, LayoutDashboard, LogOut, MessageCircle, Search, User, Users } from "lucide-react";
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

const navItemClass =
  "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-900 transition-[background-color,color] duration-300 ease-in-out hover:bg-[#FF6B35] hover:text-white";
const navActiveClass = "bg-[#FF6B35] text-white shadow-sm";

export default function ClientHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePanel = searchParams.get("panel");
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

  const postsHeading = "Latest Post By CIT Community";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await apiGetJson<{ user: { id: string; name: string; email: string; role: string } }>(
          "/api/auth/me",
        );
        const fullName = String(me.user?.name || "").trim();
        if (!cancelled) setDisplayName(fullName);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiPostJson("/api/auth/logout", {});
    } finally {
      router.push("/login");
    }
  };

  const navItems = [
    { href: "/client-home", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.75} /> },
    {
      href: "/client-home?panel=browse-post",
      label: "Browse Post",
      icon: <Search className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
    },
    {
      href: "/client-home?panel=messages",
      label: "Message",
      icon: <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.75} />,
    },
    { href: "/client-home?panel=profile", label: "Profile", icon: <User className="h-5 w-5 shrink-0" strokeWidth={1.75} /> },
  ];

  const isNavActive = (href: string) => {
    if (href === "/client-home") return pathname === "/client-home" && !activePanel;
    const panel = href.split("panel=")[1];
    return pathname === "/client-home" && panel === activePanel;
  };

  const handleNavHover = (href: string) => {
    if (isNavActive(href)) return;
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1600px] grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="flex h-full min-h-[calc(100vh-4rem)] flex-col rounded-2xl border border-zinc-200/80 bg-[#E8EFEC] p-6 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-3 py-3 shadow-sm">
            <Image src="/logo.png" alt="PeerMatch logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900">PeerMatch</p>
              <p className="text-[11px] text-zinc-500">Student Collaboration</p>
            </div>
          </div>

          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1.5" aria-label="Main">
            {navItems.map((item) => {
              const active = isNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => handleNavHover(item.href)}
                  className={`${navItemClass} ${active ? navActiveClass : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className={`${navItemClass} mt-auto w-full justify-start border border-transparent pt-4`}
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span>Logout</span>
          </button>
        </aside>

        <main className="h-full rounded-2xl border border-zinc-100/80 bg-white p-6 shadow-[0_4px_32px_rgba(15,23,42,0.04)] sm:p-8 lg:p-10">
          {activePanel === "browse-post" ? (
            <section aria-labelledby="browse-post-heading">
              <h1 id="browse-post-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
                Browse Post
              </h1>
              <p className="mt-2 text-sm text-zinc-500">Explore posts from the community.</p>
            </section>
          ) : activePanel === "messages" ? (
            <section aria-labelledby="messages-heading">
              <h1 id="messages-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
                Message
              </h1>
              <p className="mt-2 text-sm text-zinc-500">Your conversations will appear here.</p>
            </section>
          ) : activePanel === "profile" ? (
            <section aria-labelledby="profile-heading">
              <h1 id="profile-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
                Profile
              </h1>
              <p className="mt-2 text-sm text-zinc-500">Manage your Client profile.</p>
            </section>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {displayName ? `Welcome back, ${displayName}!` : "Welcome back!"}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">Here&apos;s what&apos;s happening in your learning community</p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => router.push("/client-home?panel=connections")}
                  className="rounded-2xl border border-zinc-100 bg-white p-6 text-left shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover:bg-zinc-50 md:p-7"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F7F4] text-zinc-700">
                      <Users className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-900">Active Connections</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        Students you&apos;re helping or getting help from
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/client-home?panel=hours")}
                  className="rounded-2xl border border-zinc-100 bg-white p-6 text-left shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover:bg-zinc-50 md:p-7"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F7F4] text-zinc-700">
                      <Clock className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-900">Hours This Week</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">Time spent in peer collaboration</p>
                    </div>
                  </div>
                </button>
              </div>

              <hr className="my-10 border-zinc-200" />

              <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{postsHeading}</h2>

              <div className="mt-5 space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => router.push(`/client-home?post=${encodeURIComponent(post.id)}`)}
                      className="block w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-5 text-left hover:bg-zinc-100 lg:p-7"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.avatar}
                            alt={`${post.author} avatar`}
                            className="h-10 w-10 rounded-full border border-zinc-300"
                          />
                          <div>
                            <p className="text-2xl font-semibold text-zinc-900">{post.author}</p>
                            <p className="text-xs text-zinc-500">{post.timeAgo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-zinc-400 px-4 py-1 text-xs text-zinc-800">
                            {post.category}
                          </span>
                          <span
                            className={`rounded-full px-4 py-1 text-xs font-semibold ${
                              post.priority === "Important"
                                ? "bg-[#FFC31E] text-zinc-900"
                                : "bg-[#56BA54] text-zinc-900"
                            }`}
                          >
                            {post.priority}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-2xl font-semibold leading-tight text-zinc-900">{post.title}</p>
                      <p className="mt-5 text-base leading-[1.6] text-zinc-700">{post.content}</p>
                    </button>
                  ))
                ) : null}
              </div>
            </>
          )}
        </main>

        <aside className="flex h-full min-h-0 flex-col gap-8 rounded-2xl border border-zinc-200/80 bg-[#E8EFEC] p-6 shadow-sm">
          <section>
            <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
            {notifications.length === 0 ? (
              <button
                type="button"
                onClick={() => router.push("/client-home?panel=notifications")}
                className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-4 text-left text-xs text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Bell aria-hidden="true" className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
                  <span>Someone responded to your post</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/client-home?panel=notifications")}
                className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-4 text-left text-xs text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Bell aria-hidden="true" className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
                  <span>{notifications[0]}</span>
                </span>
              </button>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900">Recent Activities</h3>
            <div className="mt-3 space-y-3">
            {recentActivities.length === 0 ? (
              <>
                <div className="rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Daddy</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full max-w-[180px] rounded-full bg-zinc-300/80" />
                    <div className="h-2 w-full max-w-[140px] rounded-full bg-zinc-300/60" />
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">2 min ago</p>
                </div>
                <div className="rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Allosaur</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full max-w-[180px] rounded-full bg-zinc-300/80" />
                    <div className="h-2 w-full max-w-[140px] rounded-full bg-zinc-300/60" />
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">15 min ago</p>
                </div>
                <div className="rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-900">Hero</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-full max-w-[180px] rounded-full bg-zinc-300/80" />
                    <div className="h-2 w-full max-w-[140px] rounded-full bg-zinc-300/60" />
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">1 hr ago</p>
                </div>
              </>
            ) : (
              recentActivities.map((activity) => (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => router.push(`/client-home?activity=${encodeURIComponent(activity.id)}`)}
                  className="w-full rounded-xl border border-[#E8DDD6] bg-[#F4EBE4] px-4 py-3 text-left shadow-sm hover:bg-[#efe4dd]"
                >
                  <div className="flex gap-2">
                    <img
                      src={activity.avatar}
                      alt={`${activity.name} avatar`}
                      className="h-6 w-6 rounded-full border border-zinc-300"
                    />
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
          </section>
        </aside>
      </div>
    </div>
  );
}

