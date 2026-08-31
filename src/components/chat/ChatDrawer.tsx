import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Store,
  CalendarCheck,
  MapPin,
  Star,
  ShieldCheck,
  Check,
  CheckCheck,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessagesWithUser, useSendMessage } from '../../hooks/useMessages';
import { socket } from '../../lib/socket';
import { formatCurrency } from '../../utils/formatters';
import type { ChatMessage, VendorListing } from '../../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUser: {
    _id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  vendorListing?: Partial<VendorListing> | null;
  eventId?: string;
  onBookVendor?: () => void;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  recipientUser,
  vendorListing,
  eventId,
  onBookVendor,
}: ChatDrawerProps) {
  const { user } = useAuth();
  const myId = user?.id || user?._id;
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessagesWithUser(recipientUser?._id);
  const sendMessageMutation = useSendMessage();

  const conversationId = myId && recipientUser?._id
    ? [myId, recipientUser._id].sort().join('_')
    : '';

  // Scroll to bottom on messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Socket typing listeners
  useEffect(() => {
    if (!conversationId) return;

    const handleTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId === conversationId && payload.userId !== myId) {
        setOtherUserTyping(payload.isTyping);
      }
    };

    socket.on('chat:user_typing', handleTyping);

    return () => {
      socket.off('chat:user_typing', handleTyping);
    };
  }, [conversationId, myId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', { conversationId, userId: myId, isTyping: true });
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:typing', { conversationId, userId: myId, isTyping: false });
    }, 2000);

    return () => clearTimeout(timeout);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !recipientUser?._id) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsTyping(false);
    socket.emit('chat:typing', { conversationId, userId: myId, isTyping: false });

    await sendMessageMutation.mutateAsync({
      recipient_id: recipientUser._id,
      content: textToSend,
      vendor_listing_id: vendorListing?._id,
      event_id: eventId,
    });
  };

  const sendQuickInquiry = (template: string) => {
    setInputText(template);
  };

  if (!isOpen) return null;

  const recipientName = recipientUser?.first_name
    ? `${recipientUser.first_name} ${recipientUser.last_name || ''}`
    : vendorListing?.title || recipientUser?.email?.split('@')[0] || 'Vendor';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Header (Compact) */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-xs shadow-2xs relative shrink-0">
              {recipientName.slice(0, 2).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{recipientName}</h3>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold flex items-center gap-0.5 border border-emerald-200/60 shrink-0">
                  <ShieldCheck size={9} />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {otherUserTyping ? (
                  <span className="text-[#7A1F1F] font-bold animate-pulse">Typing a message...</span>
                ) : (
                  vendorListing?.category?.replace('_', ' ').toUpperCase() || 'Direct Chat'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onBookVendor && (
              <button
                type="button"
                onClick={onBookVendor}
                className="px-2.5 py-1 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-[11px] font-bold rounded-lg border border-[#7A1F1F]/20 flex items-center gap-1 transition-all"
              >
                <CalendarCheck size={12} />
                <span>Book</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Vendor Mini-Card Attachment Banner (Compact) */}
        {vendorListing && (
          <div className="p-2.5 mx-3 mt-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              {vendorListing.cover_image ? (
                <img
                  src={vendorListing.cover_image}
                  alt={vendorListing.title || ''}
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Store size={15} />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                  {vendorListing.title}
                </h4>
                <p className="text-[10px] font-black text-[#7A1F1F]">
                  {vendorListing.base_price
                    ? formatCurrency(vendorListing.base_price, vendorListing.currency || 'USD')
                    : 'Custom Quote'}
                </p>
              </div>
            </div>

            {onBookVendor && (
              <button
                type="button"
                onClick={onBookVendor}
                className="px-2.5 py-1 bg-[#7A1F1F] hover:bg-[#661919] text-white text-[10px] font-bold rounded-lg shadow-xs transition-all shrink-0"
              >
                Book
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-1.5">
              <div className="w-5 h-5 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[11px]">Loading message history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-10 text-center space-y-2 max-w-xs mx-auto">
              <div className="w-10 h-10 rounded-xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center mx-auto">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Start the Conversation</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ask about custom packages, equipment availability, or schedule a call.
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-1 pt-1.5">
                <button
                  type="button"
                  onClick={() => sendQuickInquiry("Hi! Are you available for our upcoming event date?")}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-[#FAF0E8]/60 hover:text-[#7A1F1F] text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors"
                >
                  "Hi! Are you available for our upcoming event?"
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickInquiry("Could you share what is included in your standard package?")}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-[#FAF0E8]/60 hover:text-[#7A1F1F] text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors"
                >
                  "What is included in your standard package?"
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId =
                typeof msg.sender_id === 'object' && msg.sender_id !== null
                  ? msg.sender_id._id
                  : msg.sender_id;
              const isMe = String(senderId) === String(myId);

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-[12px] sm:text-xs leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-[#7A1F1F] to-[#8F2626] text-white rounded-br-xs shadow-2xs font-medium'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs font-normal'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5 px-1">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span className={msg.read ? 'text-blue-500' : 'text-slate-400'}>
                        <CheckCheck size={11} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (Compact) */}
        <form onSubmit={handleSend} className="p-2 sm:p-3 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:bg-white focus-within:border-[#7A1F1F]/40 focus-within:ring-2 focus-within:ring-[#7A1F1F]/10 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${recipientName}...`}
              className="flex-1 px-2.5 py-1.5 text-[12px] sm:text-xs bg-transparent focus:outline-none text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7A1F1F] hover:bg-[#661919] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
            >
              <Send size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
