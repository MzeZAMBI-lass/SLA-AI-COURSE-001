'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
      >
        {loading ? 'Signing out…' : 'Logout'}
      </button>
    </div>
  );
}
