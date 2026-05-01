import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import JobCard from "./JobCard";
import TalentCard from "./TalentCard";
import { PresetButton } from "./chat/PresetButton";
import { QuickActionsPanel } from "./chat/QuickActionsPanel";
import { getPresetsForMode, getWelcomePresets } from "./chat/chatPresets";
import { SolanaPayQR } from "./SolanaPayQR";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { X402Payment } from "./X402Payment";
import { MessageContent } from "./chat/MessageContent";

interface Message { role: "user" | "assistant"; content: string; metadata?: any; timestamp?: string; }
interface ReiChatbotProps { walletAddress: string; userMode: "talent" | "employer"; twitterHandle?: string; }

const ReiChatbot = ({ walletAddress, userMode, twitterHandle }: ReiChatbotProps) => {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>(() => { const stored = localStorage.getItem(`rei_chat_${walletAddress}`); return stored ? JSON.parse(stored) : []; });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => localStorage.getItem(`rei_chat_id_${walletAddress}`) || null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'solana-pay' | 'x402' | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [operationStatus, setOperationStatus] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (messages.length > 0) localStorage.setItem(`rei_chat_${walletAddress}`, JSON.stringify(messages)); }, [messages, walletAddress]);
  useEffect(() => { if (conversationId) localStorage.setItem(`rei_chat_id_${walletAddress}`, conversationId); }, [conversationId, walletAddress]);
  useEffect(() => { if (messages.length === 0) loadConversation(); }, []);

  const prevUserModeRef = useRef(userMode);
  useEffect(() => {
    const resetConversation = async () => {
      if (prevUserModeRef.current !== undefined && prevUserModeRef.current !== userMode) {
        if (conversationId) { try { await supabase.from("chat_messages").delete().eq("conversation_id", conversationId); } catch (error) { console.error("Error deleting conversation messages:", error); } setMessages([]); setConversationId(null); localStorage.removeItem(`rei_chat_${walletAddress}`); localStorage.removeItem(`rei_chat_id_${walletAddress}`); }
      }
      prevUserModeRef.current = userMode;
    };
    resetConversation();
  }, [userMode, walletAddress]);

  const loadConversation = async () => {
    try {
      const { data: conversation } = await supabase.from("chat_conversations").select("id").eq("wallet_address", walletAddress).single();
      if (conversation) {
        setConversationId(conversation.id);
        const { data: messages } = await supabase.from("chat_messages").select("role, content, metadata").eq("conversation_id", conversation.id).order("created_at", { ascending: true });
        if (messages) setMessages(messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content, metadata: m.metadata })));
      }
    } catch (error) { console.error("Error loading conversation:", error); }
  };

  const handlePaymentComplete = async (reference: string) => {
    setShowPaymentMethod(false); setSelectedPaymentMethod(null); setCurrentPaymentData(null);
    const confirmMessage = `Payment completed with reference: ${reference}`;
    setMessages((prev) => [...prev, { role: "user", content: confirmMessage }]); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rei-chat", { body: { message: confirmMessage, walletAddress, conversationId: conversationId || undefined, userMode } });
      if (error) throw error;
      const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setMessages((prev) => [...prev, { role: "assistant", content: data.response, metadata: data.metadata, timestamp }]);
      if (!conversationId && data.conversationId) setConversationId(data.conversationId);
    } catch (error: any) { console.error("Payment confirmation error:", error); } finally { setLoading(false); }
  };

  const handlePaymentMethodSelect = (method: 'solana-pay' | 'x402') => { setSelectedPaymentMethod(method); setShowPaymentMethod(false); };
  const handleCancelPayment = () => { setShowPaymentMethod(false); setSelectedPaymentMethod(null); setCurrentPaymentData(null); };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear the chat? This cannot be undone.")) return;
    try {
      const { data, error } = await supabase.functions.invoke("clear-chat-conversation", { body: { walletAddress } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([]);
      setConversationId(null);
      setDisplayedContent({});
      localStorage.removeItem(`rei_chat_${walletAddress}`);
      localStorage.removeItem(`rei_chat_id_${walletAddress}`);
      toast({ title: "Chat Cleared", description: "Your conversation has been reset." });
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast({ title: "Error", description: "Failed to clear chat.", variant: "destructive" });
    }
  };

  const handlePresetSelect = (preset: string) => { setInput(preset); setShowQuickActions(false); setTimeout(() => { const inputElement = document.querySelector('.term-input') as HTMLInputElement; inputElement?.focus(); }, 100); };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const userMessage: Message = { role: "user", content: input, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    const isPostOperation = /post|submit|create|add.*job|add.*task|add.*gig/i.test(input);
    setInput(""); setLoading(true);
    const statusTimers: NodeJS.Timeout[] = [];
    if (isPostOperation) { setOperationStatus("Rei is thinking..."); statusTimers.push(setTimeout(() => setOperationStatus("Processing your request..."), 3000)); statusTimers.push(setTimeout(() => setOperationStatus("Generating payment details..."), 10000)); statusTimers.push(setTimeout(() => setOperationStatus("Fetching current SOL price..."), 25000)); statusTimers.push(setTimeout(() => setOperationStatus("Almost there, finalizing..."), 40000)); statusTimers.push(setTimeout(() => setOperationStatus("Still working on it, please wait..."), 60000)); }
    else { setOperationStatus("Rei is thinking..."); statusTimers.push(setTimeout(() => setOperationStatus("Processing your request..."), 5000)); }
    try {
      const { data, error } = await supabase.functions.invoke("rei-chat", { body: { message: input, walletAddress, conversationId: conversationId || undefined, userMode } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
      let metadata = data.metadata || null; let cleanContent = data.response;
      const jsonMatch = data.response.match(/\{"action":"[^"]+","link":"[^"]+"\}/);
      if (jsonMatch) { try { const actionMetadata = JSON.parse(jsonMatch[0]); metadata = { ...metadata, ...actionMetadata }; cleanContent = data.response.replace(jsonMatch[0], "").trim(); } catch (e) { console.error("Failed to parse metadata:", e); } }
      const metadataLabelMatch = cleanContent.match(/\n*Metadata:\s*\{[\s\S]*?\}\s*$/i);
      if (metadataLabelMatch) cleanContent = cleanContent.replace(metadataLabelMatch[0], "").trim();
      cleanContent = cleanContent.replace(/\n*Metadata:\s*$/i, "").trim();
      const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      setMessages((prev) => [...prev, { role: "assistant", content: cleanContent, metadata, timestamp: ts }]);
      if (!conversationId && data.conversationId) setConversationId(data.conversationId);
    } catch (error: any) { console.error("Chat error:", error); toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" }); }
    finally { setLoading(false); setOperationStatus(""); statusTimers.forEach(timer => clearTimeout(timer)); }
  };

  const [displayedContent, setDisplayedContent] = useState<Record<number, string>>(() => {
    const stored = localStorage.getItem(`rei_chat_${walletAddress}`);
    if (stored) { const loadedMessages = JSON.parse(stored); const initial: Record<number, string> = {}; loadedMessages.forEach((msg: Message, idx: number) => { if (msg.role === "assistant") initial[idx] = msg.content; }); return initial; }
    return {};
  });
  const [lastMessageCount, setLastMessageCount] = useState(0);

  useEffect(() => {
    if (messages.length <= lastMessageCount) { setLastMessageCount(messages.length); return; }
    const intervals: NodeJS.Timeout[] = [];
    const newMessageIndex = messages.length - 1;
    const newMessage = messages[newMessageIndex];
    if (newMessage.role === "assistant" && !displayedContent[newMessageIndex]) {
      const content = newMessage.content; let currentIndex = 0;
      const intervalId = setInterval(() => { if (currentIndex <= content.length) { setDisplayedContent((prev) => ({ ...prev, [newMessageIndex]: content.substring(0, currentIndex) })); currentIndex++; } else { clearInterval(intervalId); } }, 15);
      intervals.push(intervalId);
    }
    setLastMessageCount(messages.length);
    return () => { intervals.forEach((i) => clearInterval(i)); };
  }, [messages.length]);

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const timestamp = message.timestamp || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const handle = isUser ? `@${twitterHandle || "user"}` : "@rei";
    const content = isUser ? message.content : displayedContent[index] || "";
    const isTyping = !isUser && content.length < message.content.length;

    return (
      <div key={index}>
        <div className="chat-line">
          <span className="chat-ts">[{timestamp}]</span>
          <span className={`chat-handle ${isUser ? 'handle-user' : 'handle-ai'}`}>{handle}</span>
          <div className={`chat-msg ${!isUser ? 'msg-ai' : ''}`} style={{ flex: 1 }}>
            {isUser ? <span>{content}</span> : <><MessageContent content={content} />{isTyping && <span className="rei-cursor" />}</>}
          </div>
        </div>
        {!isUser && message.metadata?.action === "register" && message.metadata?.link && (
          <div className="mt-2 ml-[148px]"><button onClick={() => (window.location.href = message.metadata.link)} className="rei-chip"><span className="rei-chip-dot" />Complete Registration</button></div>
        )}
        {!isUser && message.metadata?.drafts && Array.isArray(message.metadata.drafts) && (
          <div className="mt-2 ml-[148px] space-y-2">
            {message.metadata.drafts.map((draft: any, idx: number) => (
              <button key={draft.id} onClick={() => { setInput(`load draft ${draft.id} ${draft.type}`); handleSend(); }} className="w-full text-left px-4 py-3 rei-surface-2 hover:border-[hsla(18,52%,82%,0.3)] transition-colors text-sm" style={{ padding: '10px 14px', borderRadius: '14px' }}>
                <div className="flex items-start gap-3"><span style={{ color: '#e8c4b8', fontWeight: 500 }}>[{idx + 1}]</span><div style={{ flex: 1 }}><div style={{ color: '#f0ede8', fontWeight: 500 }}>[{draft.type.toUpperCase()}] {draft.title}</div><div style={{ color: '#5c5a57', fontSize: '11px', marginTop: '4px' }}>Status: {draft.status}</div></div></div>
              </button>
            ))}
            <button onClick={() => { setInput("start a new one"); handleSend(); }} className="w-full text-left rei-surface-2 hover:border-[hsla(18,52%,82%,0.3)] transition-colors text-sm" style={{ padding: '10px 14px', borderRadius: '14px', color: '#5c5a57' }}><span style={{ color: 'hsla(18,52%,82%,0.7)', marginRight: '8px' }}>+</span> Start a new one instead</button>
          </div>
        )}
        {!isUser && message.metadata?.quickActions && Array.isArray(message.metadata.quickActions) && (
          <div className="mt-2 ml-[148px] flex flex-wrap gap-2">
            {message.metadata.quickActions.map((action: any, idx: number) => (<button key={idx} onClick={() => { setInput(action.value); handleSend(); }} className="rei-chip"><span className="rei-chip-dot" />{action.label}</button>))}
          </div>
        )}
        {!isUser && message.metadata?.solanaPay && (
          <div className="mt-2 ml-[148px]">
            {!publicKey && !selectedPaymentMethod && !showPaymentMethod && (
              <div className="rei-surface-2 space-y-3" style={{ padding: '14px', borderRadius: '14px' }}><p style={{ color: '#5c5a57', fontSize: '12px' }}>Connect wallet to choose payment method:</p><WalletMultiButton className="!bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 w-full !rounded-[28px] !font-sans !text-sm" /></div>
            )}
            {publicKey && !selectedPaymentMethod && !showPaymentMethod && (<button onClick={() => { setCurrentPaymentData(message.metadata.solanaPay); setShowPaymentMethod(true); }} className="rei-chip"><span className="rei-chip-dot" />Choose Payment Method</button>)}
            {showPaymentMethod && currentPaymentData === message.metadata.solanaPay && <PaymentMethodSelector onMethodSelect={handlePaymentMethodSelect} amount={message.metadata.solanaPay.amount} solAmount={message.metadata.solanaPay.solAmount} />}
            {selectedPaymentMethod === 'solana-pay' && currentPaymentData === message.metadata.solanaPay && <SolanaPayQR qrCodeUrl={message.metadata.solanaPay.qrCodeUrl} reference={message.metadata.solanaPay.reference} paymentUrl={message.metadata.solanaPay.paymentUrl} amount={message.metadata.solanaPay.amount} recipient={message.metadata.solanaPay.recipient} walletAddress={walletAddress} onPaymentComplete={handlePaymentComplete} />}
            {selectedPaymentMethod === 'x402' && currentPaymentData === message.metadata.solanaPay && <X402Payment amount={message.metadata.solanaPay.amount} memo={message.metadata.solanaPay.memo || ''} onSuccess={handlePaymentComplete} onCancel={handleCancelPayment} />}
          </div>
        )}
        <div className="line-gap" />
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col rei-terminal" style={{ border: 'none', borderRadius: 0 }}>
      <div className="term-bar">
        <div className="flex gap-1.5"><div className="term-dot" /><div className="term-dot" /><div className="term-dot" /></div>
        <span className="term-title">rei.chat — {twitterHandle ? `@${twitterHandle}` : 'session'}</span>
        <span className="term-status"><span className="term-online">●</span> connected</span>
        {messages.length > 0 && <button onClick={handleClearChat} className="send-btn ml-2">clear</button>}
      </div>
      <div className="log-area flex-1 overflow-y-auto pb-20 scrollbar-hide">
        {messages.length === 0 && (
          <>
            <div className="chat-line"><span className="chat-ts">[--:--:--]</span><span className="chat-handle handle-sys">* system</span><span className="chat-msg msg-sys">session started. select a command or type a message.</span></div>
            <div className="line-gap" /><div className="term-divider" /><div className="line-gap" />
            <div className="flex flex-wrap gap-2 px-2">{getWelcomePresets(userMode).map((preset, idx) => <PresetButton key={idx} text={preset} onClick={() => handlePresetSelect(preset)} />)}</div>
          </>
        )}
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && (
          <div>
            <div className="chat-line"><span className="chat-ts">[...]</span><span className="chat-handle handle-ai">@rei</span><span className="chat-msg msg-ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 className="h-3 w-3 animate-spin" style={{ color: '#7a7874' }} /><span style={{ color: '#4a4845' }}>thinking...</span></span></div>
            {operationStatus && <div className="chat-line"><span className="chat-ts" /><span className="chat-handle" /><span className="chat-msg msg-sys" style={{ fontSize: '11px' }}>{operationStatus}</span></div>}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-row" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="input-row-inner">
          <button onClick={() => setShowQuickActions(!showQuickActions)} className="send-btn" style={{ fontSize: '12px', padding: '4px 8px' }}>?</button>
          <div className="input-field-wrap">
            <span className="prompt-prefix">@{twitterHandle || 'user'} &gt;</span>
            {!input && <span className="input-caret" aria-hidden="true" />}
            <input className="term-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="type a message or /command..." disabled={loading} />
          </div>
          <button onClick={handleSend} disabled={loading || !input.trim()} className="send-btn" style={{ opacity: loading || !input.trim() ? 0.3 : 1 }}>{loading ? '...' : 'send'}</button>
        </div>
      </div>
      <QuickActionsPanel isOpen={showQuickActions} onClose={() => setShowQuickActions(false)} categories={getPresetsForMode(userMode)} onSelect={handlePresetSelect} />
    </div>
  );
};

export default ReiChatbot;