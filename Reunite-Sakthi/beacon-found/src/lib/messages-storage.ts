export interface Conversation {
  id: string;
  itemId: string;
  itemTitle: string;
  itemOwner: string; // The person who posted the item (lost item owner)
  finder: string; // The person who clicked "I Found This"
  participants: string[]; // user names for display
  messages: Message[];
  claimStatus: "pending" | "verified" | "rejected" | "completed";
  reward: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const CONVERSATIONS_KEY = "reunite_conversations";

// Get all conversations from localStorage
export function getConversations(): Conversation[] {
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

// Get conversations for current user (where user is participant)
export function getMyConversations(): Conversation[] {
  const conversations = getConversations();
  return conversations.filter(c => c.participants.includes("You") || c.participants.includes("Finder"));
}

// Get conversation by ID
export function getConversationById(id: string): Conversation | undefined {
  return getConversations().find(c => c.id === id);
}

// Get conversation for specific item
export function getConversationByItem(itemId: string): Conversation | undefined {
  return getConversations().find(c => c.itemId === itemId);
}

// Start a new conversation (when someone clicks "I Found This")
export function startConversation(itemId: string, itemTitle: string, itemOwner: string, reward: number, finderName: string = "You"): Conversation {
  const conversations = getConversations();
  
  // Check if conversation already exists
  const existing = conversations.find(c => c.itemId === itemId);
  if (existing) return existing;
  
  const newConversation: Conversation = {
    id: Date.now().toString(),
    itemId,
    itemTitle,
    itemOwner,
    finder: finderName,
    participants: [finderName, itemOwner],
    messages: [{
      id: "1",
      senderId: "finder",
      senderName: finderName,
      text: `Hi! I believe I found your ${itemTitle}. Can you help me verify some details?`,
      timestamp: new Date().toISOString(),
      isOwn: true,
    }],
    claimStatus: "pending",
    reward,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  conversations.unshift(newConversation);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  return newConversation;
}

// Add message to conversation
export function addMessage(conversationId: string, text: string, senderName: string = "You", isOwn: boolean = true): Conversation | null {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index === -1) return null;
  
  const message: Message = {
    id: Date.now().toString(),
    senderId: isOwn ? "finder" : "owner",
    senderName,
    text,
    timestamp: new Date().toISOString(),
    isOwn,
  };
  
  conversations[index].messages.push(message);
  conversations[index].updatedAt = new Date().toISOString();
  
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  return conversations[index];
}

// Update claim status
export function updateClaimStatus(conversationId: string, status: Conversation["claimStatus"]): Conversation | null {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index === -1) return null;
  
  conversations[index].claimStatus = status;
  conversations[index].updatedAt = new Date().toISOString();
  
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  return conversations[index];
}

// Delete conversation
export function deleteConversation(id: string): boolean {
  const conversations = getConversations();
  const filtered = conversations.filter(c => c.id !== id);
  if (filtered.length === conversations.length) return false;
  
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
  return true;
}

// Format timestamp for display
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Clear all conversations
export function clearConversations(): void {
  localStorage.removeItem(CONVERSATIONS_KEY);
}
