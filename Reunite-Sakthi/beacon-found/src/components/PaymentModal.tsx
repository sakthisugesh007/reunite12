import { motion } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import type { Item } from "@/lib/dummy-data";
import { useState } from "react";

interface PaymentModalProps {
  item: Item;
  onClose: () => void;
}

export function PaymentModal({ item, onClose }: PaymentModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const reward = item.reward || 25;
  const fee = Math.round(reward * 0.1);
  const total = reward + fee;

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-surface p-8 max-w-sm w-full mx-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Reunion confirmed.</h3>
          <p className="text-muted-foreground text-sm mt-2">Great work. A QR code has been sent for handoff verification.</p>
          <button onClick={onClose} className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-surface max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Payment Summary</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 bg-secondary/50">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item</span>
              <span className="text-foreground font-medium">{item.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Finder Reward</span>
              <span className="text-foreground tabular-nums">${reward.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee (10%)</span>
              <span className="text-foreground tabular-nums">${fee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-semibold text-primary text-lg tabular-nums">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Confirm Payment
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Payment is held in escrow until handoff is verified
          </p>
        </div>
      </motion.div>
    </div>
  );
}
