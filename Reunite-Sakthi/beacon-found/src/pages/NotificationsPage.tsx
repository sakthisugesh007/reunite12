import { dummyNotifications } from "@/lib/dummy-data";
import { Bell, TrendingUp, MessageSquare, CheckCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  match: TrendingUp,
  message: MessageSquare,
  claim: CheckCircle,
  system: Info,
};

const colorMap: Record<string, string> = {
  match: "bg-primary/10 text-primary",
  message: "bg-success/10 text-success",
  claim: "bg-warning/10 text-warning",
  system: "bg-secondary text-muted-foreground",
};

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Notifications</h2>
        <p className="text-muted-foreground text-sm mt-1">Stay updated on your items and claims</p>
      </div>

      <div className="space-y-3">
        {dummyNotifications.map((notif, i) => {
          const Icon = iconMap[notif.type] || Bell;
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`card-surface p-4 flex items-start gap-4 ${!notif.read ? "border-l-2 border-l-primary" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[notif.type]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
