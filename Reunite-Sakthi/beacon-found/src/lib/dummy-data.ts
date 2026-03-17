export interface Item {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  location: string;
  coordinates: [number, number];
  date: string;
  status: "lost" | "found" | "claimed" | "verified";
  type: "lost" | "found";
  postedBy: string;
  reward?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: "finder" | "loser";
  itemsPosted: number;
  claimsResolved: number;
  earnings: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "match" | "message" | "claim" | "system";
  read: boolean;
  timestamp: string;
}

export const dummyItems: Item[] = [
  {
    id: "1",
    title: "Black Leather Wallet",
    description: "Found a black leather wallet near Central Park entrance. Contains several cards. Contact to verify ownership.",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=500&fit=crop",
    tags: ["wallet", "leather", "black"],
    location: "Central Park, New York",
    coordinates: [40.7829, -73.9654],
    date: "2 hours ago",
    status: "found",
    type: "found",
    postedBy: "Alex M.",
    reward: 50,
  },
  {
    id: "2",
    title: "iPhone 15 Pro Max",
    description: "Lost my iPhone 15 Pro Max with a dark blue case near Times Square. Has a crack on the top right corner.",
    image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=500&fit=crop",
    tags: ["phone", "iphone", "electronics"],
    location: "Times Square, New York",
    coordinates: [40.758, -73.9855],
    date: "5 hours ago",
    status: "lost",
    type: "lost",
    postedBy: "Sarah K.",
    reward: 100,
  },
  {
    id: "3",
    title: "Brown Canvas Backpack",
    description: "Found a brown canvas backpack on the subway. Contains books and a laptop charger.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop",
    tags: ["bag", "backpack", "brown"],
    location: "Subway Line 4, NYC",
    coordinates: [40.7484, -73.9857],
    date: "1 day ago",
    status: "found",
    type: "found",
    postedBy: "Mike R.",
  },
  {
    id: "4",
    title: "Gold Wedding Ring",
    description: "Lost my gold wedding ring at the gym. It has an engraving inside. Very sentimental value.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=500&fit=crop",
    tags: ["jewelry", "ring", "gold"],
    location: "Planet Fitness, Brooklyn",
    coordinates: [40.6782, -73.9442],
    date: "3 days ago",
    status: "lost",
    type: "lost",
    postedBy: "David L.",
    reward: 200,
  },
  {
    id: "5",
    title: "Ray-Ban Sunglasses",
    description: "Found Ray-Ban Wayfarer sunglasses at the beach. Black frame, slightly scratched on the left lens.",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=500&fit=crop",
    tags: ["sunglasses", "accessories", "black"],
    location: "Coney Island Beach",
    coordinates: [40.5749, -73.9706],
    date: "1 week ago",
    status: "claimed",
    type: "found",
    postedBy: "Jessica T.",
  },
  {
    id: "6",
    title: "MacBook Air M2",
    description: "Left my MacBook Air at a coffee shop. Silver, has a sticker on the back. Very important work files.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=500&fit=crop",
    tags: ["laptop", "electronics", "apple"],
    location: "Blue Bottle Coffee, Manhattan",
    coordinates: [40.7421, -74.0018],
    date: "2 days ago",
    status: "lost",
    type: "lost",
    postedBy: "Chris P.",
    reward: 150,
  },
  {
    id: "7",
    title: "Car Keys (Toyota)",
    description: "Found a set of Toyota car keys with a red keychain near the parking garage entrance.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=500&fit=crop",
    tags: ["keys", "car", "toyota"],
    location: "Parking Garage, 5th Ave",
    coordinates: [40.7549, -73.984],
    date: "6 hours ago",
    status: "found",
    type: "found",
    postedBy: "Nina S.",
  },
  {
    id: "8",
    title: "Passport (UK)",
    description: "Found a UK passport at JFK Terminal 4. Please contact with full name to verify.",
    image: "https://images.unsplash.com/photo-1544965838-54ef8406acac?w=400&h=500&fit=crop",
    tags: ["document", "passport", "id"],
    location: "JFK Airport, Terminal 4",
    coordinates: [40.6413, -73.7781],
    date: "12 hours ago",
    status: "found",
    type: "found",
    postedBy: "Airport Staff",
    reward: 25,
  },
];

