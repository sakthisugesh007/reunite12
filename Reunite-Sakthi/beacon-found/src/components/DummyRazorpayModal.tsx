import { useMemo, useState } from "react";
import { CreditCard, Landmark, Loader2, ShieldCheck, Smartphone, X } from "lucide-react";
import { motion } from "framer-motion";

interface DummyRazorpayModalProps {
  itemTitle: string;
  reward: number;
  finderGets: number;
  commission: number;
  onClose: () => void;
  onConfirm: (details: { paymentMethod: string; transactionId: string }) => Promise<void>;
}

const paymentOptions = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Landmark },
];

const buildDummyTransactionId = () => `pay_${Math.random().toString(36).slice(2, 12)}${Date.now().toString().slice(-4)}`;

export function DummyRazorpayModal({
  itemTitle,
  reward,
  finderGets,
  commission,
  onClose,
  onConfirm,
}: DummyRazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);

  const orderId = useMemo(
    () => `order_${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  const handlePay = async () => {
    try {
      setProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      await onConfirm({
        paymentMethod: `dummy_razorpay_${selectedMethod}`,
        transactionId: buildDummyTransactionId(),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-[#072654] px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Dummy Razorpay</p>
              <h3 className="mt-2 text-2xl font-semibold">Complete Payment</h3>
              <p className="mt-1 text-sm text-white/70">{itemTitle}</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/60">Amount to pay</p>
                <p className="mt-1 text-3xl font-semibold">${reward.toFixed(2)}</p>
              </div>
              <div className="text-right text-xs text-white/70">
                <p>Order ID</p>
                <p className="mt-1 font-mono text-[11px] text-white/90">{orderId}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Dummy checkout summary
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Finder receives</span>
                <span className="font-medium text-success">${finderGets.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform commission</span>
                <span className="font-medium text-primary">${commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-semibold text-foreground">${reward.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-foreground">Choose payment method</p>
            <div className="grid grid-cols-3 gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedMethod === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedMethod(option.id)}
                    className={`rounded-2xl border p-3 text-center transition ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Icon className="mx-auto h-5 w-5" />
                    <p className="mt-2 text-xs font-medium">{option.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            This is a demo Razorpay-like payment flow for the project. No real payment will be charged.
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={processing} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium">
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={processing}
              className="flex-1 rounded-xl bg-[#3395ff] py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {processing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Pay with Dummy Razorpay"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
