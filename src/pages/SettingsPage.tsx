import { useAuth } from '../contexts/AuthContext';
import { User, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <User size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Profile Information</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6 mb-8">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-slate-500">Event Planner</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.firstName || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.lastName || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Bell size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Notifications</h2>
            </div>
            <div className="p-6 text-center text-slate-500 text-sm">
              Notification settings coming soon.
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Shield size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Security</h2>
            </div>
            <div className="p-6 text-center text-slate-500 text-sm">
              Security settings coming soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
