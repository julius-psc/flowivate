import { NextAuthOptions, User as NextAuthUser, Session } from "next-auth";
import { JWT as JWTType } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

import connectDB from "@/lib/mongoose";
import User, { IUser } from "@/app/models/User";
import bcrypt from "bcrypt";

// Grab the same DB name you use in mongoose.ts
const MONGODB_DB = process.env.MONGODB_DB;
if (!MONGODB_DB) {
  throw new Error("❌ MONGODB_DB environment variable not set");
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      username?: string | null;
      image?: string | null;
      name?: string | null;
    };
  }
  interface User {
    id: string;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: MONGODB_DB }),

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      // ← Allow linking to existing email-based accounts
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // ← Same here
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        await connectDB();
        const user = await User.findOne<IUser>({ email: credentials.email }).exec();
        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }): Promise<JWTType> {
      if (user) token.id = user.id;

      if (account && ["github", "google"].includes(account.provider)) {
        await connectDB();
        const dbUser = await User.findOne<IUser>({ email: user.email }).exec();
        if (dbUser) {
          token.id = dbUser._id.toString();
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
        } else {
          console.warn(`No user in Mongoose for OAuth email ${user.email}`);
          token.username = user.email?.split("@")[0];
        }
      } else if (user?.username) {
        token.username = user.username;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWTType }): Promise<Session> {
      if (token.id) session.user.id = token.id;
      if (token.username) session.user.username = token.username;
      return session;
    },
  },
};
