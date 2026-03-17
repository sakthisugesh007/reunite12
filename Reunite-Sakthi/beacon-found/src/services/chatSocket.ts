import { io, type Socket } from "socket.io-client";
import type { BackendConversation } from "@/services/conversationsService";
import type { BackendItem } from "@/services/itemsService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace(/\/api$/, "");

export interface ConversationUpdatedPayload {
  type: "started" | "message" | "verified" | "completed" | "archived";
  conversation: BackendConversation;
}

export interface ItemUpdatedPayload {
  type: "created" | "updated" | "deleted" | "claimed" | "self-found" | "verified" | "completed";
  item: BackendItem;
}

type ConversationUpdatedHandler = (payload: ConversationUpdatedPayload) => void;
type ItemUpdatedHandler = (payload: ItemUpdatedPayload) => void;

class ChatSocketService {
  private socket: Socket | null = null;

  connect(token?: string | null) {
    if (!token) {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("conversation:join", { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("conversation:leave", { conversationId });
  }

  onConversationUpdated(handler: ConversationUpdatedHandler) {
    this.socket?.on("conversation:updated", handler);
  }

  offConversationUpdated(handler: ConversationUpdatedHandler) {
    this.socket?.off("conversation:updated", handler);
  }

  onItemUpdated(handler: ItemUpdatedHandler) {
    this.socket?.on("item:updated", handler);
  }

  offItemUpdated(handler: ItemUpdatedHandler) {
    this.socket?.off("item:updated", handler);
  }
}

export const chatSocket = new ChatSocketService();
