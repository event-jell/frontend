import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { socket } from '../lib/socket';
import { formatCurrency } from '../utils/formatters';
import type { ConversationItem, ChatMessage } from '../types';

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const myId = user?._id || user?.id || '';

  const routeState = location.state as {
    recipientUser?: { _id: string; first_name: string; last_name?: string; email: string };
    vendorListing?: { _id: string; title: string; category: string; base_price: number; currency: string; cover_image?: string };
  } | null;

  const { data: conversations = [], isLoading: loadingConversations } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string>(conversationId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessagesRead();
  const queryClient = useQueryClient();

  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent' | 'delivered' | 'read' | 'failed'>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageStatus = (msg: ChatMessage) => {
    if (messageStatuses[msg._id]) {
      return messageStatuses[msg._id];
    }
    if (msg.read) return 'read';
    if (msg._id && !msg._id.startsWith('temp_')) {
      return 'delivered';
    }
    return 'sending';
  };

  // Listen for real-time read receipts
  useEffect(() => {
    if (!activeConvId) return;

    const handleReadReceipt = (payload: { conversationId: string; readByUserId: string }) => {
      if (payload.conversationId === activeConvId && payload.readByUserId !== myId) {
        setMessageStatuses(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(msgId => {
            if (next[msgId] === 'sent' || next[msgId] === 'delivered') {
              next[msgId] = 'read';
            }
          });
          return next;
        });
        queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversation(activeConvId) });
      }
    };

    socket.on('chat:read_receipt', handleReadReceipt);
    return () => {
      socket.off('chat:read_receipt', handleReadReceipt);
    };
  }, [activeConvId, myId, queryClient]);

  // Pick first conversation if none selected
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0].conversation_id);
    }
  }, [conversations, activeConvId]);

  // Sync route param
  useEffect(() => {
    if (conversationId) {
      setActiveConvId(conversationId);
    }
  }, [conversationId]);

  let activeConversation = conversations.find((c) => c.conversation_id === activeConvId);

  // If no conversation found but we have a valid conversation ID, build a virtual conversation
  if (!activeConversation && activeConvId) {
    const ids = activeConvId.split('_');
    const recipientId = ids.find((id) => id !== myId);
    if (recipientId) {
      activeConversation = {
        conversation_id: activeConvId,
        other_user: {
          _id: recipientId,
          first_name: routeState?.recipientUser?.first_name || 'Vendor Partner',
          last_name: routeState?.recipientUser?.last_name || '',
          email: routeState?.recipientUser?.email || 'Active on EventJelly',
        },
        vendor_listing: routeState?.vendorListing ? {
          _id: routeState.vendorListing._id,
          title: routeState.vendorListing.title,
          category: routeState.vendorListing.category,
          base_price: routeState.vendorListing.base_price,
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

    // Create or locate the message in pending state
    if (!retryMsg) {
      const newTempMsg: ChatMessage = {
        _id: tempId,
        sender_id: myId,
        recipient_id: activeConversation.other_user._id,
        conversation_id: activeConvId,
        content: textToSend,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPendingMessages(prev => [...prev, newTempMsg]);
    }

    // Set status to sending
    setMessageStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

    try {
      const newMsg = await sendMessageMutation.mutateAsync({
        recipient_id: activeConversation.other_user._id,
        content: textToSend,
        vendor_listing_id: activeConversation.vendor_listing?._id,
      });

      // On success:
      // 1. Remove this message from pending list
      setPendingMessages(prev => prev.filter(m => m._id !== tempId));
      
      // 2. Set status of the real ID to 'sent'
      setMessageStatuses(prev => {
        const next = { ...prev };
        delete next[tempId];
        next[newMsg._id] = 'sent';
        return next;
      });

      // 3. Invalidate conversations query to get updated lists
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });

      // 4. Simulate delivery transition to 'delivered' (✓✓) after 1 second
      setTimeout(() => {
        setMessageStatuses(prev => ({
          ...prev,
          [newMsg._id]: 'delivered'
        }));
      }, 1000);

    } catch (err) {
      // On failure: set status to failed
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
    <div className="flex flex-col h-[calc(100vh-112px)] lg:h-screen overflow-hidden bg-white">
      <SEO title="Messages & Vendor Chat — EventJelly" />

      {/* Main 2-Panel Messenger */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Left Panel: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-150 flex flex-col overflow-hidden shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 space-y-3">
            <h2 className="text-lg font-black text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Messages & Chat
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-50">
            {loadingConversations ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-2">
                <MessageSquare size={28} className="text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No conversations yet</p>
                <p className="text-[11px] text-slate-400">
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
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-[#FAF0E8]/50 border-l-4 border-[#7A1F1F]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {otherName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">{otherName}</span>
                        {conv.last_message?.createdAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(conv.last_message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conv.last_message?.content || 'Started a conversation'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="px-2 py-0.5 bg-[#7A1F1F] text-white text-[10px] font-black rounded-full shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>        {/* Right Panel: Active Chat Stream */}
        <div className={`flex-1 bg-slate-50/20 flex flex-col overflow-hidden ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConvId('');
                      navigate('/messages');
                    }}
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7A1F1F] to-[#a33838] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {(activeConversation.other_user?.first_name || activeConversation.vendor_listing?.title || 'U')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {activeConversation.other_user?.first_name
                          ? `${activeConversation.other_user.first_name} ${activeConversation.other_user.last_name || ''}`
                          : activeConversation.vendor_listing?.title || 'User'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold flex items-center gap-0.5 border border-emerald-200/60">
                        <ShieldCheck size={11} />
                        <span>Verified</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {otherUserTyping ? (
                        <span className="text-[#7A1F1F] font-bold animate-pulse">Typing a message...</span>
                      ) : (
                        activeConversation.other_user?.email || 'Active on EventJelly'
                      )}
                    </p>
                  </div>
                </div>

                {activeConversation.vendor_listing && (
                  <button
                    type="button"
                    onClick={() => navigate(`/vendors/${activeConversation.vendor_listing?._id}`)}
                    className="px-3.5 py-2 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold rounded-xl border border-[#7A1F1F]/20 flex items-center gap-1.5 transition-all"
                  >
                    <Store size={14} />
                    <span>View Listing Profile</span>
                  </button>
                )}
              </div>

              {/* Listing Context Banner */}
              {activeConversation.vendor_listing && (
                <div className="px-5 py-3 bg-[#FAF0E8]/35 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={activeConversation.vendor_listing.cover_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=120&q=80'}
                      alt={activeConversation.vendor_listing.title}
                      className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {activeConversation.vendor_listing.title}
                      </h4>
                      <span className="text-[9px] font-extrabold text-[#7A1F1F] uppercase tracking-wider bg-[#FAF0E8] px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                        {activeConversation.vendor_listing.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      {formatCurrency(activeConversation.vendor_listing.base_price, activeConversation.vendor_listing.currency)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">starting price</span>
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 bg-[#F4F6F8]">
                <div className="max-w-4xl mx-auto space-y-4 flex flex-col">
                  {loadingMessages ? (
                    <div className="py-20 text-center text-slate-400 space-y-2">
                      <div className="w-7 h-7 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-medium">Loading messages...</p>
                    </div>
                  ) : allMessages.length === 0 ? (
                    <div className="py-16 text-center space-y-2 max-w-sm mx-auto">
                      <Sparkles size={24} className="text-[#D4A24C] mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900">Direct Real-time Channel</h4>
                      <p className="text-xs text-slate-500">
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
                            className={`flex flex-col ${isMe ? 'items-end self-end ml-auto' : 'items-start self-start mr-auto'} max-w-[75%]`}
                          >
                            <div
                              className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-gradient-to-br from-[#7A1F1F] to-[#8F2626] text-white rounded-br-xs shadow-sm font-medium'
                                  : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-xs font-normal shadow-xs'
                              } ${status === 'failed' ? 'border-red-300 ring-1 ring-red-100' : ''}`}
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
                              {isMe && status !== 'failed' && (
                                <span className="inline-block ml-0.5">
                                  {status === 'sending' && (
                                    <Clock size={11} className="text-slate-400 animate-pulse mt-0.5" />
                                  )}
                                  {status === 'sent' && (
                                    <Check size={12} className="text-slate-400" />
                                  )}
                                  {status === 'delivered' && (
                                    <CheckCheck size={12} className="text-slate-400" />
                                  )}
                                  {status === 'read' && (
                                    <CheckCheck size={12} className="text-blue-500" />
                                  )}
                                </span>
                              )}
                              {isMe && status === 'failed' && (
                                <div className="flex items-center gap-1 text-red-500 font-semibold mt-0.5 ml-1">
                                  <AlertCircle size={11} />
                                  <span>Failed</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSend(undefined, msg)}
                                    className="underline hover:text-red-700 font-bold transition-colors cursor-pointer ml-0.5"
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

              {/* Message Input Bar */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
                <div className="max-w-4xl mx-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-[#7A1F1F]/40 focus-within:ring-2 focus-within:ring-[#7A1F1F]/10 transition-all">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
              <div className="space-y-2 max-w-xs">
                <MessageSquare size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Select a Conversation</h3>
                <p className="text-xs text-slate-400">
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
