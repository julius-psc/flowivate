import { NextAuthOptions, Session, User } from "next-auth";
import { JWT as JWTType } from "next-auth/jwt"; // Keep JWT import consistent
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb"; // Ensure this path is correct from the new file location
import bcrypt from "bcrypt";
import { MongoClient, ObjectId } from "mongodb";

// Extend the default Session type to include user.id and username
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      username?: string | null;
      image?: string | null;
    };
  }
}

// Extend the JWT type to include id and username
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
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
        const db = client.db("Flowivate"); // Use your actual database name

        const user = await db.collection("users").findOne<{
          _id: ObjectId;
          email: string;
          password: string; // Ensure this is the hashed password
          username?: string;
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

        const userData = {
          id: user._id.toString(),
          email: user.email,
          username: user.username || null
        };
        console.log("User authenticated:", userData);
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
    async jwt({ token, user, account }: { token: JWTType; user?: User; account?: Record<string, unknown> | null }): Promise<JWTType> {
      if (user) {
        token.id = user.id;

        if (account && (account.provider === 'github' || account.provider === 'google')) {
          const client: MongoClient = await clientPromise;
          const db = client.db("Flowivate"); // Use your actual database name

          const dbUser = await db.collection("users").findOne({ email: user.email });

          if (dbUser && dbUser.username) {
            token.username = dbUser.username;
          } else {
            let username = user.email?.split('@')[0] || `user${Date.now()}`; // Ensure username is always set

            let potentialUsername = username;
            while (await db.collection("users").findOne({ username: potentialUsername })) {
              potentialUsername = `<span class="math-inline">\{username\}</span>{Math.floor(Math.random() * 1000) + attempt}`;
            }
            username = potentialUsername;

            if (dbUser && !dbUser.username) {
              await db.collection("users").updateOne(
                { _id: new ObjectId(dbUser._id) },
                { $set: { username } }
              );
            } else if (!dbUser && user.email) { 
            }
            token.username = username;
          }
        } else if (user) { // For credentials provider
          token.username = (user as { username?: string }).username;
        }
        console.log("JWT callback - Token after adding user data:", token);
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWTType }): Promise<Session> {
      console.log("Session callback - Token:", token);
      if (token) {
        session.user = {
          ...session.user, // Spread existing session.user properties like email, image
          id: token.id as string,
          username: token.username as string | null,
        };
      }
      console.log("Session callback - Session:", session);
      return session;
    },
  },
};