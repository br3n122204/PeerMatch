"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { ChatMessagePayload } from "@/app/lib/chatTypes";
import { apiGetJson } from "@/app/lib/api";
import { connectSocket, subscribePresenceSnapshot, subscribePresenceUpdate } from "@/app/lib/socket";
import type { UserSearchResult } from "@/app/lib/userSearch";
import { searchUsersByQuery } from "@/app/lib/userSearch";
import { ChatThread } from "@/app/components/chat/ChatThread";

type Conversation = {
  otherUserId: string;
  otherName: string;
  lastMessagePreview: string;
  lastTimestamp: string | null; // ISO
  hasUnread?: boolean;
};

function getInitials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("") || "U";
}

function formatTimeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

type ChatLayoutProps = {
  currentUserId: string;
  initialOtherQuery?: string; // ObjectId or name fragment (from ?with=)
  className?: string;
};

export function ChatLayout({ currentUserId, initialOtherQuery, className = "" }: ChatLayoutProps) {
  const [searchText, setSearchText] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Temporary user search results for starting a new chat.
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Persisted conversations only (computed from MongoDB messages).
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [activeUserId, setActiveUserId] = useState<string>("");
  const [activeUserName, setActiveUserName] = useState<string>("");
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const userNameByIdRef = useRef<Record<string, string>>({});
  const lastSidebarUpdateByUserIdRef = useRef<Record<string, { lastId?: string; lastTimestamp?: string }>>({});

  const conversationsLoadedRef = useRef(false);
  const dropdownWrapRef = useRef<HTMLDivElement | null>(null);

  // Resolve initial `?with=` to a real user id + name.
  useEffect(() => {
    let cancelled = false;
    const raw = String(initialOtherQuery || "").trim();
    if (!raw || !currentUserId) return;

    (async () => {
      try {
        const data = await apiGetJson<{ user?: { id: string; name: string } }>(
          `/api/users/resolve?q=${encodeURIComponent(raw)}`,
        );
        if (cancelled) return;
        const user = data.user;
        if (user?.id) {
          setActiveUserId(user.id);
          setActiveUserName(user.name || "");
          setSearchText(user.name || "");
        }
      } catch {
        // ignore initial resolution errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialOtherQuery, currentUserId]);

  // Debounced user search (dropdown only). Selecting a user does NOT persist into sidebar until a message exists.
  useEffect(() => {
    const q = String(searchText || "").trim();
    if (!q) {
      setUserResults([]);
      setDropdownOpen(false);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);

    const t = window.setTimeout(async () => {
      try {
        const users = await searchUsersByQuery(q);
        if (cancelled) return;
        setUserResults(users);
        setDropdownOpen(searchFocused);
      } catch {
        if (cancelled) return;
        setUserResults([]);
        setSearchError("Could not search users.");
        setDropdownOpen(searchFocused);
      } finally {
        if (cancelled) return;
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [searchText]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = dropdownWrapRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setDropdownOpen(false);
      setSearchFocused(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Load persisted conversations from MongoDB messages.
  useEffect(() => {
    if (!currentUserId) return;
    if (conversationsLoadedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await apiGetJson<{ conversations: Conversation[] }>(`/api/messages/conversations`);
        if (cancelled) return;
        const list = data.conversations || [];
        setConversations(list);
        for (const c of list) {
          userNameByIdRef.current[c.otherUserId] = c.otherName;
        }
        conversationsLoadedRef.current = true;
      } catch {
        if (cancelled) return;
        setConversations([]);
        conversationsLoadedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setOnlineUserIds(new Set());
      return;
    }

    connectSocket(currentUserId);

    const unsubSnapshot = subscribePresenceSnapshot((payload) => {
      const ids = Array.isArray(payload?.onlineUserIds) ? payload.onlineUserIds : [];
      setOnlineUserIds(new Set(ids.map((id) => String(id))));
    });

    const unsubUpdate = subscribePresenceUpdate((payload) => {
      const userId = String(payload?.userId || "").trim();
      if (!userId) return;
      const isOnline = Boolean(payload?.online);
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    return () => {
      unsubSnapshot();
      unsubUpdate();
    };
  }, [currentUserId]);

  const filteredConversations = useMemo(() => {
    return conversations;
  }, [conversations]);

  const activeUserConnected = useMemo(() => {
    const id = String(activeUserId || "").trim();
    if (!id) return false;
    return onlineUserIds.has(id);
  }, [activeUserId, onlineUserIds]);

  const handleSelectUserFromSearch = (u: UserSearchResult) => {
    // Temporary selection only.
    setActiveUserId(u.id);
    setActiveUserName(u.name);
    userNameByIdRef.current[u.id] = u.name;
    setSearchText(u.name);
    setSearchFocused(false);
    setDropdownOpen(false);
  };

  const handleSelectConversationFromSidebar = (c: Conversation) => {
    setActiveUserId(c.otherUserId);
    setActiveUserName(c.otherName);
    userNameByIdRef.current[c.otherUserId] = c.otherName;
    setDropdownOpen(false);
    setSearchFocused(false);
  };

  const handleNewChat = () => {
    setActiveUserId("");
    setActiveUserName("");
    setDropdownOpen(false);
    setUserResults([]);
    setSearchText("");
    setSearchFocused(false);
  };

  return (
    <div className={`flex h-full w-full h-[700px] overflow-hidden bg-[#F5F5F5] ${className}`}>
      {/* Left sidebar */}
      <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Messages</h1>

          <div ref={dropdownWrapRef} className="relative mt-4">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.8}
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search conversations..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-[#4DD2AC]/30"
              autoComplete="off"
              spellCheck={false}
              onFocus={() => {
                const q = String(searchText || "").trim();
                setSearchFocused(true);
                if (q) setDropdownOpen(true);
              }}
            />

          {dropdownOpen ? (
            <div className="mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              {searchLoading ? <div className="p-3 text-sm text-zinc-500">Searching…</div> : null}
              {searchError ? <div className="p-3 text-sm text-red-600">{searchError}</div> : null}
              {!searchLoading && !searchError && userResults.length === 0 ? (
                <div className="p-3 text-sm text-zinc-500">No matching users.</div>
              ) : null}
              {!searchLoading && !searchError && userResults.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto p-1">
                  {userResults.map((u) => {
                    const active = u.id === activeUserId;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectUserFromSearch(u)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                            active ? "bg-[#FFF2EB]" : "hover:bg-zinc-50"
                          }`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
                            {getInitials(u.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-zinc-900">{u.name}</span>
                            <span className="block truncate text-[11px] text-zinc-500">{u.id}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {filteredConversations.map((c) => {
              const active = c.otherUserId === activeUserId;
              return (
                <button
                  key={c.otherUserId}
                  type="button"
                  onClick={() => handleSelectConversationFromSidebar(c)}
                  className={`w-full rounded-xl border border-transparent px-2 py-2 text-left transition ${
                    active ? "bg-[#FFF2EB]" : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-semibold text-white">
                      {getInitials(c.otherName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            c.hasUnread ? "font-bold" : "font-semibold"
                      } text-zinc-900 leading-tight`}
                        >
                          {c.otherName}
                        </p>
                    <p className="text-[11px] leading-tight font-medium text-zinc-500">
                      {formatTimeAgo(c.lastTimestamp || undefined)}
                    </p>
                      </div>
                      <p
                        className={`mt-1 truncate text-xs ${
                          c.hasUnread ? "font-semibold text-zinc-900" : "text-zinc-600"
                        } leading-snug`}
                      >
                        {c.lastMessagePreview || ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-500">
                No conversations yet. Search for someone and send the first message.
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-12 w-full items-center justify-start gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#FF6B35] transition hover:bg-[#FFF2EB] hover:text-[#e85f2c] border border-[#FF6B35]"
          >
            <span className="text-base leading-none">+</span>
            New Chat
          </button>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F5F5]">
        <ChatThread
          className="h-full"
          currentUserId={currentUserId}
          otherUserId={activeUserId}
          otherUserLabel={activeUserName}
          statusText={activeUserConnected ? "Online" : "Offline"}
          onConversationUpdated={(otherId, msgs: ChatMessagePayload[]) => {
            if (!otherId) return;
            if (!msgs || msgs.length === 0) return; // IMPORTANT: do not persist empty/temporary chats

            const last = msgs[msgs.length - 1];
            if (!last) return;

            const prev = lastSidebarUpdateByUserIdRef.current[otherId];
            const candidate = { lastId: last.id, lastTimestamp: last.timestamp };
            if (prev?.lastId === candidate.lastId && prev?.lastTimestamp === candidate.lastTimestamp) return;
            lastSidebarUpdateByUserIdRef.current[otherId] = candidate;

            const name = userNameByIdRef.current[otherId] || activeUserName || "Unknown";

            setConversations((prevList) => {
              const existing = prevList.find((c) => c.otherUserId === otherId);
              const nextItem: Conversation = {
                otherUserId: otherId,
                otherName: name,
                lastMessagePreview: last.message || "",
                lastTimestamp: last.timestamp || null,
              };

              const merged = existing
                ? prevList.map((c) => (c.otherUserId === otherId ? nextItem : c))
                : [nextItem, ...prevList];

              return merged.sort((a, b) => {
                const at = a.lastTimestamp ? new Date(a.lastTimestamp).getTime() : 0;
                const bt = b.lastTimestamp ? new Date(b.lastTimestamp).getTime() : 0;
                return bt - at;
              });
            });
          }}
        />
      </main>
    </div>
  );
}

