const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface BackendItem {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: {
    url: string;
    publicId?: string;
    isPrimary?: boolean;
  }[];
  tags: string[];
  postedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  additionalInfo?: {
    dateLost?: string;
    dateFound?: string;
  };
  status: 'active' | 'claimed' | 'verified' | 'completed' | 'cancelled';
  reward?: number;
  dateLost?: Date;
  dateFound?: Date;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  claimedBy?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  claimedAt?: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  location: string;
  coordinates: [number, number];
  date: string;
  status: "lost" | "found" | "claimed" | "verified" | "completed";
  type: "lost" | "found";
  postedBy: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  reward?: number;
}

export interface CreateItemData {
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: {
    url: string;
    publicId?: string;
    isPrimary?: boolean;
  }[];
  tags: string[];
  reward?: number;
  dateLost?: string;
  dateFound?: string;
}

export interface ItemsResponse {
  items: Item[];
  pagination: {
    current: number;
    total: number;
    count: number;
  };
}

export interface ItemsQuery {
  type?: 'lost' | 'found';
  category?: string;
  status?: string;
  tags?: string[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  ownerScope?: 'mine' | 'others';
}

// Transform backend item to frontend item format
export const transformItem = (backendItem: BackendItem): Item => {
  const date =
    backendItem.additionalInfo?.dateLost ||
    backendItem.additionalInfo?.dateFound ||
    backendItem.createdAt;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return {
    id: backendItem._id,
    title: backendItem.title,
    description: backendItem.description,
    image: backendItem.images?.[0]?.url || '/placeholder.svg',
    tags: backendItem.tags,
    location: backendItem.location,
    coordinates: backendItem.coordinates ? 
      [backendItem.coordinates.longitude, backendItem.coordinates.latitude] : [0, 0],
    date: formattedDate,
    status:
      backendItem.status === 'active'
        ? backendItem.type
        : backendItem.status === 'claimed'
          ? 'claimed'
          : backendItem.status === 'verified'
            ? 'verified'
            : 'completed',
    type: backendItem.type,
    postedBy: {
      id: backendItem.postedBy._id,
      name: backendItem.postedBy.name,
      email: backendItem.postedBy.email,
      avatar: backendItem.postedBy.avatar,
    },
    reward: backendItem.reward,
  };
};

export interface UpdateItemData {
  status?: 'active' | 'claimed' | 'verified' | 'completed' | 'cancelled';
}

class ItemsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getItems(query: ItemsQuery = {}): Promise<ItemsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/items?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }

    const data = await response.json();
    return {
      items: data.items.map(transformItem),
      pagination: data.pagination,
    };
  }

  async getItem(id: string): Promise<{ item: Item }> {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    const data = await response.json();
    return { item: transformItem(data.item) };
  }

  async createItem(itemData: CreateItemData): Promise<{ item: Item; message: string }> {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create item');
    }

    const data = await response.json();
    return { item: transformItem(data.item), message: data.message };
  }

  async updateItem(id: string, itemData: UpdateItemData): Promise<{ item: Item; message: string }> {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update item');
    }

    const data = await response.json();
    return { item: transformItem(data.item), message: data.message };
  }

  async deleteItem(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete item');
    }

    return response.json();
  }

  async claimItem(id: string): Promise<{ item: Item; message: string }> {
    const response = await fetch(`${API_BASE_URL}/items/${id}/claim`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to claim item');
    }

    const data = await response.json();
    return { item: transformItem(data.item), message: data.message };
  }

  async markItemAsSelfFound(id: string): Promise<{ item: Item; message: string }> {
    const response = await fetch(`${API_BASE_URL}/items/${id}/self-found`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark item as found');
    }

    const data = await response.json();
    return { item: transformItem(data.item), message: data.message };
  }

  async getMyItems(query: { type?: 'lost' | 'found'; status?: string; page?: number; limit?: number } = {}): Promise<ItemsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/items/user/my-items?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch your items');
    }

    const data = await response.json();
    return {
      items: data.items.map(transformItem),
      pagination: data.pagination,
    };
  }
}

export const itemsService = new ItemsService();
