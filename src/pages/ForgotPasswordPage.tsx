import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { authApi } from '../lib/api';
import Logo from '../components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  const errorMessage = mutation.error instanceof Error
    ? (mutation.error as any).response?.data?.message ?? mutation.error.message
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send a reset token</p>
        </div>

        {errorMessage && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-500 text-sm">{errorMessage}</p>
          </div>
        )}

        {mutation.isSuccess ? (
          <div className="space-y-4">
            <div className="px-3 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">
                {mutation.data.message || 'Reset token generated.'}
              </p>
            </div>
            {mutation.data.resetToken && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Your reset token:</p>
                <code className="block w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 break-all font-mono select-all">
                  {mutation.data.resetToken}
                </code>
                <p className="text-xs text-gray-400 mt-1">Copy this token and use it to reset your password.</p>
              </div>
            )}
            <Link
              to="/reset-password"
              className="block w-full text-center bg-[#7A1F1F] hover:bg-[#5C1414] text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Reset my password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full pl-9 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-[#7A1F1F] hover:bg-[#5C1414] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Sending…' : 'Send reset token'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-[#7A1F1F] font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
