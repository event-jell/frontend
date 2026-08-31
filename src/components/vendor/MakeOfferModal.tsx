import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Tag, Loader2, ShieldCheck, Handshake } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSendMessage } from '../../hooks/useMessages';
import { useLocale } from '../../hooks/useLocale';
import { getCurrencySymbol } from '../../utils/formatters';
import type { VendorListing } from '../../types';
import { toast } from 'sonner';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: VendorListing;
}

export default function MakeOfferModal({ isOpen, onClose, listing }: MakeOfferModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { localCurrency } = useLocale();
  const sendMessage = useSendMessage();

  const vendorId =
    typeof (listing as any).owner_id === 'object'
      ? ((listing as any).owner_id as any)?._id
      : (listing.owner_id || (listing as any).user_id);

  const displayCurrency = listing.currency || localCurrency || 'USD';
  const currencySymbol = getCurrencySymbol(displayCurrency);

  const [offerAmount, setOfferAmount] = useState<string>(
    listing.base_price ? String(listing.base_price) : ''
  );
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to make an offer');
      return;
    }

    const amount = parseFloat(offerAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }

    const buyerId = (user as any)._id || (user as any).id;
    if (!vendorId || vendorId === buyerId) {
      toast.error('Cannot make an offer to yourself');
      return;
    }

    setIsSubmitting(true);
    try {
      const offerContent = `💼 Offer: ${currencySymbol}${amount.toLocaleString()} for ${listing.title}${note ? `\n\nNote: ${note}` : ''}`;

      const msg = await sendMessage.mutateAsync({
        recipient_id: vendorId,
        content: offerContent,
        vendor_listing_id: listing._id,
        message_type: 'offer',
        offer_amount: amount,
      });

      const conversationId = (msg as any).conversation_id;
      toast.success('Offer sent! Starting negotiation chat...');
      onClose();
      navigate(`/messages/${conversationId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
              <img
                src={listing.cover_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80'}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-[#7A1F1F] uppercase tracking-wider block">
                Make an Offer
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{listing.title}</h2>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                Listed at{' '}
                <span className="font-extrabold text-slate-800">
                  {currencySymbol}{(listing.base_price || 0).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Offer Amount */}
          <div>
            <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Your Offer ({displayCurrency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={`e.g. ${(listing.base_price || 0).toLocaleString()}`}
                className="w-full pl-8 pr-4 py-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/25 focus:border-[#7A1F1F]/50"
                required
              />
            </div>
            {listing.base_price && parseFloat(offerAmount) > 0 && parseFloat(offerAmount) < listing.base_price && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <Tag size={10} />
                Your offer is below the listed price — the vendor may counter
              </p>
            )}
          </div>

          {/* Optional note */}
          <div>
            <label className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Message to Vendor <span className="text-slate-400 normal-case font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Looking for a 4-hour package for 200 guests. Can you accommodate?"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/25 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold">
              <MessageSquare size={11} className="shrink-0" />
              Your offer opens a direct chat with the vendor
            </p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={11} className="shrink-0 text-emerald-600" />
              <span className="text-slate-500">Payments are processed securely within the platform</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !offerAmount || parseFloat(offerAmount) <= 0}
              className="px-5 py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Sending Offer...</span>
                </>
              ) : (
                <>
                  <Handshake size={13} />
                  <span>Send Offer & Start Chat</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
