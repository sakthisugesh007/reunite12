import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Tag, Calendar, User, DollarSign, MessageSquare, CheckCircle, Search, Loader2, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { PaymentModal } from "@/components/PaymentModal";
import { itemsService, type Item } from "@/services/itemsService";
import { conversationsService } from "@/services/conversationsService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MapView } from "@/components/MapView";
import { geocodingService } from "@/services/geocodingService";

const statusColors: Record<string, string> = {
  lost: "bg-primary/10 text-primary",
  found: "bg-success/10 text-success",
  claimed: "bg-warning/10 text-warning",
  verified: "bg-success/10 text-success",
  completed: "bg-muted text-foreground",
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);
  const [itemConversationId, setItemConversationId] = useState<string | null>(null);
  const [resolvedMapCoordinates, setResolvedMapCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingSelfFound, setMarkingSelfFound] = useState(false);
  const [error, setError] = useState("");
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        
        // Fetch item from backend
        const response = await itemsService.getItem(id);
        setItem(response.item);

        const hasNativeCoordinates = response.item.coordinates[0] !== 0 || response.item.coordinates[1] !== 0;
        if (hasNativeCoordinates) {
          setResolvedMapCoordinates([response.item.coordinates[1], response.item.coordinates[0]]);
        } else if (response.item.location.trim()) {
          const geocodedLocation = await geocodingService.geocode(response.item.location.trim());
          if (geocodedLocation) {
            setResolvedMapCoordinates([geocodedLocation.latitude, geocodedLocation.longitude]);
          } else {
            setResolvedMapCoordinates(null);
          }
        } else {
          setResolvedMapCoordinates(null);
        }
        
        if (isAuthenticated && user) {
          const conversations = await conversationsService.getConversations(user.id);
          const existingConversation = conversations.find((conversation) => conversation.itemId === id);
          setHasConversation(!!existingConversation);
          setItemConversationId(existingConversation?.id || null);
        } else {
          setHasConversation(false);
          setItemConversationId(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, isAuthenticated, user]);

  const handleIFoundThis = async () => {
    if (!item || !user) return;

    try {
      const conversation = await conversationsService.startConversation(item.id, user.id);
      setHasConversation(true);
      setItemConversationId(conversation.id);

      toast({
        title: "Claim started!",
        description: "You can now chat with the owner to verify details.",
      });

      navigate(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      toast({
        title: "Failed to start conversation",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleGoToChat = () => {
    if (itemConversationId) {
      navigate(`/messages?conversation=${itemConversationId}`);
    }
  };

  const handleMarkAsSelfFound = async () => {
    if (!item) return;

    try {
      setMarkingSelfFound(true);
      const response = await itemsService.markItemAsSelfFound(item.id);
      setItem(response.item);

      toast({
        title: "Item closed",
        description: "This lost item is now marked as found by you.",
      });
    } catch (err) {
      toast({
        title: "Failed to update item",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setMarkingSelfFound(false);
    }
  };

  const handleClaimItem = async () => {
    if (!item) return;
    
    if (item.postedBy.id === user?.id) {
      toast({ 
        title: "This is your item!", 
        description: "You can't claim your own item.",
        variant: "destructive" 
      });
      return;
    }
    
    // Update item status to claimed using backend API
    try {
      await itemsService.claimItem(item.id);
      setItem({ ...item, status: 'claimed' });
      setShowPayment(true);
      
      toast({
        title: "Item claimed!",
        description: "Complete the payment to finalize.",
      });
    } catch (err) {
      toast({
        title: "Failed to claim item",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Item not found.</p>
        <Link to="/dashboard" className="text-primary text-sm hover:underline mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const isMyItem = item.postedBy.id === user?.id;
  const isLostItem = item.type === "lost";
  const isFoundItem = item.type === "found";
  const mapCoordinates = resolvedMapCoordinates;

  const handleOpenNavigation = () => {
    if (!mapCoordinates) return;

    const [latitude, longitude] = mapCoordinates;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="card-surface p-3"
        >
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-secondary">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="glass-badge uppercase">{item.type}</span>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${statusColors[item.status]}`}>
                {item.status}
              </span>
            </div>
            {item.reward && (
              <div className="absolute top-3 right-3 glass-badge text-primary">
                ${item.reward} Reward
              </div>
            )}
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-4"
        >
          <div className="card-surface p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{item.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{item.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{item.date}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">Posted by {item.postedBy.name}</span>
              </div>
              {item.reward && (
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-primary font-semibold">${item.reward} Reward</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {item.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 text-xs font-medium text-muted-foreground bg-secondary rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* For Lost Items - "I Found This" button */}
            {!isMyItem && isLostItem && item.status === "lost" && (
              <button
                onClick={handleIFoundThis}
                className="w-full py-3 px-4 bg-success text-success-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                I Found This Item
              </button>
            )}

            {/* For Found Items - "This is Mine" button */}
            {!isMyItem && isFoundItem && item.status === "found" && (
              <button
                onClick={handleClaimItem}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                This is My Item
              </button>
            )}

            {/* Chat Button - Show if conversation exists or it's user's item */}
            {(hasConversation || isMyItem) && (
              <button
                onClick={handleGoToChat}
                className="w-full py-3 px-4 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {isMyItem ? "View Messages" : "Chat with Owner"}
              </button>
            )}

            {/* Status Messages */}
            {item.status === "claimed" && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning font-medium">This item has been claimed</p>
                <p className="text-xs text-muted-foreground mt-1">Waiting for verification and handoff</p>
              </div>
            )}

            {isMyItem && isLostItem && item.status === "lost" && (
              <button
                onClick={handleMarkAsSelfFound}
                disabled={markingSelfFound}
                className="w-full py-3 px-4 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {markingSelfFound ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                I Found It Myself
              </button>
            )}

            {isMyItem && isLostItem && item.status === "completed" && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-sm text-success font-medium">You found this item yourself</p>
                <p className="text-xs text-muted-foreground mt-1">This lost-item case has been closed.</p>
              </div>
            )}

            {isMyItem && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary font-medium">This is your posted item</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isLostItem && item.status === "lost"
                    ? "If you recover it yourself, use the button above to close the case."
                    : "You'll be notified when someone claims it"}
                </p>
              </div>
            )}
          </div>

          {/* Location Info */}
          <div className="card-surface p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-medium text-foreground">Live Location Map</p>
                  <p className="text-xs text-muted-foreground">Use this map to view the item location and open turn-by-turn navigation.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNavigation}
                  disabled={!mapCoordinates}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Navigate
                </button>
              </div>

              <div className="rounded-xl overflow-hidden h-[260px] bg-secondary">
                {mapCoordinates ? (
                  <MapView center={mapCoordinates} marker={mapCoordinates} zoom={15} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center px-6">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Live map is not available for this item yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use a real location name or current location while posting the item to enable navigation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <p className="text-sm text-foreground">{item.location}</p>
                {mapCoordinates && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {mapCoordinates[0].toFixed(4)}, {mapCoordinates[1].toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {showPayment && <PaymentModal item={item} onClose={() => setShowPayment(false)} />}
    </div>
  );
}
