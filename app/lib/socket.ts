import { io, type Socket } from "socket.io-client";
import type { ChatMessagePayload } from "./chatTypes";

function getSocketUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
}

let socket: Socket | null = null;
let activeUserId: string | null = null;

function emitRegister(userId: string) {
  if (!socket) return;
  socket.emit("register", { userId });
}

/**
 * Connects the shared Socket.IO client (credentials: HTTP-only JWT cookie).
 * Idempotent for the same user; re-registers on reconnect.
 */
export function connectSocket(userId: string): Socket {
  const id = String(userId || "").trim();
  if (!id) {
    throw new Error("connectSocket requires a user id.");
  }
  activeUserId = id;

  if (!socket) {
    socket = io(getSocketUrl(), {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      if (activeUserId) {
        emitRegister(activeUserId);
      }
    });
  } else if (socket.connected) {
    emitRegister(id);
  }

  return socket;
}

export function disconnectSocket(): void {
  activeUserId = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function sendChatMessage(receiverId: string, message: string): void {
  const s = socket;
  if (!s?.connected) return;
  const rid = String(receiverId || "").trim();
  const text = String(message || "").trim();
  if (!rid || !text) return;
  s.emit("send_message", { receiverId: rid, message: text });
}

/**
 * Subscribe to incoming messages. Removes the listener on the returned cleanup.
 * Avoid duplicate handlers by always unsubscribing in useEffect cleanup.
 */
export function subscribeReceiveMessage(handler: (msg: ChatMessagePayload) => void): () => void {
  const s = socket;
  if (!s) {
    return () => {};
  }
  s.on("receive_message", handler);
  return () => {
    s.off("receive_message", handler);
  };
}

export function subscribeSocketError(handler: (payload: { message?: string }) => void): () => void {
  const s = socket;
  if (!s) {
    return () => {};
  }
  s.on("socket_error", handler);
  return () => {
    s.off("socket_error", handler);
  };
}
