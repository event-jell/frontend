import React from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Layers,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useState } from 'react';
import type { WalletTransaction } from '../../types';
import { formatCurrency, formatLocalDate, formatLocalTime } from '../../utils/formatters';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: WalletTransaction | null;
  timezone?: string;
  locale?: string;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  timezone,
  locale,
}: TransactionDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="text-green-600" size={16} />;
      case 'pending':
        return <Clock className="text-amber-500" size={16} />;
      case 'failed':
      case 'cancelled':
        return <AlertTriangle className="text-red-500" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatTxType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden space-y-6">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center text-center space-y-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
              transaction.direction === 'credit'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft size={24} />
            ) : (
              <ArrowUpRight size={24} />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {formatTxType(transaction.type)}
            </span>
            <span className="text-slate-800 text-sm font-semibold block mt-0.5">
              {transaction.description}
            </span>
          </div>
          <div className="pt-2">
            <span
              className={`text-3xl font-black ${
                transaction.direction === 'credit' ? 'text-green-700' : 'text-slate-950'
              }`}
            >
              {transaction.direction === 'credit' ? '+' : '-'}
              {formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
          <div className="pt-1 flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(
                transaction.status
              )}`}
            >
              {getStatusIcon(transaction.status)}
              <span>{transaction.status}</span>
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          {/* Reference */}
          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-slate-400" />
              <span>Reference</span>
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span>{transaction.reference}</span>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy reference"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Date Created */}
          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>Date & Time</span>
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {formatLocalDate(transaction.createdAt, {
                timezone,
                locale,
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              at{' '}
              {formatLocalTime(transaction.createdAt, {
                timezone,
                locale,
              })}
            </span>
          </div>

          {/* Breakdown: Fee & Net Amount */}
          {(transaction.fee > 0 || transaction.direction === 'debit') && (
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-slate-400" />
                  <span>Transaction Fee</span>
                </span>
                <span className="font-semibold text-slate-600">
                  {formatCurrency(transaction.fee, transaction.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-400" />
                  <span>Net Amount</span>
                </span>
                <span className="font-black text-slate-900">
                  {formatCurrency(transaction.net_amount, transaction.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Provider Details (from Metadata if present) */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Additional Info
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(transaction.metadata).map(([key, val]) => {
                  if (typeof val === 'object' || typeof val === 'function') return null;
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-slate-700 break-all">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
