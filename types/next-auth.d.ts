import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      clinicId: string | null;
      clinicName: string | null;
      organizationId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    clinicId: string | null;
    clinicName: string | null;
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    clinicId: string | null;
    clinicName: string | null;
    organizationId: string | null;
  }
}
