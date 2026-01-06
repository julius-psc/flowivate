
import clientPromise from "../src/lib/mongodb";
import { ObjectId, Document } from "mongodb";

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

interface SleepDoc extends Document {
    userId: ObjectId;
    hours: number;
    timestamp: Date;
}

interface MoodDoc extends Document {
    userId: ObjectId;
    mood: string;
    timestamp: Date;
}

interface TaskDoc extends Document {
    userId: ObjectId;
    name: string;
    completed: boolean;
}

interface JournalDoc extends Document {
    userId: ObjectId;
    content: string;
    createdAt: Date;
}

export async function getUserContext(userId: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DEFAULT_DB_NAME);
        const userObjectId = new ObjectId(userId);

        const today = new Date();
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);

        // 1. SLEEP: Last 3 records
        const sleepDocs = await db.collection<SleepDoc>("sleep")
            .find({
                userId: userObjectId,
                timestamp: { $gte: threeDaysAgo }
            })
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();

        const sleepContext = sleepDocs.map((doc: SleepDoc) =>
            `- ${new Date(doc.timestamp).toLocaleDateString()}: ${doc.hours} hours`
        ).join("\n");

        // 2. MOOD: Last 3 records
        const moodDocs = await db.collection<MoodDoc>("moods")
            .find({
                userId: userObjectId,
                timestamp: { $gte: threeDaysAgo }
            })
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();

        const moodContext = moodDocs.map((doc: MoodDoc) =>
            `- ${new Date(doc.timestamp).toLocaleDateString()}: ${doc.mood}`
        ).join("\n");

        // 3. TASKS: Pending count and top 3
        const tasksCollection = db.collection<TaskDoc>("tasks");
        const incompleteCount = await tasksCollection.countDocuments({
            userId: userObjectId,
            completed: false
        });
        const topTasks = await tasksCollection
            .find({ userId: userObjectId, completed: false })
            .limit(3)
            .toArray();

        const taskContext = `Pending Tasks: ${incompleteCount}\n` +
            topTasks.map((t: TaskDoc) => `- ${t.name || "Untitled"}`).join("\n");

        // 4. JOURNAL: Latest entry
        const journalDocs = await db.collection<JournalDoc>("journal")
            .find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        const journalContext = journalDocs.length > 0
            ? `Last Journal (${new Date(journalDocs[0].createdAt).toLocaleDateString()}): ${journalDocs[0].content?.substring(0, 200)}...`
            : "No recent journal entries.";

        // Construct the context string
        const systemContext = `
[CURRENT USER CONTEXT]
The user's recent data is provided below. Use this to personalize your advice.
Sleep (Last 3 days):
${sleepContext || "No recent sleep data."}

Mood (Last 3 days):
${moodContext || "No recent mood data."}

Tasks:
${taskContext}

Journal:
${journalContext}
[/CURRENT USER CONTEXT]
    `.trim();

        return systemContext;

    } catch (error) {
        console.error("Error fetching user context:", error);
        return "";
    }
}
