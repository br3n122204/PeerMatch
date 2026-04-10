"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Phone, Send, Smile, Trash2, Video } from "lucide-react";
import Picker from "emoji-picker-react";
import { ApiError, apiDeleteJson, apiGetJson, apiPostJson } from "@/app/lib/api";
import type { ChatMessagePayload } from "@/app/lib/chatTypes";
import {
  connectSocket,
  getChatSocket,
  sendChatMessage,
  subscribeReceiveMessage,
  subscribeSocketError,
} from "@/app/lib/socket";

type ChatThreadProps = {
  currentUserId: string;
  otherUserId: string;
  otherUserLabel?: string;
  statusText?: string;
  onConversationUpdated?: (otherUserIdResolved: string, messages: ChatMessagePayload[]) => void;
  className?: string;
};

function isSameConversation(msg: ChatMessagePayload, a: string, b: string): boolean {
  const pair = new Set([msg.senderId, msg.receiverId]);
  return pair.has(a) && pair.has(b) && pair.size === 2;
}

export function ChatThread({
  currentUserId,
  otherUserId,
  otherUserLabel,
  statusText = "Online",
  onConversationUpdated,
  className = "",
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [resolvingUser, setResolvingUser] = useState(false);
  const [resolvedOtherId, setResolvedOtherId] = useState<string>("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const onConversationUpdatedRef = useRef(onConversationUpdated);

  useEffect(() => {
    onConversationUpdatedRef.current = onConversationUpdated;
  }, [onConversationUpdated]);

  const trimmedOther = String(otherUserId || "").trim();

  function looksLikeObjectId(v: string) {
    return /^[a-fA-F0-9]{24}$/.test(v);
  }

  const canChat = Boolean(currentUserId && resolvedOtherId && resolvedOtherId !== currentUserId);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    connectSocket(currentUserId);
  }, [currentUserId]);

  // Resolve a name/partial into a MongoDB _id so both the history fetch and socket matching work.
  useEffect(() => {
    let cancelled = false;
    const raw = String(otherUserId || "").trim();

    setResolvedOtherId("");
    if (!raw || !currentUserId || raw === currentUserId) return;
    if (looksLikeObjectId(raw)) {
      setResolvedOtherId(raw);
      return;
    }

    setResolvingUser(true);
    (async () => {
      try {
        const data = await apiGetJson<{ user?: { id: string; name?: string } }>(
          `/api/users/resolve?q=${encodeURIComponent(raw)}`,
        );
        if (cancelled) return;
        setResolvedOtherId(String(data.user?.id || ""));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "User lookup failed.";
        // Requirement: do not show an error for "no conversation"; just treat as empty.
        void message;
        setResolvedOtherId("");
      } finally {
        if (!cancelled) setResolvingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [otherUserId, currentUserId]);

  useEffect(() => {
    if (!canChat) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);

    (async () => {
      try {
        const data = await apiGetJson<{ messages: ChatMessagePayload[] }>(
          `/api/messages/conversation/${encodeURIComponent(resolvedOtherId)}`,
        );
        if (cancelled) return;
        setMessages(data.messages || []);
      } catch {
        // Requirement: if no conversation / invalid input, show empty state instead of error.
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canChat, resolvedOtherId, currentUserId]);

  // Keep sidebar conversation preview in sync (last message + timestamp).
  useEffect(() => {
    if (!canChat) return;
    if (!resolvedOtherId) return;
    if (typeof onConversationUpdatedRef.current !== "function") return;
    onConversationUpdatedRef.current(resolvedOtherId, messages);
  }, [messages, canChat, resolvedOtherId]);

  // Mark conversation messages as seen when the chat is open.
  useEffect(() => {
    if (!canChat) return;
    void apiPostJson("/api/messages/seen", { otherUserId: resolvedOtherId }).catch(() => undefined);
  }, [canChat, resolvedOtherId]);

  useEffect(() => {
    if (!canChat) return;

    const unsub = subscribeReceiveMessage((msg) => {
      if (!isSameConversation(msg, currentUserId, resolvedOtherId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsub;
  }, [canChat, currentUserId, resolvedOtherId]);

  useEffect(() => {
    const unsub = subscribeSocketError((p) => {
      setSocketError(typeof p?.message === "string" ? p.message : "Messaging error.");
    });
    return unsub;
  }, []);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setDraft((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showEmojiPicker) return;
      
      const target = event.target as Node;
      const pickerElement = emojiPickerRef.current;
      const buttonElement = emojiButtonRef.current;
      
      // Don't close if clicking inside the picker or on the emoji button
      if (pickerElement?.contains(target) || buttonElement?.contains(target)) {
        return;
      }
      
      setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const send = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      if (!canChat) return;
      const text = draft.trim();
      if (!text) return;

      const s = getChatSocket();
      if (!s?.connected) {
        setSocketError("Not connected. Check that the API server is running.");
        return;
      }

      setSocketError(null);
      const pending: ChatMessagePayload = {
        id: `pending-${Date.now()}`,
        senderId: currentUserId,
        receiverId: resolvedOtherId,
        message: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, pending]);
      sendChatMessage(resolvedOtherId, text);
      setDraft("");
    },
    [canChat, currentUserId, draft, resolvedOtherId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!messageId || messageId.startsWith("pending-")) return;
      
      try {
        await apiDeleteJson(`/api/messages/${messageId}`);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to delete message.";
        setSocketError(message);
      }
    },
    [],
  );

  const title = useMemo(() => {
    if (!trimmedOther) return "Select a conversation";
    if (otherUserLabel?.trim()) return otherUserLabel.trim();
    if (resolvedOtherId) return `User ${resolvedOtherId.slice(0, 8)}…`;
    return "Conversation";
  }, [otherUserLabel, resolvedOtherId, trimmedOther]);

  if (!currentUserId) {
    return (
      <div className={`rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 ${className}`}>
        Sign in to use messages.
      </div>
    );
  }

  return (
    <div className={`flex h-full max-h-full min-h-0 flex-col overflow-hidden ${className}`}>
      <header className="shrink-0 min-h-[76px] border-b border-zinc-200 bg-white px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate leading-tight text-sm font-semibold text-zinc-900">{title}</p>
            <p
              className={`mt-1 text-xs font-medium leading-tight ${
                statusText === "Online" ? "text-[#4DD2AC]" : "text-zinc-700"
              }`}
            >
              {canChat ? statusText : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Call">
              <Phone className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Video">
              <Video className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Info">
              <Info className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F5F5F5] px-6 py-6">
        {loadingHistory ? <p className="text-sm text-zinc-500">Loading messages…</p> : null}
        {resolvingUser ? <p className="text-sm text-zinc-500">Looking up user…</p> : null}
        {socketError ? <p className="text-sm text-red-600">{socketError}</p> : null}

        {!trimmedOther ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="max-w-md text-center">
              <p className="text-sm font-semibold text-zinc-900">Select a conversation</p>
              <p className="mt-2 text-sm text-zinc-500">Choose a user from the left sidebar to load messages.</p>
            </div>
          </div>
        ) : null}

        {!loadingHistory && !resolvingUser && messages.length === 0 ? (
          trimmedOther ? <p className="text-sm text-zinc-500">No messages yet</p> : null
        ) : null}

        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[min(100%,28rem)] rounded-xl px-4 py-2.5 ${
                  mine
                    ? "rounded-tr-md bg-[#4DD2AC] text-white"
                    : "rounded-tl-md bg-white text-zinc-900 ring-1 ring-zinc-200"
                }`}
              >
                <div className="flex flex-col max-h-[160px] overflow-hidden">
                  <div
                    className={`min-h-0 flex-1 overflow-y-auto pr-1 ${
                      mine ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-5">{m.message}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p
                      className={`text-[11px] leading-4 ${
                        mine ? "text-white/80" : "text-zinc-500"
                      } font-medium`}
                    >
                      {time}
                    </p>
                    {mine && !m.id.startsWith("pending-") && (
                      <button
                        type="button"
                        onClick={() => deleteMessage(m.id)}
                        className={`p-1 rounded hover:bg-zinc-200/20 transition ${
                          mine ? "text-white/70 hover:text-white" : "text-zinc-400 hover:text-zinc-600"
                        }`}
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="shrink-0 border-t border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              aria-label="Add emoji"
              disabled={!canChat}
            >
              <Smile className="h-5 w-5" strokeWidth={1.8} />
            </button>
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-20">
                <Picker onEmojiClick={handleEmojiClick} lazyLoadEmojis />
              </div>
            )}
          </div>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="h-10 min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm leading-5 text-zinc-800 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-[#4DD2AC]/30"
            disabled={!canChat}
          />
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4DD2AC] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
            aria-label="Send message"
            disabled={!canChat || !draft.trim()}
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}
