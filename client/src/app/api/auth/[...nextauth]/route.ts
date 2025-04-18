import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import { JWT, JWT as JWTType } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
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
        const db = client.db("Flowivate");

        const user = await db.collection("users").findOne<{
          _id: ObjectId;
          email: string;
          password: string;
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
          username: user.username || null // Include username in the user data
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
      // Initial sign in
      if (user) {
        token.id = user.id;
        
        // For social logins, create a username if one doesn't exist
        if (account && (account.provider === 'github' || account.provider === 'google')) {
          // Check if user already has a username in our database
          const client: MongoClient = await clientPromise;
          const db = client.db("Flowivate");
          
          const dbUser = await db.collection("users").findOne({ email: user.email });
          
          if (dbUser && dbUser.username) {
            token.username = dbUser.username;
          } else {
            // Create a username based on email or name
            let username = user.email?.split('@')[0] || '';
            
            // Make sure username is unique
            const existingUser = await db.collection("users").findOne({ username });
            if (existingUser) {
              // Append random string if username already exists
              username = `${username}${Math.floor(Math.random() * 1000)}`;
            }
            
            // Update user with username if they don't have one
            if (dbUser && !dbUser.username) {
              await db.collection("users").updateOne(
                { _id: new ObjectId(dbUser._id) },
                { $set: { username } }
              );
            }
            
            token.username = username;
          }
        } else {
          token.username = (user as { id: string; username?: string }).username;
        }
        
        console.log("JWT callback - Token after adding user data:", token);
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      console.log("Session callback - Token:", token);
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          username: token.username as string | null,
        };
      }
      console.log("Session callback - Session:", session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };