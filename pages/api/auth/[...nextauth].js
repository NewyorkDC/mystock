import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) { return token; },
    async session({ session, token }) {
      session.user.id = token.email;
      session.user.isAdmin = token.email === process.env.ADMIN_EMAIL;
      return session;
    },
  },
  pages: { signIn: "/" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
