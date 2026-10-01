import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-12">
      <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
