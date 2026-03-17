import { motion } from "framer-motion";
import type { Item } from "@/services/itemsService";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  lost: "bg-primary/10 text-primary",
  found: "bg-success/10 text-success",
  claimed: "bg-warning/10 text-warning",
  verified: "bg-success/10 text-success",
  completed: "bg-muted text-foreground",
};

export function ItemCard({ item, index = 0 }: { item: Item; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link to={`/item/${item.id}`}>
        <div className="group card-surface-hover p-3 cursor-pointer">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
            <img
              src={item.image}
              alt={item.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-reunite"
              loading="lazy"
            />
            <div className="absolute top-2.5 left-2.5 flex gap-1.5">
              <span className="glass-badge">{item.type}</span>
              {item.reward && (
                <span className="glass-badge text-primary">${item.reward}</span>
              )}
            </div>
            <div className="absolute top-2.5 right-2.5">
              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${statusColors[item.status]}`}>
                {item.status}
              </span>
            </div>
          </div>
          <div className="mt-3 px-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-foreground leading-tight text-sm">{item.title}</h3>
              <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap tabular-nums">
                {item.date}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center mt-2.5 text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="text-xs truncate">{item.location}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
