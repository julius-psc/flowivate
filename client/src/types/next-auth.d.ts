import { User as DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type AuthProvider = "google" | "github" | "credentials" | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      authProvider?: AuthProvider;
      subscriptionStatus?: string;
    } & DefaultUser;
  }

  interface User extends DefaultUser {
    username?: string | null;
    authProvider?: AuthProvider;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string;
    authProvider?: AuthProvider;
    subscriptionStatus?: string;
  }
}