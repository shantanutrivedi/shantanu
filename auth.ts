import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      // Persist Google access_token so server routes can call Calendar API
      if (account?.access_token) token.accessToken = account.access_token;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // Expose accessToken to server-side session consumers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (token.accessToken) (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
})
