import { useEffect, useState } from "react";
import { Users, Package, CreditCard, DollarSign, Percent, TrendingUp, Loader2, ShieldAlert, History, MessageSquare, Search, MapPin } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { adminService, type AdminItemsResponse, type AdminStatsResponse, type AdminTransactionsResponse } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null);
  const [transactionsData, setTransactionsData] = useState<AdminTransactionsResponse | null>(null);
  const [lostItemsData, setLostItemsData] = useState<AdminItemsResponse | null>(null);
  const [foundItemsData, setFoundItemsData] = useState<AdminItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!isAuthenticated || user?.role !== "admin") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [statsResponse, transactionsResponse, lostItemsResponse, foundItemsResponse] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getTransactions({ limit: 100 }),
          adminService.getItems({ type: "lost", limit: 100 }),
          adminService.getItems({ type: "found", limit: 100 }),
        ]);

        setStatsData(statsResponse);
        setTransactionsData(transactionsResponse);
        setLostItemsData(lostItemsResponse);
        setFoundItemsData(foundItemsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Login to access the admin dashboard.</p>
        <Link to="/?login=true" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Login
        </Link>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground font-medium">Admin access required.</p>
        <p className="text-muted-foreground mt-2">This page is available only for admin accounts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !statsData || !transactionsData || !lostItemsData || !foundItemsData) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-destructive">{error || "Failed to load admin dashboard"}</p>
      </div>
    );
  }

  const { stats, recentUsers, recentConversations } = statsData;
  const { transactions } = transactionsData;
  const lostItems = lostItemsData.items;
  const foundItems = foundItemsData.items;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Admin Panel</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage transactions, commission, and complete item histories</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="primary" />
        <StatCard title="Total Items" value={stats.totalItems} icon={Package} color="success" />
        <StatCard title="Transactions" value={stats.totalTransactions} icon={CreditCard} color="warning" />
        <StatCard title="Commission Earned" value={formatCurrency(stats.totalCommission)} icon={DollarSign} color="success" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Payment Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-xs text-muted-foreground uppercase">Total Rewards Paid</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRewards)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across {stats.totalTransactions} completed payments</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary uppercase">Platform Commission</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalCommission)}</p>
            <p className="text-xs text-muted-foreground mt-1">Tracked from successful payments only</p>
          </div>
          <div className="p-4 rounded-xl bg-success/10 border border-success/20">
            <p className="text-xs text-success uppercase">Finder Payouts</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalFinderPayouts)}</p>
            <p className="text-xs text-muted-foreground mt-1">Transferred to successful finders</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-surface">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Recent Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Posts</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((entry) => (
                  <tr key={entry._id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground capitalize">{entry.role}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground tabular-nums">{entry.stats?.itemsPosted || 0}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-surface">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Recent Conversation History</h3>
          </div>
          <div className="divide-y divide-border">
            {recentConversations.map((conversation) => {
              const owner = conversation.participants.find((participant) => participant.role === "owner");
              const finder = conversation.participants.find((participant) => participant.role === "finder");

              return (
                <div key={conversation._id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{conversation.itemId?.title || "Conversation"}</p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {owner?.user?.name || "Unknown"} | Finder: {finder?.user?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-muted-foreground">{conversation.status}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(conversation.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-surface">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-success" />
          <h3 className="font-semibold text-foreground">All Transactions and Commission</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Item</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Owner</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Finder</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Reward</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Commission</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Finder Payout</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{transaction.itemTitle}</p>
                    <p className="text-xs text-muted-foreground capitalize">{transaction.itemType || "item"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{transaction.owner?.name || "Unknown"}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{transaction.finder?.name || "Unknown"}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground tabular-nums">{formatCurrency(transaction.reward)}</td>
                  <td className="px-5 py-3.5 text-sm text-primary font-medium tabular-nums">{formatCurrency(transaction.commission)}</td>
                  <td className="px-5 py-3.5 text-sm text-success font-medium tabular-nums">{formatCurrency(transaction.finderPayout)}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground capitalize">{transaction.status}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(transaction.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-surface">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">All Lost Items</h3>
          </div>
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Owner</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Reward</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {lostItems.map((item) => (
                  <tr key={item._id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.location || "Unknown location"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{item.postedBy?.name || "Unknown"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground tabular-nums">{item.reward ? formatCurrency(item.reward) : "-"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-surface">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Search className="w-4 h-4 text-success" />
            <h3 className="font-semibold text-foreground">All Found Items</h3>
          </div>
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Posted By</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Claimed By</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {foundItems.map((item) => (
                  <tr key={item._id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.location || "Unknown location"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{item.postedBy?.name || "Unknown"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{item.claimedBy?.name || "-"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground capitalize">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Platform Summary</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-muted-foreground">Active Items</p>
            <p className="text-xl font-semibold text-foreground mt-1">{stats.activeItems}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-muted-foreground">Completed Reunions</p>
            <p className="text-xl font-semibold text-foreground mt-1">{stats.completedReunions}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-muted-foreground">Open Conversations</p>
            <p className="text-xl font-semibold text-foreground mt-1">{stats.totalConversations}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
