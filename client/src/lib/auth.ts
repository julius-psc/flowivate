import NextAuth, {
  type NextAuthConfig,
  type User as NextAuthUser,
  type Session,
} from "next-auth";
import { type JWT as JWTType } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

import connectDB from "@/lib/mongoose";
import User, { IUser } from "@/app/models/User";
import bcrypt from "bcrypt";

const MONGODB_DB = process.env.MONGODB_DB;
if (!MONGODB_DB) throw new Error("❌ MONGODB_DB environment variable not set");

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: MONGODB_DB }),

  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
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
    async jwt({ token, user, account, trigger }): Promise<JWTType> {
      await connectDB();

      if (trigger === "update") {
        const dbUser = await User.findById(token.id).select("username image onboardingCompleted").lean().exec();
        if (dbUser) {
          token.username = dbUser.username;
          token.image = dbUser.image;
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
        }
        return token;
      }

      if (user) {
        token.id = user.id;
        token.username = user.username ?? undefined;
        token.image = user.image ?? undefined;
      }

      if (account && ["github", "google"].includes(account.provider)) {
        const dbUser = await User.findOne<IUser>({ email: user.email }).exec();

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
          let changed = false;

          if (user.name && dbUser.name !== user.name) {
            dbUser.name = user.name;
            changed = true;
          }
          if (user.image && dbUser.image !== user.image) {
            dbUser.image = user.image;
            changed = true;
          }
          if (!dbUser.username) {
            const baseUsername =
              user.email?.split("@")[0] ||
              user.name?.replace(/\s+/g, "").toLowerCase() ||
              `user${Date.now()}`;

            let potential = baseUsername;
            let i = 0;
            while (await User.findOne({ username: potential }).exec()) {
              i++;
              potential = `${baseUsername}${i}`;
            }
            dbUser.username = potential;
            changed = true;
          }

          if (changed) await dbUser.save();
          token.username = dbUser.username;
          token.image = dbUser.image;
        } else {
          token.username = user.email?.split("@")[0];
          token.onboardingCompleted = false;
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
      session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },

    async signIn({ user, account }) {
      if (account?.provider && ["github", "google"].includes(account.provider)) {
        await connectDB();
        const dbUser = await User.findOne<IUser>({ email: user.email }).exec();

        if (dbUser && !dbUser.onboardingCompleted) {
          return "/onboarding";
        }
      }
      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);