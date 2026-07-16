import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Mail, Check, Users, Loader2 } from 'lucide-react';
import { useAddCollaborator } from '../../hooks/useEvents';

interface Props {
  planName: string;
  eventId?: string;
  onClose: () => void;
}

export default function ShareModal({ planName, eventId, onClose }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState(false);
  const addCollaborator = useAddCollaborator();

  const link = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !eventId) return;
    addCollaborator.mutate({ eventId, email, role: 'viewer' }, {
      onSuccess: () => {
        setInvited(true);
        setEmail('');
        setTimeout(() => setInvited(false), 3000);
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">{t('planner.share_title')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{planName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 shadow-sm">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Link sharing */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Users size={16} className="text-[#7A1F1F]" />
              {t('planner.share_link')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{t('planner.share_view_desc')}</p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 truncate">
                {link}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  copied 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t('planner.share_copied') : t('planner.share_copy')}
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100 my-6" />

          {/* Email Invite */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Mail size={16} className="text-[#7A1F1F]" />
              {t('planner.share_invite_title')}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{t('planner.share_invite_desc')}</p>

            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder={t('planner.share_email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  {t('planner.share_can_view')}
                </span>
                <button
                  type="submit"
                  disabled={!email || addCollaborator.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#7A1F1F] text-white rounded-lg text-sm font-semibold hover:bg-[#5C1414] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addCollaborator.isPending && <Loader2 size={14} className="animate-spin" />}
                  {t('planner.share_send_invite')}
                </button>
              </div>
              {invited && (
                <p className="text-xs text-green-600 font-medium mt-1">{t('planner.share_success')}</p>
              )}
              {addCollaborator.isError && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  {(addCollaborator.error as any)?.response?.data?.message ?? 'Could not send invite.'}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