export const dummyMessages: Message[] = [
  { id: "1", senderId: "user1", senderName: "Alex M.", text: "Hi! I believe this might be my wallet. I lost it near the park entrance.", timestamp: "10:30 AM", isOwn: false },
  { id: "2", senderId: "user2", senderName: "You", text: "Hello! Can you describe the wallet and its contents to verify?", timestamp: "10:32 AM", isOwn: true },
  { id: "3", senderId: "user1", senderName: "Alex M.", text: "It's a black leather bifold wallet. Should have a driver's license and three credit cards inside.", timestamp: "10:33 AM", isOwn: false },
  { id: "4", senderId: "user2", senderName: "You", text: "That matches! Can you tell me the name on the license?", timestamp: "10:35 AM", isOwn: true },
  { id: "5", senderId: "user1", senderName: "Alex M.", text: "Alexander Mitchell. There's also a photo of my dog behind the ID slot.", timestamp: "10:36 AM", isOwn: false },
  { id: "6", senderId: "user2", senderName: "You", text: "✅ Verified! That's correct. Let's arrange a meetup for the handoff.", timestamp: "10:38 AM", isOwn: true },
];

export const dummyUser: User = {
  id: "user2",
  name: "Jordan Rivera",
  email: "jordan@example.com",
  initials: "JR",
  role: "finder",
  itemsPosted: 12,
  claimsResolved: 8,
  earnings: 475,
};

export const dummyNotifications: Notification[] = [
  { id: "1", title: "New Match Found!", message: '95% match detected for "Black Leather Wallet"', type: "match", read: false, timestamp: "2 min ago" },
  { id: "2", title: "New Message", message: "Alex M. sent you a verification message", type: "message", read: false, timestamp: "10 min ago" },
  { id: "3", title: "Claim Approved", message: "Your claim for Ray-Ban Sunglasses was approved", type: "claim", read: true, timestamp: "1 hour ago" },
  { id: "4", title: "Welcome!", message: "Thanks for joining Reunite. Start by posting your first item.", type: "system", read: true, timestamp: "1 day ago" },
];

export const dashboardStats = {
  totalFound: 1284,
  totalLost: 967,
  activeClaims: 43,
  reunionsCompleted: 856,
};

export const adminStats = {
  totalUsers: 5280,
  totalItems: 2251,
  totalTransactions: 856,
  totalCommission: 4280,
  recentUsers: [
    { id: "1", name: "Alex Mitchell", email: "alex@email.com", role: "finder", joined: "Mar 15, 2026", items: 5 },
    { id: "2", name: "Sarah Kim", email: "sarah@email.com", role: "loser", joined: "Mar 14, 2026", items: 2 },
    { id: "3", name: "Mike Ross", email: "mike@email.com", role: "finder", joined: "Mar 13, 2026", items: 8 },
    { id: "4", name: "Jessica Tang", email: "jessica@email.com", role: "finder", joined: "Mar 12, 2026", items: 3 },
    { id: "5", name: "David Lee", email: "david@email.com", role: "loser", joined: "Mar 11, 2026", items: 1 },
  ],
  recentTransactions: [
    { id: "t1", item: "Black Leather Wallet", finder: "Alex M.", owner: "Jordan R.", amount: 50, commission: 5, date: "Mar 15" },
    { id: "t2", item: "iPhone 15 Pro Max", finder: "Nina S.", owner: "Sarah K.", amount: 100, commission: 10, date: "Mar 14" },
    { id: "t3", item: "Gold Wedding Ring", finder: "Mike R.", owner: "David L.", amount: 200, commission: 20, date: "Mar 13" },
  ],
};
