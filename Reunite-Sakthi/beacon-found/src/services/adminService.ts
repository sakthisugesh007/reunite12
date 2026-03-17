const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface AdminStatsResponse {
  stats: {
    totalUsers: number;
    totalItems: number;
    activeItems: number;
    completedReunions: number;
    totalConversations: number;
    totalTransactions: number;
    totalRewards: number;
    totalCommission: number;
    totalFinderPayouts: number;
  };
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    stats?: {
      itemsPosted?: number;
    };
  }>;
  recentItems: Array<{
    _id: string;
    title: string;
    type: string;
    status: string;
    reward?: number;
    createdAt: string;
    postedBy?: {
      name: string;
      email: string;
    };
    claimedBy?: {
      name: string;
      email: string;
    };
  }>;
  recentConversations: Array<{
    _id: string;
    status: string;
    createdAt: string;
    itemId?: {
      title: string;
    };
    participants: Array<{
      role: string;
      user?: {
        name: string;
      };
    }>;
  }>;
  recentTransactions: Array<{
    id: string;
    itemId?: string | null;
    itemTitle: string;
    reward: number;
    commission: number;
    finderPayout: number;
    paymentMethod: string;
    transactionId?: string | null;
    paidAt: string;
    status: string;
    owner?: {
      name: string;
      email: string;
    } | null;
    finder?: {
      name: string;
      email: string;
    } | null;
  }>;
}

export interface AdminItemsResponse {
  items: Array<{
    _id: string;
    title: string;
    type: string;
    status: string;
    category?: string;
    location?: string;
    reward?: number;
    createdAt: string;
    postedBy?: {
      name: string;
      email: string;
    };
    claimedBy?: {
      name: string;
      email: string;
    };
  }>;
  pagination: {
    current: number;
    total: number;
    count: number;
  };
}

export interface AdminTransactionsResponse {
  transactions: Array<{
    id: string;
    itemId?: string | null;
    itemTitle: string;
    itemType?: string | null;
    reward: number;
    commission: number;
    finderPayout: number;
    paymentMethod: string;
    transactionId?: string | null;
    paidAt: string;
    status: string;
    owner?: {
      name: string;
      email: string;
    } | null;
    finder?: {
      name: string;
      email: string;
    } | null;
  }>;
  pagination: {
    current: number;
    total: number;
    count: number;
  };
}

class AdminService {
  async getDashboardStats(): Promise<AdminStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to fetch admin dashboard");
    }

    return response.json();
  }

  async getItems(params: { type?: "lost" | "found"; limit?: number } = {}): Promise<AdminItemsResponse> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set("type", params.type);
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/admin/items?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to fetch admin items");
    }

    return response.json();
  }

  async getTransactions(params: { limit?: number } = {}): Promise<AdminTransactionsResponse> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/admin/transactions?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Failed to fetch transactions");
    }

    return response.json();
  }
}

export const adminService = new AdminService();
