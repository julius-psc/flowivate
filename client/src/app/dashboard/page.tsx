import { redirect } from "next/navigation";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // 1. require auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    // not signed in → force login
    redirect("/api/auth/signin");
  }

  // 2. load subscriptionStatus once on the server
  await connectToDB();
  const user = await User.findOne({ email: session.user.email })
    .select("subscriptionStatus")
    .lean();
  const subscriptionStatus: "active" | "canceled" | "past_due" | "free" =
    user?.subscriptionStatus === "active" ||
    user?.subscriptionStatus === "canceled" ||
    user?.subscriptionStatus === "past_due"
      ? user.subscriptionStatus
      : "free";

  // 3. pass it down to a client component
  return <DashboardClient subscriptionStatus={subscriptionStatus} />;
}