import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { User, Package, CheckCircle, DollarSign, Shield, Loader2, Activity, TrendingUp, Receipt, PieChart as PieChartIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { itemsService, type Item } from "@/services/itemsService";
import { adminService, type AdminItemsResponse, type AdminStatsResponse, type AdminTransactionsResponse } from "@/services/adminService";
import { ItemCard } from "@/components/ItemCard";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const adminChartConfig = {
  transactions: { label: "Transactions", color: "hsl(var(--primary))" },
  commission: { label: "Commission", color: "hsl(var(--success))" },
  lost: { label: "Lost Items", color: "hsl(var(--primary))" },
  found: { label: "Found Items", color: "hsl(var(--success))" },
  active: { label: "Active", color: "#f59e0b" },
  claimed: { label: "Claimed", color: "#60a5fa" },
  verified: { label: "Verified", color: "#34d399" },
  completed: { label: "Completed", color: "#10b981" },
} as const;

const statusColors: Record<string, string> = {
  active: "#f59e0b",
  claimed: "#60a5fa",
  verified: "#34d399",
  completed: "#10b981",
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const monthLabel = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", { month: "short" });

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsResponse | null>(null);
  const [adminTransactions, setAdminTransactions] = useState<AdminTransactionsResponse | null>(null);
  const [adminLostItems, setAdminLostItems] = useState<AdminItemsResponse | null>(null);
  const [adminFoundItems, setAdminFoundItems] = useState<AdminItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        if (user.role === "admin") {
          const [statsResponse, transactionsResponse, lostItemsResponse, foundItemsResponse] = await Promise.all([
            adminService.getDashboardStats(),
            adminService.getTransactions({ limit: 100 }),
            adminService.getItems({ type: "lost", limit: 100 }),
            adminService.getItems({ type: "found", limit: 100 }),
          ]);

          setAdminStats(statsResponse);
          setAdminTransactions(transactionsResponse);
          setAdminLostItems(lostItemsResponse);
          setAdminFoundItems(foundItemsResponse);
          setMyItems([]);
        } else {
          const [lostResponse, foundResponse] = await Promise.all([
            itemsService.getItems({ type: "lost", ownerScope: "mine", limit: 6 }),
            itemsService.getItems({ type: "found", ownerScope: "mine", limit: 6 }),
          ]);

          setMyItems([...lostResponse.items, ...foundResponse.items].slice(0, 6));
          setAdminStats(null);
          setAdminTransactions(null);
          setAdminLostItems(null);
          setAdminFoundItems(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, user]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const adminTransactionTrend = useMemo(() => {
    if (!adminTransactions) return [];

    const grouped = adminTransactions.transactions.reduce<Record<string, { month: string; transactions: number; commission: number }>>((acc, transaction) => {
      const month = monthLabel(transaction.paidAt);
      if (!acc[month]) {
        acc[month] = { month, transactions: 0, commission: 0 };
      }

      acc[month].transactions += 1;
      acc[month].commission += transaction.commission;
      return acc;
    }, {});

    return Object.values(grouped).slice(-6);
  }, [adminTransactions]);

  const adminItemMix = useMemo(() => {
    const lostCount = adminLostItems?.items.length || 0;
    const foundCount = adminFoundItems?.items.length || 0;

    return [
      { name: "lost", value: lostCount, fill: "var(--color-lost)" },
      { name: "found", value: foundCount, fill: "var(--color-found)" },
    ];
  }, [adminLostItems, adminFoundItems]);

  const adminStatusBreakdown = useMemo(() => {
    const allItems = [...(adminLostItems?.items || []), ...(adminFoundItems?.items || [])];
    const counts = allItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return ["active", "claimed", "verified", "completed"]
      .filter((status) => counts[status])
      .map((status) => ({
        status,
        total: counts[status],
        fill: statusColors[status] || "#94a3b8",
      }));
  }, [adminLostItems, adminFoundItems]);

  const topRecoveries = useMemo(() => {
    if (!adminTransactions) return [];
    return [...adminTransactions.transactions]
      .sort((a, b) => b.reward - a.reward)
      .slice(0, 5);
  }, [adminTransactions]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Login to view your profile.</p>
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

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (user.role === "admin" && adminStats && adminTransactions && adminLostItems && adminFoundItems) {
    const recoveryRate = adminStats.stats.totalItems > 0
      ? Math.round((adminStats.stats.completedReunions / adminStats.stats.totalItems) * 100)
      : 0;
    const avgCommission = adminStats.stats.totalTransactions > 0
      ? adminStats.stats.totalCommission / adminStats.stats.totalTransactions
      : 0;

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-surface p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-semibold text-primary">{initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-lg">
                  Admin
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
              <p className="text-muted-foreground text-sm mt-2">
                Platform command center for commissions, recoveries, item flow, and operational health.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
              <div className="rounded-xl bg-secondary px-4 py-3">
                <p className="text-xs text-muted-foreground">Recovery Rate</p>
                <p className="text-lg font-semibold text-foreground">{recoveryRate}%</p>
              </div>
              <div className="rounded-xl bg-secondary px-4 py-3">
                <p className="text-xs text-muted-foreground">Avg Commission</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(avgCommission)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{adminStats.stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Registered Users</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{adminStats.stats.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">Completed Payments</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(adminStats.stats.totalCommission)}</p>
              <p className="text-xs text-muted-foreground">Commission Earned</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{adminStats.stats.activeItems}</p>
              <p className="text-xs text-muted-foreground">Active Cases</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Payment Trend</h3>
            </div>
            <ChartContainer
              config={adminChartConfig}
              className="h-[280px] w-full"
            >
              <AreaChart data={adminTransactionTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area type="monotone" dataKey="transactions" stroke="var(--color-transactions)" fill="var(--color-transactions)" fillOpacity={0.18} />
                <Area type="monotone" dataKey="commission" stroke="var(--color-commission)" fill="var(--color-commission)" fillOpacity={0.12} />
              </AreaChart>
            </ChartContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Item Mix</h3>
            </div>
            <ChartContainer config={adminChartConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie data={adminItemMix} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={4}>
                  {adminItemMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Case Status Breakdown</h3>
            </div>
            <ChartContainer config={adminChartConfig} className="h-[280px] w-full">
              <BarChart data={adminStatusBreakdown}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                  {adminStatusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-surface p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-foreground">Top Reward Recoveries</h3>
            </div>
            <div className="space-y-3">
              {topRecoveries.map((transaction) => (
                <div key={transaction.id} className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{transaction.itemTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.finder?.name || "Finder"} reunited it for {transaction.owner?.name || "Owner"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(transaction.reward)}</p>
                      <p className="text-xs text-primary">Commission {formatCurrency(transaction.commission)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const itemsPosted = user.stats?.itemsPosted || 0;
  const itemsRecovered = user.stats?.itemsRecovered || 0;
  const rewardsPaid = user.stats?.totalRewardsPaid || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-primary">{initials}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-lg">
                {user.role}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{itemsPosted}</p>
            <p className="text-xs text-muted-foreground">Items Posted</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{itemsRecovered}</p>
            <p className="text-xs text-muted-foreground">Items Recovered</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(rewardsPaid)}</p>
            <p className="text-xs text-muted-foreground">Rewards Paid</p>
          </div>
        </motion.div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-4">Your Recent Items</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myItems.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
        {myItems.length === 0 && (
          <div className="card-surface p-8 text-center text-muted-foreground">
            No items posted yet.
          </div>
        )}
      </div>
    </div>
  );
}
