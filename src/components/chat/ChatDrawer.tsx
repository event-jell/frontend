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
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessagesWithUser(recipientUser?._id);
  const sendMessageMutation = useSendMessage();

  const conversationId = user?._id && recipientUser?._id
    ? [user._id, recipientUser._id].sort().join('_')
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
      if (payload.conversationId === conversationId && payload.userId !== user?._id) {
        setOtherUserTyping(payload.isTyping);
      }
    };

    socket.on('chat:user_typing', handleTyping);

    return () => {
      socket.off('chat:user_typing', handleTyping);
    };
  }, [conversationId, user?._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', { conversationId, userId: user?._id, isTyping: true });
    }

    // Debounce stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:typing', { conversationId, userId: user?._id, isTyping: false });
    }, 2000);

    return () => clearTimeout(timeout);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !recipientUser?._id) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsTyping(false);
    socket.emit('chat:typing', { conversationId, userId: user?._id, isTyping: false });

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
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-sm shadow-sm relative">
              {recipientName.slice(0, 2).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm">{recipientName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold flex items-center gap-0.5 border border-emerald-200/60">
                  <ShieldCheck size={11} />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {otherUserTyping ? (
                  <span className="text-[#7A1F1F] font-bold animate-pulse">Typing a message...</span>
                ) : (
                  vendorListing?.category?.replace('_', ' ').toUpperCase() || 'Direct Chat'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onBookVendor && (
              <button
                type="button"
                onClick={onBookVendor}
                className="px-3 py-1.5 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold rounded-xl border border-[#7A1F1F]/20 flex items-center gap-1 transition-all"
              >
                <CalendarCheck size={13} />
                <span>Book</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Vendor Mini-Card Attachment Banner */}
        {vendorListing && (
          <div className="p-3.5 mx-4 mt-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              {vendorListing.cover_image ? (
                <img
                  src={vendorListing.cover_image}
                  alt={vendorListing.title || ''}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                  <Store size={18} />
                </div>
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {vendorListing.title}
                </h4>
                <p className="text-[11px] font-black text-[#7A1F1F]">
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
                className="px-3 py-1.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-[11px] font-bold rounded-xl shadow-xs transition-all shrink-0"
              >
                Book Now
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3.5">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-7 h-7 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading message history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center space-y-3 max-w-xs mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center mx-auto">
                <Sparkles size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Start the Conversation</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ask about custom packages, equipment availability, or schedule a call.
                </p>
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => sendQuickInquiry("Hi! Are you available for our upcoming event date?")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-[#FAF0E8]/60 hover:text-[#7A1F1F] text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
                >
                  "Hi! Are you available for our upcoming event?"
                </button>
                <button
                  type="button"
                  onClick={() => sendQuickInquiry("Could you share what is included in your standard package?")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-[#FAF0E8]/60 hover:text-[#7A1F1F] text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
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
              const isMe = String(senderId) === String(user?._id);
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-br from-[#7A1F1F] to-[#8F2626] text-white rounded-br-xs shadow-sm font-medium'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs font-normal'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span className={msg.read ? 'text-blue-500' : 'text-slate-400'}>
                        <CheckCheck size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3.5 sm:p-4 border-t border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-[#7A1F1F]/40 focus-within:ring-2 focus-within:ring-[#7A1F1F]/10 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${recipientName}...`}
              className="flex-1 px-3 py-2 text-xs bg-transparent focus:outline-none text-slate-900"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className="w-9 h-9 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
