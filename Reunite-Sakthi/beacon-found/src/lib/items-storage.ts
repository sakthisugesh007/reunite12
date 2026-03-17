import type { Item } from "@/lib/dummy-data";
import { dummyItems } from "@/lib/dummy-data";

export type { Item };

const STORAGE_KEY = "reunite_items";

// Initialize localStorage with dummy data if empty
export function initializeItems(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyItems));
  }
}

// Get all items from localStorage
export function getItems(): Item[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    initializeItems();
    return dummyItems;
  }
  return JSON.parse(stored);
}

// Get items by type (lost or found)
export function getItemsByType(type: "lost" | "found"): Item[] {
  return getItems().filter((item) => item.type === type);
}

// Get recent items (newest first)
export function getRecentItems(limit: number = 10): Item[] {
  return getItems()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Add a new item to localStorage
export function addItem(item: Omit<Item, "id" | "date" | "status">): Item {
  const items = getItems();
  const newItem: Item = {
    ...item,
    id: Date.now().toString(),
    date: new Date().toISOString(),
    status: item.type === "lost" ? "lost" : "found",
  };
  items.unshift(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return newItem;
}

// Update an existing item
export function updateItem(id: string, updates: Partial<Item>): Item | null {
  const items = getItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items[index];
}

// Delete an item
export function deleteItem(id: string): boolean {
  const items = getItems();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Get item by ID
export function getItemById(id: string): Item | undefined {
  return getItems().find((item) => item.id === id);
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Clear all items (reset to dummy data)
export function resetItems(): void {
  localStorage.removeItem(STORAGE_KEY);
  initializeItems();
}
