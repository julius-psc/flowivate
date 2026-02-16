import { redirect } from "next/navigation";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

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

  return <DashboardClient subscriptionStatus={subscriptionStatus} />;
}