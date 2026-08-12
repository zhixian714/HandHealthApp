import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      clinicId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    clinicId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    clinicId: string;
  }
}