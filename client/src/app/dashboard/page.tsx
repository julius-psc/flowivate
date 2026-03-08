import { redirect } from "next/navigation";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";
import { isEliteStatus } from "@/lib/subscription";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  await connectToDB();
  const user = await User.findOne({ email: session.user.email })
    .select("subscriptionStatus")
    .lean();

  const rawStatus = user?.subscriptionStatus ?? "free";
  const subscriptionStatus: "active" | "canceled" | "past_due" | "free" =
    isEliteStatus(rawStatus) ? "active"
      : rawStatus === "canceled" || rawStatus === "past_due"
        ? rawStatus
        : "free";

  return <DashboardClient subscriptionStatus={subscriptionStatus} />;
}