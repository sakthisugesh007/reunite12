import { useEffect, useState } from "react";
import { Search, MapPin, Plus, ArrowRight, TrendingUp, Eye, CheckCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ItemCard } from "@/components/ItemCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { itemsService, type Item } from "@/services/itemsService";
import { chatSocket, type ConversationUpdatedPayload, type ItemUpdatedPayload } from "@/services/chatSocket";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStatsState {
  totalFound: number;
  totalLost: number;
  activeClaims: number;
  reunionsCompleted: number;
}

export default function DashboardPage() {
  const [otherItems, setOtherItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<DashboardStatsState>({
    totalFound: 0,
    totalLost: 0,
    activeClaims: 0,
    reunionsCompleted: 0,
  });
  const [feedFilter, setFeedFilter] = useState<"all" | "lost" | "found">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, token, user } = useAuth();
  const currentUserId = user?.id || (user as { _id?: string } | null)?._id || null;

  const loadDashboardData = async () => {
    if (!isAuthenticated || !currentUserId) {
      setOtherItems([]);
      setStats({
        totalFound: 0,
        totalLost: 0,
        activeClaims: 0,
        reunionsCompleted: 0,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const [
        feedResponse,
        foundStatsResponse,
        lostStatsResponse,
        claimedStatsResponse,
        verifiedStatsResponse,
        completedStatsResponse,
      ] = await Promise.all([
        itemsService.getItems({
          type: feedFilter === 'all' ? undefined : feedFilter,
          ownerScope: 'others',
          limit: 8
        }),
        itemsService.getItems({ type: 'found', status: 'active', limit: 1 }),
        itemsService.getItems({ type: 'lost', status: 'active', limit: 1 }),
        itemsService.getItems({ status: 'claimed', limit: 1 }),
        itemsService.getItems({ status: 'verified', limit: 1 }),
        itemsService.getItems({ status: 'completed', limit: 1 }),
      ]);
      
      setOtherItems(feedResponse.items);
      setStats({
        totalFound: foundStatsResponse.pagination.count,
        totalLost: lostStatsResponse.pagination.count,
        activeClaims: claimedStatsResponse.pagination.count + verifiedStatsResponse.pagination.count,
        reunionsCompleted: completedStatsResponse.pagination.count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUserId, feedFilter, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      chatSocket.disconnect();
      return;
    }

    chatSocket.connect(token);

    return () => {
      chatSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      return;
    }

    const handleItemUpdated = ({ item }: ItemUpdatedPayload) => {
      if (item.postedBy?._id === currentUserId) {
        loadDashboardData();
        return;
      }

      if (feedFilter !== "all" && item.type !== feedFilter) {
        loadDashboardData();
        return;
      }

      loadDashboardData();
    };

    const handleConversationUpdated = (_payload: ConversationUpdatedPayload) => {
      loadDashboardData();
    };

    chatSocket.onItemUpdated(handleItemUpdated);
    chatSocket.onConversationUpdated(handleConversationUpdated);

    return () => {
      chatSocket.offItemUpdated(handleItemUpdated);
      chatSocket.offConversationUpdated(handleConversationUpdated);
    };
  }, [currentUserId, feedFilter, isAuthenticated]);

  // Get recent items from other users (limited to 4)
  const recentItems = otherItems.slice(0, 4);

  // For now, we'll show a simple message for match suggestions
  // In a real app, this would use a matching algorithm
  const showMatchSuggestions = otherItems.length >= 2;
  const feedTitle =
    feedFilter === "all"
      ? "Recent Items from Others"
      : feedFilter === "lost"
        ? "Recent Lost Items from Others"
        : "Recent Found Items from Others";
  const emptyMessage =
    feedFilter === "all"
      ? "No items from other users yet."
      : feedFilter === "lost"
        ? "No lost items from other users yet."
        : "No found items from other users yet.";

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Items Found" value={stats.totalFound} icon={Search} color="success" trend="Live total" />
        <StatCard title="Items Lost" value={stats.totalLost} icon={MapPin} color="primary" trend="Live total" />
        <StatCard title="Active Claims" value={stats.activeClaims} icon={Eye} color="warning" />
        <StatCard title="Reunions" value={stats.reunionsCompleted} icon={CheckCircle} color="success" trend="Live total" />
      </div>

      {/* Quick Actions + Match Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card-surface p-6"
        >
          <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/found-items" className="flex items-center gap-3 p-3.5 rounded-xl bg-success/5 hover:bg-success/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Report Found Item</p>
                <p className="text-xs text-muted-foreground">Help someone find their belongings</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
            </Link>
            <Link to="/lost-items" className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Report Lost Item</p>
                <p className="text-xs text-muted-foreground">Tell us what you've lost</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </motion.div>

        {/* Auto Match Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="card-surface p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Match Suggestions</h2>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-3">
            {!isAuthenticated ? (
              <p className="text-muted-foreground text-center py-4">Login to see match suggestions.</p>
            ) : showMatchSuggestions ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">AI-powered match suggestions coming soon!</p>
                <p className="text-xs text-muted-foreground mt-2">We'll help you find potential matches between lost and found items.</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Not enough items for match suggestions yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-lg">{feedTitle}</h2>
          <div className="flex items-center gap-2">
            {(["all", "lost", "found"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFeedFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  feedFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter === "all" ? "All" : filter === "lost" ? "Lost" : "Found"}
              </button>
            ))}
          </div>
        </div>
        
        {!isAuthenticated ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please login to see items from other users.</p>
            <Link to="/?login=true" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              Login
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        ) : otherItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentItems.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
