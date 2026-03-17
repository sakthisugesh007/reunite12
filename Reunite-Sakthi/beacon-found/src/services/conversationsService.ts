const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface BackendConversationParticipant {
  user: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  role: "owner" | "finder";
  hasRead: boolean;
  lastReadAt?: string;
}

export interface BackendConversationMessage {
  _id?: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: "text" | "image" | "location" | "system";
  metadata?: {
    imageUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt?: string;
}

export interface BackendConversation {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    images?: { url: string }[];
    type?: "lost" | "found";
    reward?: number;
  };
  itemTitle: string;
  participants: BackendConversationParticipant[];
  messages: BackendConversationMessage[];
  status: "pending" | "verified" | "rejected" | "completed";
  reward: number;
  commission: number;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

export interface Conversation {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  reward: number;
  claimStatus: "pending" | "verified" | "rejected" | "completed";
  itemOwner: string;
  finder: string;
  isOwner: boolean;
  messages: ConversationMessage[];
  updatedAt: string;
  createdAt: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const transformConversation = (
  conversation: BackendConversation,
  currentUserId?: string | null,
): Conversation => {
  const owner = conversation.participants.find((participant) => participant.role === "owner");
  const finder = conversation.participants.find((participant) => participant.role === "finder");

  return {
    id: conversation._id,
    itemId: conversation.itemId?._id || "",
    itemTitle: conversation.itemId?.title || conversation.itemTitle,
    itemImage: conversation.itemId?.images?.[0]?.url || "/placeholder.svg",
    reward: conversation.reward,
    claimStatus: conversation.status,
    itemOwner: owner?.user.name || "Owner",
    finder: finder?.user.name || "Finder",
    isOwner: owner?.user._id === currentUserId,
    messages: (conversation.messages || []).map((message, index) => ({
      id: message._id || `${conversation._id}-${index}`,
      senderId: message.sender._id,
      senderName: message.sender.name,
      text: message.content,
      timestamp: message.createdAt || conversation.updatedAt,
      isOwn: message.sender._id === currentUserId,
    })),
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  };
};

class ConversationsService {
  async getConversations(currentUserId?: string | null): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    const data = await response.json();
    return data.conversations.map((conversation: BackendConversation) =>
      transformConversation(conversation, currentUserId),
    );
  }

  async getConversation(id: string, currentUserId?: string | null): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversation");
    }

    const data = await response.json();
    return transformConversation(data.conversation, currentUserId);
  }

  async startConversation(itemId: string, currentUserId?: string | null): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId }),
    });

    const data = await response.json();

    if (!response.ok && !data.conversation) {
      throw new Error(data.error || "Failed to start conversation");
    }

    return transformConversation(data.conversation, currentUserId);
  }

  async sendMessage(
    conversationId: string,
    content: string,
    currentUserId?: string | null,
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, messageType: "text" }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to send message");
    }

    return this.getConversation(conversationId, currentUserId);
  }

  async verifyConversation(
    conversationId: string,
    currentUserId?: string | null,
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/verify`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to verify claim");
    }

    return this.getConversation(conversationId, currentUserId);
  }

  async completeConversation(
    conversationId: string,
    currentUserId?: string | null,
    paymentDetails?: { paymentMethod?: string; transactionId?: string },
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/complete`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        paymentMethod: paymentDetails?.paymentMethod || "dummy_razorpay_upi",
        transactionId: paymentDetails?.transactionId || `pay_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to complete reunion");
    }

    return this.getConversation(conversationId, currentUserId);
  }
}

export const conversationsService = new ConversationsService();
