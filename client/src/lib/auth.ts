import NextAuth, {
  type NextAuthConfig,
  type User as NextAuthUser,
  type Session,
} from "next-auth";
import { type JWT as JWTType } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import connectDB from "@/lib/mongoose";
import User, { IUser } from "@/app/models/User";
import bcrypt from "bcrypt";

const MONGODB_DB = process.env.MONGODB_DB;
if (!MONGODB_DB) throw new Error("❌ MONGODB_DB environment variable not set");

export const authConfig: NextAuthConfig = {
  // Removed MongoDBAdapter to handle user creation manually with Mongoose validation
  // adapter: MongoDBAdapter(clientPromise, { databaseName: MONGODB_DB }),

  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
        },
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Both email and password are required.");
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(credentials.email as string)) {
            throw new Error("Invalid email format.");
          }

          await connectDB();
          const user = await User.findOne<IUser>({
            email: credentials.email,
          }).exec();

          if (!user) {
            throw new Error("No account found with this email.");
          }

          if (!user.password) {
            throw new Error("This account doesn't support password login.");
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) {
            throw new Error("Incorrect password.");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            name: user.name,
            image: user.image,
            authProvider: user.authProvider ?? "credentials",
            subscriptionStatus: user.subscriptionStatus ?? "free",
          };
        } catch (err) {
          if (err instanceof Error) throw err;
          throw new Error("Unexpected error during login.");
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider && ["github", "google"].includes(account.provider)) {
        await connectDB();

        if (!user.email) return false;

        try {
          const existingUser = await User.findOne<IUser>({ email: user.email }).exec();

          if (!existingUser) {
            // New User Creation
            let baseUsername =
              user.email.split("@")[0] ||
              user.name?.replace(/\s+/g, "").toLowerCase() ||
              `user${Date.now()}`;

            // Ensure unique username
            let uniqueUsername = baseUsername;
            let i = 0;
            while (await User.exists({ username: uniqueUsername })) {
              i++;
              uniqueUsername = `${baseUsername}${i}`;
            }

            await User.create({
              email: user.email,
              name: user.name || uniqueUsername,
              image: user.image,
              username: uniqueUsername,
              authProvider: account.provider,
              subscriptionStatus: "free",
            });

            return true;
          }

          // Existing user: always allow sign in
          return true;
        } catch (error) {
          console.error("Error during social sign in:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger }): Promise<JWTType> {
      await connectDB();

      if (trigger === "update") {
        const dbUser = await User.findById(token.id).select("username image authProvider subscriptionStatus").lean().exec();
        if (dbUser) {
          token.username = dbUser.username;
          token.image = dbUser.image;
          token.authProvider = dbUser.authProvider ?? null;
          token.subscriptionStatus = dbUser.subscriptionStatus ?? "free";
        }
        return token;
      }

      if (user) {
        // This runs on sign in.
        // User should already exist in DB due to signIn callback.
        // But we might need to fetch the DB ID if 'user' object from provider doesn't have it (it usually doesn't for social login initially unless adapter is used).

        if (account && ["github", "google"].includes(account.provider)) {
          if (user.email) {
            const dbUser = await User.findOne<IUser>({ email: user.email }).exec();
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.username = dbUser.username;
              token.image = dbUser.image || user.image;
              token.authProvider = dbUser.authProvider as "google" | "github";
              token.subscriptionStatus = dbUser.subscriptionStatus ?? "free";
            }
          }
        } else {
          // Credentials login
          token.id = user.id;
          token.username = user.username ?? undefined;
          token.image = user.image ?? undefined;
          token.subscriptionStatus = (user as any).subscriptionStatus ?? "free";
          token.authProvider = (user as any).authProvider || "credentials";
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWTType;
    }): Promise<Session> {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.username) {
        session.user.username = token.username as string;
      }
      if (token.image) {
        session.user.image = token.image as string;
      } else {
        session.user.image = null;
      }

      session.user.authProvider = token.authProvider as "google" | "github" | "credentials" | null ?? null;
      session.user.subscriptionStatus = token.subscriptionStatus as string ?? "free";
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);