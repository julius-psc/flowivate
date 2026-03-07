import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

interface TaskItem {
  completed: boolean;
  subtasks?: TaskItem[];
}

function countTasks(tasks: TaskItem[]): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  for (const task of tasks) {
    total++;
    if (task.completed) completed++;
    if (task.subtasks && task.subtasks.length > 0) {
      const sub = countTasks(task.subtasks);
      total += sub.total;
      completed += sub.completed;
    }
  }
  return { total, completed };
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }

    const userObjectId = new ObjectId(userId);
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

    const [
      userDoc,
      streakDoc,
      pomodoroDoc,
      taskListDocs,
      bookDocs,
      sleepDocs,
      moodDocs,
      journalTotalCount,
      journalMonthCount,
      waterDocs,
      dailyActivitiesDocs,
    ] = await Promise.all([
      db.collection("users").findOne({ _id: userObjectId }, { projection: { createdAt: 1, subscriptionStatus: 1 } }),
      db.collection("streaks").findOne({ userId: userObjectId }),
      db.collection("pomodoro").findOne({ userId: userObjectId }),
      db.collection("task_lists").find({ userId: userObjectId }).toArray(),
      db.collection("books").find({ userId: userObjectId }).toArray(),
      db.collection("sleep")
        .find({ userId: userObjectId, timestamp: { $gte: sevenDaysAgo } })
        .sort({ timestamp: 1 })
        .toArray(),
      db.collection("moods")
        .find({ userId: userObjectId, timestamp: { $gte: startOfMonth } })
        .toArray(),
      db.collection("journalEntries").countDocuments({ userId: userObjectId }),
      db.collection("journalEntries").countDocuments({
        userId: userObjectId,
        createdAt: { $gte: startOfMonth },
      }),
      db.collection("waterIntake")
        .find({ userId: userObjectId, date: { $gte: sevenDaysAgo } })
        .sort({ date: 1 })
        .toArray(),
      db.collection("dailyActivities")
        .find({ userId: userObjectId })
        .toArray(),
    ]);

    // Streak
    const streak = (streakDoc as { count?: number } | null)?.count ?? 0;

    // Focus sessions
    const focusSessions = (pomodoroDoc as { focusSessions?: number } | null)?.focusSessions ?? 0;

    // Tasks
    let totalTasks = 0;
    let completedTasks = 0;
    for (const list of taskListDocs) {
      const counts = countTasks((list as { tasks?: TaskItem[] }).tasks ?? []);
      totalTasks += counts.total;
      completedTasks += counts.completed;
    }

    // Books
    const totalBooks = bookDocs.length;
    const completedBooks = bookDocs.filter(
      (b) => (b as unknown as { status: string }).status === "completed"
    ).length;
    const inProgressBooks = bookDocs.filter(
      (b) => (b as unknown as { status: string }).status === "in-progress"
    ).length;
    const ratedBooks = bookDocs.filter((b) => typeof (b as unknown as { rating?: number }).rating === "number");
    const avgRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((sum, b) => sum + ((b as unknown as { rating: number }).rating ?? 0), 0) /
        ratedBooks.length
        : null;

    // Sleep: last 7 days with gap-filling
    const sleepByDate: Record<string, number> = {};
    for (const record of sleepDocs) {
      const date = new Date((record as unknown as { timestamp: Date }).timestamp);
      sleepByDate[formatDateKey(date)] = (record as unknown as { hours: number }).hours;
    }
    const sleepRecords = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const key = formatDateKey(d);
      return { date: key, hours: sleepByDate[key] ?? null };
    });

    // Mood distribution this month
    const moodCounts: Record<string, number> = {};
    for (const entry of moodDocs) {
      const mood = (entry as unknown as { mood: string }).mood;
      moodCounts[mood] = (moodCounts[mood] ?? 0) + 1;
    }
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
    }));

    // Water: last 7 days with gap-filling
    const waterByDate: Record<string, number> = {};
    for (const record of waterDocs) {
      const date = new Date((record as unknown as { date: Date }).date);
      waterByDate[formatDateKey(date)] = (record as unknown as { totalAmount: number }).totalAmount;
    }
    const waterRecords = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const key = formatDateKey(d);
      return { date: key, ml: waterByDate[key] ?? null };
    });

    const accountCreatedAt = (userDoc as unknown as { createdAt?: Date } | null)?.createdAt?.toISOString() ?? null;
    const subStatus = (userDoc as unknown as { subscriptionStatus?: string } | null)?.subscriptionStatus;
    const isElite = subStatus === "active" || subStatus === "pro";

    return NextResponse.json({
      isElite,
      accountCreatedAt,
      streak,
      focusSessions,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      books: {
        total: totalBooks,
        completed: completedBooks,
        inProgress: inProgressBooks,
        avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
      },
      sleep: sleepRecords,
      mood: moodDistribution,
      journal: {
        total: journalTotalCount,
        thisMonth: journalMonthCount,
      },
      water: waterRecords,
      dailyActivities: dailyActivitiesDocs.map((doc: any) => ({
        date: doc.date,
        count: doc.count
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/stats:", error);
    return NextResponse.json({ message: "Failed to retrieve stats" }, { status: 500 });
  }
}
