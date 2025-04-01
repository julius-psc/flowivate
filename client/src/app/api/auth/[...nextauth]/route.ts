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
          console.log("Missing credentials");
          throw new Error("Missing credentials");
        }

        const client: MongoClient = await clientPromise;
        const db = client.db("Flowivate");

        const user = await db.collection("users").findOne<{
          _id: ObjectId;
          email: string;
          password: string;
        }>({ email: credentials.email });

        if (!user) {
          console.log("No user found for email:", credentials.email);
          throw new Error("No user found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log("Invalid password for email:", credentials.email);
          throw new Error("Invalid password");
        }

        const userData = { id: user._id.toString(), email: user.email };
        console.log("User authenticated:", userData); // Debug: Confirm user is returned
        return userData;
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
        console.log("JWT callback - Token after adding user data:", token); // Debug: Log token
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      console.log("Session callback - Token:", token); // Debug: Log token in session callback
      if (token.id) {
        session.user = {
          ...session.user,
          id: token.id,
        };
      }
      console.log("Session callback - Session:", session); // Debug: Log session
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };