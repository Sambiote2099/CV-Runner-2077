import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [Google, GitHub],
  callbacks: {
    // Runs after OAuth succeeds but before session is written.
    // Returning false cancels login and redirects to /api/auth/error.
    async signIn({ user }) {
      if (!user.id) return true
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isBlocked: true },
      })
      // If blocked, refuse the sign-in entirely
      if (dbUser?.isBlocked) return false
      return true
    },
    async session({ session, user }) {
      session.user.id = user.id
      session.user.role = user.role
      return session
    },
  },
})