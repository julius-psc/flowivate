import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export async function logDailyActivity(userId: string | ObjectId) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "Flowivate");

        const userObjectId = typeof userId === "string" ? new ObjectId(userId) : userId;

        // Create date string in YYYY-MM-DD
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        await db.collection("dailyActivities").updateOne(
            { userId: userObjectId, date: dateStr },
            {
                $inc: { count: 1 },
                $setOnInsert: { userId: userObjectId, date: dateStr, count: 0 }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error("Error logging daily activity:", err);
    }
}
