'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import type { SafeUser } from '@/lib/auth/user.types';

export default function AuthHeader() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setUser(json.data);
        } else if (res.status === 401) {
          const refresh = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          if (refresh.ok) {
            const me = await fetch('/api/auth/me', { credentials: 'include' });
            if (me.ok) {
              const json = await me.json();
              if (!cancelled) setUser(json.data);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto mb-6 h-10 flex justify-end">
        <div className="h-9 w-32 rounded-lg bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mb-6 flex items-center justify-between gap-4">
      <Link href="/" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
        RenderAdvisor
      </Link>
      <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-xl">
        <User size={16} className="text-teal-400 shrink-0" />
        <div className="text-sm text-left min-w-0">
          <p className="font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
