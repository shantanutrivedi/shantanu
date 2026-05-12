'use client';
import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setCurrentUser } from '@/lib/store';

function SessionInit() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user?.id) {
      setCurrentUser(session.user.id);
    }
  }, [session?.user?.id]);
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
