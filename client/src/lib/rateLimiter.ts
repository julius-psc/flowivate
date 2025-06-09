import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

// CONFIGURE HERE:
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function isRateLimited(userId: string, route: string, maxRequests: number): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "Flowivate");
  const collection = db.collection("rate_limits");

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  const userObjectId = new ObjectId(userId);

  const record = await collection.findOne({
    userId: userObjectId,
    route,
  });

  if (!record) {
    await collection.insertOne({
      userId: userObjectId,
      route,
      requests: 1,
      firstRequestAt: now,
    });
    return false;
  }

  if (record.firstRequestAt < windowStart) {
    await collection.updateOne(
      { _id: record._id },
      {
        $set: { firstRequestAt: now, requests: 1 },
      }
    );
    return false;
  }

  if (record.requests >= maxRequests) {
    return true;
  }

  await collection.updateOne(
    { _id: record._id },
    {
      $inc: { requests: 1 },
    }
  );

  return false;
}

