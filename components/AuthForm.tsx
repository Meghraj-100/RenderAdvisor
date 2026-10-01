'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type Mode = 'login' | 'register';

interface AuthFormProps {
  mode: Mode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Request failed');
      }

      if (mode === 'register') {
        router.push('/login?registered=1');
      } else {
        const from = searchParams.get('from') || '/';
        router.push(from);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto glass-card p-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        {mode === 'login'
          ? 'Use your EventHive-style account to access RenderAdvisor.'
          : 'Register to analyze Next.js rendering strategies.'}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-navy-950/60 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Your name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-navy-950/60 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : 1}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-navy-950/60 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
            placeholder={mode === 'register' ? 'At least 8 characters' : 'Password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 py-3 font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-opacity"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300">
              Register
            </Link>
          </>
        ) : (
          <>
            Already registered?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
