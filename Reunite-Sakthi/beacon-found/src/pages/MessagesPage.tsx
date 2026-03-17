import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Send, CheckCircle, Circle, ArrowLeft, Package, User, CreditCard, Wallet, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { DummyRazorpayModal } from "@/components/DummyRazorpayModal";
import { chatSocket, type ConversationUpdatedPayload } from "@/services/chatSocket";
import { conversationsService, transformConversation, type Conversation } from "@/services/conversationsService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig = {
  pending: { label: "Pending Verification", color: "text-warning", bg: "bg-warning/10" },
  verified: { label: "Verified - Awaiting Payment", color: "text-primary", bg: "bg-primary/10" },
  rejected: { label: "Rejected", color: "text-destructive", bg: "bg-destructive/10" },
  completed: { label: "Completed", color: "text-success", bg: "bg-success/10" },
};

const formatMessageTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const { user, token, isAuthenticated } = useAuth();
  const currentUserId = user?.id || (user as { _id?: string } | null)?._id || null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const upsertConversation = (incomingConversation: Conversation) => {
    setConversations((current) => {
      const filtered = current.filter((conversation) => conversation.id !== incomingConversation.id);
      return [incomingConversation, ...filtered].sort(
        (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
      );
    });
  };

  const loadConversations = async (selectedConversationId?: string | null) => {
    if (!isAuthenticated || !user || !currentUserId) {
      setConversations([]);
      setActiveConversation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const allConversations = await conversationsService.getConversations(currentUserId);
      setConversations(allConversations);

      if (selectedConversationId) {
        const selectedConversation = await conversationsService.getConversation(selectedConversationId, currentUserId);
        setActiveConversation(selectedConversation);
      } else {
        setActiveConversation(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(conversationId);
  }, [conversationId, currentUserId, isAuthenticated, user]);

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
    if (!activeConversation) {
      return;
    }

    chatSocket.joinConversation(activeConversation.id);

    return () => {
      chatSocket.leaveConversation(activeConversation.id);
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const handleConversationUpdated = ({ type, conversation }: ConversationUpdatedPayload) => {
      const transformedConversation = transformConversation(conversation, currentUserId);

      if (type === "archived") {
        setConversations((current) =>
          current.filter((existingConversation) => existingConversation.id !== transformedConversation.id),
        );

        setActiveConversation((current) =>
          current?.id === transformedConversation.id ? null : current,
        );

        return;
      }

      upsertConversation(transformedConversation);

      setActiveConversation((current) =>
        current?.id === transformedConversation.id ? transformedConversation : current,
      );
    };

    chatSocket.onConversationUpdated(handleConversationUpdated);

    return () => {
      chatSocket.offConversationUpdated(handleConversationUpdated);
    };
  }, [currentUserId]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation || !currentUserId) return;

    try {
      setSending(true);
      const updatedConversation = await conversationsService.sendMessage(activeConversation.id, input.trim(), currentUserId);
      setActiveConversation(updatedConversation);
      upsertConversation(updatedConversation);
      setInput("");
    } catch (err) {
      toast({
        title: "Failed to send message",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!activeConversation || !currentUserId) return;

    try {
      const updatedConversation = await conversationsService.verifyConversation(activeConversation.id, currentUserId);
      setActiveConversation(updatedConversation);
      upsertConversation(updatedConversation);

      toast({
        title: "Owner verified!",
        description: "The lost-item owner has been verified. They can now complete payment.",
      });
    } catch (err) {
      toast({
        title: "Failed to verify claim",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const processPayment = async (paymentDetails?: { paymentMethod: string; transactionId: string }) => {
    if (!activeConversation || !currentUserId) return;

    try {
      const updatedConversation = await conversationsService.completeConversation(
        activeConversation.id,
        currentUserId,
        paymentDetails,
      );
      setActiveConversation(updatedConversation);
      upsertConversation(updatedConversation);
      setShowPayment(false);

      toast({
        title: "Payment Successful!",
        description: `Reunion completed for ${updatedConversation.itemTitle}.`,
      });
    } catch (err) {
      toast({
        title: "Failed to complete payment",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const finderGets = useMemo(
    () => (activeConversation ? activeConversation.reward * 0.7 : 0),
    [activeConversation],
  );
  const commission = useMemo(
    () => (activeConversation ? activeConversation.reward * 0.3 : 0),
    [activeConversation],
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Login to view your messages.</p>
        <Link to="/?login=true" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Login
        </Link>
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
        <button onClick={() => loadConversations(conversationId)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Try Again
        </button>
      </div>
    );
  }

  if (!activeConversation) {
    return (
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Messages</h2>
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No messages yet.</p>
            <Link to="/dashboard" className="text-primary text-sm hover:underline mt-4 inline-block">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <Link key={conversation.id} to={`/messages?conversation=${conversation.id}`} className="block card-surface-hover p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                    {conversation.itemImage ? (
                      <img src={conversation.itemImage} alt={conversation.itemTitle} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{conversation.itemTitle}</h3>
                      <span className={`text-xs px-2 py-1 rounded-lg ${statusConfig[conversation.claimStatus].bg} ${statusConfig[conversation.claimStatus].color}`}>
                        {statusConfig[conversation.claimStatus].label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.messages[conversation.messages.length - 1]?.text || "No messages"}
                    </p>
                    {conversation.reward > 0 && (
                      <p className="text-xs text-primary mt-1">Reward: ${conversation.reward}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isOwner = activeConversation.isOwner;
  const isFinder = !isOwner;
  const canVerify = isFinder && activeConversation.claimStatus === "pending";
  const canPay = isOwner && activeConversation.claimStatus === "verified";
  const isCompleted = activeConversation.claimStatus === "completed";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card-surface overflow-hidden h-[calc(100vh-10rem)]">
        <div className="flex h-full flex-col lg:flex-row">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-5 h-full overflow-y-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <div className="mb-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary mb-3">
                <img src={activeConversation.itemImage} alt={activeConversation.itemTitle} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-medium text-sm">{activeConversation.itemTitle}</h3>
              {activeConversation.reward > 0 && (
                <p className="text-xs text-primary mt-1">Reward: ${activeConversation.reward}</p>
              )}
            </div>

            <div className={`p-3 rounded-xl ${statusConfig[activeConversation.claimStatus].bg} mb-3`}>
              <p className={`text-xs font-medium ${statusConfig[activeConversation.claimStatus].color}`}>
                {statusConfig[activeConversation.claimStatus].label}
              </p>
            </div>

            {isFinder ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase mb-2">Finder Actions</p>

                {canVerify && (
                  <button onClick={handleVerify} className="w-full py-2.5 px-3 bg-success text-success-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verify This Person
                  </button>
                )}

                {activeConversation.claimStatus === "pending" && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm text-warning">Waiting for you to verify the owner...</p>
                    <p className="text-xs text-muted-foreground mt-1">Confirm the claimant is the real owner before payment happens.</p>
                  </div>
                )}

                {activeConversation.claimStatus === "verified" && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary font-medium">Owner verified!</p>
                    <p className="text-xs text-muted-foreground mt-1">Waiting for the owner to pay ${activeConversation.reward.toFixed(2)}</p>
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Reward: ${activeConversation.reward}</p>
                      <p className="text-xs text-muted-foreground">Your payout: ${finderGets.toFixed(2)}</p>
                      <p className="text-xs text-primary">Platform fee: ${commission.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                    <Wallet className="w-5 h-5 text-success mx-auto mb-1" />
                    <p className="text-sm text-success font-medium">You received ${finderGets.toFixed(2)}!</p>
                    <p className="text-xs text-muted-foreground">Thank you for helping!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase mb-2">Owner Actions</p>

                {activeConversation.claimStatus === "pending" && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-sm text-warning">Waiting for finder verification...</p>
                    <p className="text-xs text-muted-foreground mt-1">The finder is checking whether you are the real owner.</p>
                  </div>
                )}

                {canPay && (
                  <button onClick={() => setShowPayment(true)} className="w-full py-2.5 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pay Finder (${activeConversation.reward})
                  </button>
                )}

                {activeConversation.claimStatus === "verified" && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-primary font-medium">Finder verified your claim!</p>
                    <p className="text-xs text-muted-foreground mt-1">You can now complete payment to finish the reunion.</p>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                    <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
                    <p className="text-sm text-success font-medium">Reunion Complete!</p>
                    <p className="text-xs text-muted-foreground">Payment processed</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium text-sm mb-2">Verification Tips</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Circle className="w-3 h-3" />
                  Ask about color/brand
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="w-3 h-3" />
                  Verify unique marks
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="w-3 h-3" />
                  Confirm contents
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="w-3 h-3" />
                  Meet in public place
                </li>
              </ul>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center px-5 py-3.5 border-b border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {isOwner ? activeConversation.finder : activeConversation.itemOwner}
                </p>
                <p className="text-xs text-success">Active</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeConversation.messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${message.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"} px-4 py-2.5 rounded-2xl text-sm`}>
                    {message.text}
                    <p className={`text-[10px] mt-1 ${message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-background text-sm"
                />
                <button onClick={sendMessage} disabled={sending} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && activeConversation && (
        <DummyRazorpayModal
          itemTitle={activeConversation.itemTitle}
          reward={activeConversation.reward}
          finderGets={finderGets}
          commission={commission}
          onClose={() => setShowPayment(false)}
          onConfirm={processPayment}
        />
      )}
    </div>
  );
}
