'use client';

import { Header } from '@/components/Header';
import { AuthProvider } from '@/components/AuthProvider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Header />
        <main className="pt-28 pb-12 px-4 sm:px-6 w-full max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
