// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { JWT, JWT as JWTType } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { MongoClient, ObjectId } from "mongodb";

// Extend the default Session type to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
    };
  }
}

// Extend the JWT type to include id
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const client: MongoClient = await clientPromise;
        const db = client.db("Flowivate");

        // Define the expected user shape from MongoDB
        const user = await db.collection("users").findOne<{
          _id: ObjectId;
          email: string;
          password: string;
        }>({ email: credentials.email });

        if (!user) {
          throw new Error("No user found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Return user object compatible with NextAuth
        return { id: user._id.toString(), email: user.email };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWTType; user?: User }): Promise<JWTType> {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (token.id) {
        session.user = {
          ...session.user,
          id: token.id, // TypeScript now knows `id` is a string
        };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };