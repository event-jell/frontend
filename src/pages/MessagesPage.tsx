import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Store,
  Send,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  CheckCheck,
  Check,
  ArrowLeft,
  Clock,
  AlertCircle,
  ExternalLink,
  Smile,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkMessagesRead,
  MESSAGES_QUERY_KEYS,
} from '../hooks/useMessages';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';
import { formatCurrency } from '../utils/formatters';
import type { ConversationItem, ChatMessage } from '../types';

const POPULAR_EMOJIS = ['😊', '😂', '👍', '❤️', '🎉', '🔥', '🙌', '😮', '😢', '👏', '🤔', '✨', '🙏', '💯', '🚀'];

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const routeState = location.state as {
    recipientUser?: { _id: string; first_name?: string; last_name?: string; email?: string };
    vendorListing?: {
      _id: string;
      title: string;
      category?: string;
      base_price?: number;
      currency?: string;
      cover_image?: string;
    };
  } | undefined;

  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string>(conversationId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Optimistic & delivery status tracking
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent' | 'delivered' | 'read' | 'failed'>>({});

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessagesRead();

  const myId = user?.id || user?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync route param
  useEffect(() => {
    if (conversationId) {
      setActiveConvId(conversationId);
    }
  }, [conversationId]);

  // Click outside emoji picker to close it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  let activeConversation = conversations.find((c) => c.conversation_id === activeConvId);

  // Synthesize draft conversation from routeState if new
  if (!activeConversation && activeConvId && routeState?.recipientUser?._id) {
    const recipientId = routeState.recipientUser._id;
    if (myId) {
      activeConversation = {
        conversation_id: activeConvId,
        other_user: {
          _id: recipientId,
          first_name: routeState?.recipientUser?.first_name || 'Vendor Partner',
          last_name: routeState?.recipientUser?.last_name || '',
          email: routeState?.recipientUser?.email || 'Active on EventJell',
        },
        vendor_listing: routeState?.vendorListing ? {
          _id: routeState.vendorListing._id,
          title: routeState.vendorListing.title,
          category: routeState.vendorListing.category || 'other',
          base_price: routeState.vendorListing.base_price || 0,
          currency: routeState.vendorListing.currency || 'USD',
          cover_image: routeState.vendorListing.cover_image,
        } : null,
        last_message: {
          _id: 'temp',
          content: '',
          sender_id: '',
          createdAt: new Date().toISOString(),
          read: false,
        },
        unread_count: 0,
      };
    }
  }

  const { data: messages = [], isLoading: loadingMessages } = useConversationMessages(activeConvId);

  const allMessages = [
    ...messages,
    ...pendingMessages.filter(
      (pm) => !messages.some((m) => m.content === pm.content && String(m.sender_id) === String(pm.sender_id))
    ),
  ];

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, pendingMessages.length]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (activeConvId) {
      markReadMutation.mutate(activeConvId);
    }
  }, [activeConvId]);

  // Socket typing listeners
  useEffect(() => {
    if (!activeConvId) return;

    const handleTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId === activeConvId && payload.userId !== myId) {
        setOtherUserTyping(payload.isTyping);
      }
    };

    socket.on('chat:user_typing', handleTyping);

    return () => {
      socket.off('chat:user_typing', handleTyping);
    };
  }, [activeConvId, myId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('chat:typing', { conversationId: activeConvId, userId: myId, isTyping: true });
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('chat:typing', { conversationId: activeConvId, userId: myId, isTyping: false });
    }, 2000);

    return () => clearTimeout(timeout);
  };

  const getMessageStatus = (msg: ChatMessage) => {
    if (msg.read) return 'read';
    if (messageStatuses[msg._id]) return messageStatuses[msg._id];
    return 'delivered';
  };

  const handleSend = async (e?: React.FormEvent, retryMsg?: ChatMessage) => {
    if (e) e.preventDefault();
    if (!activeConversation?.other_user?._id) return;

    const textToSend = retryMsg ? retryMsg.content : inputText.trim();
    if (!textToSend) return;

    if (!retryMsg) {
      setInputText('');
      setIsTyping(false);
      socket.emit('chat:typing', { conversationId: activeConvId, userId: myId, isTyping: false });
    }

    const tempId = retryMsg ? retryMsg._id : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!retryMsg) {
      const newTempMsg: ChatMessage = {
        _id: tempId,
        sender_id: myId || '',
        recipient_id: activeConversation.other_user._id,
        conversation_id: activeConvId,
        content: textToSend,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPendingMessages(prev => [...prev, newTempMsg]);
    }

    setMessageStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const newMsg = await sendMessageMutation.mutateAsync({
        recipient_id: activeConversation.other_user._id,
        content: textToSend,
        vendor_listing_id: activeConversation.vendor_listing?._id,
      });

      setPendingMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageStatuses(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[newMsg._id] = 'sent';
        return next;
      });

      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });

      setTimeout(() => {
        setMessageStatuses(prev => ({
          ...prev,
          [newMsg._id]: 'delivered'
        }));
      }, 1000);

    } catch (err) {
      setMessageStatuses(prev => ({ ...prev, [tempId]: 'failed' }));
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.other_user?.first_name
      ? `${c.other_user.first_name} ${c.other_user.last_name || ''}`
      : c.vendor_listing?.title || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-white">
      <SEO title="Messages & Vendor Chat — EventJell" />

      {/* Main 2-Panel Messenger */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Left Panel: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-150 flex flex-col overflow-hidden shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Messages & Chat
            </h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-[11px] sm:text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
            {loadingConversations ? (
              <div className="p-3 space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3.5 w-24 bg-slate-200 rounded" />
                        <div className="h-2.5 w-10 bg-slate-100 rounded" />
                      </div>
                      <div className="h-3 w-40 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-1.5">
                <MessageSquare size={24} className="text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No conversations yet</p>
                <p className="text-[10px] text-slate-400">
                  Chat with any marketplace vendor or planner to start a discussion.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.conversation_id === activeConvId;
                const otherName = conv.other_user?.first_name
                  ? `${conv.other_user.first_name} ${conv.other_user.last_name || ''}`
                  : conv.vendor_listing?.title || 'User';

                return (
                  <button
                    key={conv.conversation_id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.conversation_id);
                      navigate(`/messages/${conv.conversation_id}`);
                    }}
                    className={`w-full p-3 sm:p-4 text-left flex items-start gap-2.5 sm:gap-3 transition-colors ${
                      isActive ? 'bg-[#FAF0E8]/50 border-l-4 border-[#7A1F1F]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 shadow-2xs">
                      {otherName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{otherName}</span>
                        {conv.last_message?.createdAt && (
                          <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.last_message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                        {conv.last_message?.content || 'Started a conversation'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#7A1F1F] text-white text-[9px] font-black rounded-full shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Chat Stream */}
        <div className={`flex-1 bg-slate-50/20 flex flex-col overflow-hidden ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Conversation Header (Compact on Mobile) */}
              <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConvId('');
                      navigate('/messages');
                    }}
                    className="md:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors shrink-0"
                    title="Back to conversations"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {(activeConversation.other_user?.first_name || activeConversation.vendor_listing?.title || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {activeConversation.other_user?.first_name
                          ? `${activeConversation.other_user.first_name} ${activeConversation.other_user.last_name || ''}`
                          : activeConversation.vendor_listing?.title || 'User'}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-extrabold flex items-center gap-0.5 border border-emerald-200/60 shrink-0">
                        <ShieldCheck size={9} />
                        <span>Verified</span>
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">
                      {otherUserTyping ? (
                        <span className="text-[#7A1F1F] font-bold animate-pulse">Typing a message...</span>
                      ) : (
                        activeConversation.other_user?.email || 'Active on EventJell'
                      )}
                    </p>
                  </div>
                </div>

                {activeConversation.vendor_listing && (
                  <button
                    type="button"
                    onClick={() => navigate(`/vendors/${activeConversation.vendor_listing?._id}`)}
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-[10px] sm:text-xs font-bold rounded-xl border border-[#7A1F1F]/20 flex items-center gap-1 transition-all shrink-0"
                  >
                    <Store size={12} />
                    <span className="hidden sm:inline">View Listing Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </button>
                )}
              </div>

              {/* Listing Context Banner (Compact) */}
              {activeConversation.vendor_listing && (
                <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-[#FAF0E8]/35 border-b border-slate-100 flex items-center justify-between gap-2.5 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img
                      src={activeConversation.vendor_listing.cover_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=120&q=80'}
                      alt={activeConversation.vendor_listing.title}
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg sm:rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">
                        {activeConversation.vendor_listing.title}
                      </h4>
                      <span className="text-[8.5px] sm:text-[9px] font-extrabold text-[#7A1F1F] uppercase tracking-wider bg-[#FAF0E8] px-1.5 py-0.2 rounded-md mt-0.5 inline-block">
                        {activeConversation.vendor_listing.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block">
                      {formatCurrency(activeConversation.vendor_listing.base_price, activeConversation.vendor_listing.currency)}
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] text-slate-400 font-medium">starting price</span>
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 bg-[#F8FAFC]">
                <div className="space-y-2.5 sm:space-y-3.5 flex flex-col">
                  {loadingMessages ? (
                    <div className="space-y-4 p-2 animate-pulse">
                      <div className="flex items-start gap-2.5 max-w-xs">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0" />
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2 flex-1 shadow-2xs">
                          <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
                          <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 max-w-xs ml-auto flex-row-reverse">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0" />
                        <div className="bg-[#7A1F1F]/10 border border-[#7A1F1F]/20 rounded-2xl p-3.5 space-y-2 flex-1">
                          <div className="h-3.5 w-4/5 bg-slate-300 rounded ml-auto" />
                          <div className="h-3 w-2/3 bg-slate-200 rounded ml-auto" />
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 max-w-xs">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex-shrink-0" />
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2 flex-1 shadow-2xs">
                          <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ) : allMessages.length === 0 ? (
                    <div className="py-12 text-center space-y-1.5 max-w-sm mx-auto">
                      <Sparkles size={20} className="text-[#D4A24C] mx-auto" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">Direct Real-time Channel</h4>
                      <p className="text-[11px] text-slate-500">
                        Send your first message to discuss service agreements and dates.
                      </p>
                    </div>
                  ) : (
                    <>
                      {allMessages.map((msg) => {
                        const senderId =
                          typeof msg.sender_id === 'object' && msg.sender_id !== null
                            ? msg.sender_id._id
                            : msg.sender_id;
                        const isMe = String(senderId) === String(myId);
                        const status = getMessageStatus(msg);

                        return (
                          <div
                            key={msg._id}
                            className={`flex flex-col ${isMe ? 'items-end self-end ml-auto' : 'items-start self-start mr-auto'} max-w-[85%] sm:max-w-[75%]`}
                          >
                            <div
                              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-[12px] sm:text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-gradient-to-br from-[#7A1F1F] to-[#8F2626] text-white rounded-br-xs shadow-2xs font-medium'
                                  : 'bg-white border border-slate-200/70 text-slate-800 rounded-bl-xs font-normal shadow-2xs'
                              } ${status === 'failed' ? 'border-red-300 ring-1 ring-red-100' : ''}`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 mt-0.5 px-1">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && status !== 'failed' && (
                                <span className="inline-block ml-0.5">
                                  {status === 'sending' && (
                                    <Clock size={10} className="text-slate-400 animate-pulse" />
                                  )}
                                  {status === 'sent' && (
                                    <Check size={11} className="text-slate-400" />
                                  )}
                                  {status === 'delivered' && (
                                    <CheckCheck size={11} className="text-slate-400" />
                                  )}
                                  {status === 'read' && (
                                    <CheckCheck size={11} className="text-blue-500" />
                                  )}
                                </span>
                              )}
                              {isMe && status === 'failed' && (
                                <div className="flex items-center gap-1 text-red-500 font-semibold ml-0.5">
                                  <AlertCircle size={10} />
                                  <span>Failed</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSend(undefined, msg)}
                                    className="underline hover:text-red-700 font-bold transition-colors cursor-pointer"
                                  >
                                    Retry
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Message Input Bar (Compact on Mobile) */}
              <form onSubmit={handleSend} className="p-2 sm:p-3.5 border-t border-slate-100 bg-white shrink-0 relative">
                <div className="max-w-4xl mx-auto relative">
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-full mb-2 left-0 right-0 sm:left-auto sm:right-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-xs"
                    >
                      <div className="text-[10px] font-bold text-slate-400 mb-1.5 px-0.5 uppercase tracking-wider">
                        Quick Emojis
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {POPULAR_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setInputText(prev => prev + emoji);
                            }}
                            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 rounded-xl active:scale-90 transition-all"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-1 focus-within:bg-white focus-within:border-[#7A1F1F]/40 focus-within:ring-2 focus-within:ring-[#7A1F1F]/10 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${showEmojiPicker ? 'text-[#7A1F1F] bg-[#FAF0E8]' : 'text-slate-400 hover:text-[#7A1F1F]'}`}
                    >
                      <Smile size={18} />
                    </button>
                    <input
                      type="text"
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      className="flex-1 px-1.5 py-1.5 sm:py-2 text-[12px] sm:text-xs bg-transparent focus:outline-none text-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim() || sendMessageMutation.isPending}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
              <div className="space-y-2 max-w-xs">
                <MessageSquare size={32} className="text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Select a Conversation</h3>
                <p className="text-[11px] text-slate-400">
                  Pick a conversation from the left or message any vendor from the marketplace.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
