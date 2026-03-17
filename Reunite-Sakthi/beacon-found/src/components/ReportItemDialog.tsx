import { useState } from "react";
import { Plus, MapPin, X, Image, Tag, Search, DollarSign, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { itemsService, type CreateItemData } from "@/services/itemsService";
import { useAuth } from "@/contexts/AuthContext";
import { geocodingService } from "@/services/geocodingService";

const allCategories = ["electronics", "jewelry", "documents", "clothing", "accessories", "bags", "keys", "pets", "others"];
const allTags = ["wallet", "phone", "bag", "jewelry", "electronics", "keys", "document", "accessories", "clothing", "pet"];

interface ReportItemDialogProps {
  type: "lost" | "found";
  onOpenChange?: (open: boolean) => void;
}

export function ReportItemDialog({ type, onOpenChange }: ReportItemDialogProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reward, setReward] = useState("");
  const [loading, setLoading] = useState(false);

  const isLost = type === "lost";

  const handleDialogChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please login to report an item", variant: "destructive" });
      return;
    }

    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    if (!category.trim()) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    if (selectedTags.length === 0) {
      toast({ title: "Select at least one tag", variant: "destructive" });
      return;
    }
    if (!location.trim()) {
      toast({ title: "Location is required", variant: "destructive" });
      return;
    }
    if (isLost && (!reward || parseFloat(reward) < 10)) {
      toast({ title: "Reward must be at least $10", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      let resolvedCoordinates = coordinates;

      if (!resolvedCoordinates && location.trim()) {
        const geocodedLocation = await geocodingService.geocode(location.trim());

        if (geocodedLocation) {
          resolvedCoordinates = {
            latitude: geocodedLocation.latitude,
            longitude: geocodedLocation.longitude,
          };
          setCoordinates(resolvedCoordinates);
        }
      }
      
      const itemData: CreateItemData = {
        title: title.trim(),
        description: description.trim(),
        type: isLost ? "lost" : "found",
        category: category.trim(),
        location: location.trim(),
        coordinates: resolvedCoordinates || undefined,
        images: imagePreview
          ? [{
              url: imagePreview,
              isPrimary: true,
            }]
          : [],
        tags: selectedTags,
        reward: isLost ? parseFloat(reward) : undefined,
        dateLost: isLost ? new Date().toISOString() : undefined,
        dateFound: !isLost ? new Date().toISOString() : undefined,
      };

      await itemsService.createItem(itemData);

      toast({
        title: `${isLost ? "Lost" : "Found"} item reported successfully!`,
        description: "Your item has been posted and is now visible to others.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setSelectedTags([]);
      setLocation("");
      setCoordinates(null);
      setImagePreview(null);
      setReward("");
      
      handleDialogChange(false);
    } catch (error) {
      toast({
        title: "Failed to report item",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCoordinates(coords);
          setLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
          toast({ title: "Location captured!" });
        },
        () => {
          toast({ title: "Could not get location", variant: "destructive" });
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Report {isLost ? "Lost" : "Found"} Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isLost ? (
              <MapPin className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-success" />
            )}
            Report {isLost ? "Lost" : "Found"} Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="item-title">Item Title</Label>
            <Input
              id="item-title"
              placeholder={isLost ? "e.g. Black leather wallet" : "e.g. Found a phone at the park"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              placeholder={
                isLost
                  ? "Describe your lost item in detail — color, brand, identifying marks..."
                  : "Describe the item you found — where exactly, condition, any identifiers..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Category
            </Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            >
              <option value="">Select a category</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
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
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="item-location" className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {isLost ? "Last Seen Location" : "Where Found"}
            </Label>
            <div className="flex gap-2">
              <Input
                id="item-location"
                placeholder="e.g. Central Park, New York"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
                title="Use current location"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {coordinates && (
              <p className="text-xs text-muted-foreground">
                Coordinates: <span className="text-primary">{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>
              </p>
            )}
            {!coordinates && location.trim() && (
              <p className="text-xs text-muted-foreground">
                Enter a real place name or use current location to enable the live map automatically.
              </p>
            )}
          </div>

          {/* Reward (REQUIRED for lost items) */}
          {isLost && (
            <div className="space-y-2">
              <Label htmlFor="reward" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Reward Amount (Required)
              </Label>
              <Input
                id="reward"
                type="number"
                placeholder="Minimum $10"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                min="10"
                step="1"
                required
              />
              {reward && parseFloat(reward) > 0 && (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Info className="w-3 h-3" />
                    <span>Reward Breakdown</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Reward:</span>
                      <span className="font-medium">${parseFloat(reward).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Admin Commission (30%):</span>
                      <span className="font-medium text-primary">-${(parseFloat(reward) * 0.30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1 mt-1">
                      <span className="font-medium">Finder Receives:</span>
                      <span className="font-bold text-success">${(parseFloat(reward) * 0.70).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Image {!isLost && "(recommended)"}
              {isLost && "(optional)"}
            </Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer bg-secondary/30">
                <Image className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload an image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
