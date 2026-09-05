'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        {/* pt-32 gives comfortable breathing room below the fixed glass header */}
        <main className="flex-1 pt-32 pb-16 px-4 sm:px-6 w-full max-w-6xl mx-auto">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
