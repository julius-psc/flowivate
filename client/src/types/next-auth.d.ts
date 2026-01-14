import { User as DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type AuthProvider = "google" | "github" | "credentials" | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      onboardingCompleted?: boolean;
      authProvider?: AuthProvider;
      subscriptionStatus?: string;
    } & DefaultUser;
  }

  interface User extends DefaultUser {
    username?: string | null;
    onboardingCompleted?: boolean;
    authProvider?: AuthProvider;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string;
    onboardingCompleted?: boolean;
    authProvider?: AuthProvider;
    subscriptionStatus?: string;
  }
}