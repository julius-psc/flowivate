import connectDB from "./mongoose";
import User from "@/app/models/User";

/**
 * Ensure the user has an active subscription.
 * Returns true if the user is active, false otherwise.
 */
export async function isProUser(userId: string): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("subscriptionStatus").exec();
  return user?.subscriptionStatus === "active";
}
