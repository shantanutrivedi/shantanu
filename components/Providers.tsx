'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setCurrentUser } from '@/lib/store';

function SessionInit() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.id) {
      setCurrentUser(session.user.id);
    } else if (status === 'unauthenticated') {
      // Reset to guest so stateKey() falls back to LAST_USER_KEY correctly
      setCurrentUser('guest');
    }
  }, [session?.user?.id, status]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionInit />
      {children}
    </SessionProvider>
  );
}
