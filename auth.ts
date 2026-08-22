import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clinicId: user.clinicId,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.clinicId = token.clinicId as string | null;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
