import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
import { ItemCard } from "@/components/ItemCard";
import { motion } from "framer-motion";
import { ReportItemDialog } from "@/components/ReportItemDialog";
import { itemsService, type Item, type ItemsQuery } from "@/services/itemsService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const allTags = ["wallet", "phone", "bag", "jewelry", "electronics", "keys", "document", "accessories"];

export default function FoundItemsPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();

  // Load items from backend
  const loadItems = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query: ItemsQuery = {
        type: 'found',
        ownerScope: 'mine',
      };

      const response = await itemsService.getItems(query);

      const filteredItems = response.items.filter((item) => {
        const matchesSearch =
          !search ||
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.location.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase());

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some((tag) => item.tags.includes(tag));

        return matchesSearch && matchesTags;
      });

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  // Load items on mount and when filters change
  useEffect(() => {
    loadItems();
  }, [search, selectedTags, isAuthenticated]);

  // Reload items when dialog closes (after adding new item)
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      loadItems();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Found Items</h2>
          <p className="text-muted-foreground text-sm mt-1">Track the found items you reported</p>
        </div>
        <ReportItemDialog type="found" onOpenChange={handleDialogChange} />
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface p-4 space-y-4"
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <div className="col-span-full text-center py-16">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Login to view your found items.</p>
            <Link to="/?login=true" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              Login
            </Link>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-16">
            <p className="text-destructive">{error}</p>
            <button 
              onClick={loadItems}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">You haven’t reported any found items yet.</p>
          </div>
        ) : (
          items.map((item, i) => (
            <ItemCard key={item.id} item={item} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
