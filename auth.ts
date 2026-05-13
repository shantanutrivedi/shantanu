import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
      refresh_token: token.refreshToken,
    }),
  });
  const refreshed = await res.json();
  if (!res.ok) throw refreshed;
  return {
    ...token,
    accessToken:  refreshed.access_token,
    // expires_in is in seconds; convert to ms timestamp
    expiresAt:    Date.now() + refreshed.expires_in * 1000,
    // Google only sends a new refresh token if it rotated — keep old one otherwise
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    error:        undefined,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:       'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt:      'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in, persist all OAuth credentials
      if (account) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          // expires_at from NextAuth is already a UTC seconds timestamp
          expiresAt:    account.expires_at
            ? account.expires_at * 1000          // convert to ms
            : Date.now() + 3600 * 1000,          // default 1 h
        };
      }

      // Token still valid — return as-is (leave a 60-second buffer)
      if (Date.now() < (token.expiresAt as number) - 60_000) {
        return token;
      }

      // Token expired — try to refresh
      if (!token.refreshToken) {
        return { ...token, error: 'no_refresh_token' };
      }

      try {
        return await refreshAccessToken(token);
      } catch {
        return { ...token, error: 'refresh_failed' };
      }
    },

    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = session as any;
      s.accessToken = token.accessToken;
      if (token.error) s.tokenError = token.error;
      return session;
    },
  },
  pages: { signIn: '/' },
})
