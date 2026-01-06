import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event } = (await req.json()) as { event?: string };
  const userId = new ObjectId(session.user.id);
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [
    affirmations,
    tasks,
    mood,
    latestJournal,
    journalDaysStreak,
    sleep,
    pomoCountToday,
    bookCountMonth,
  ] = await Promise.all([
    db
      .collection("users")
      .findOne({ _id: userId }, { projection: { affirmations: 1 } }),
    db.collection("task_lists").find({ userId }).toArray(),
    db
      .collection("moods")
      .find({ userId, timestamp: { $gte: today } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray(),
    db
      .collection("journalEntries")
      .find({ userId, date: { $gte: today.toISOString() } })
      .sort({ date: -1 })
      .limit(1)
      .toArray(),
    db
      .collection("journalEntries")
      .distinct("date", { userId, date: { $gte: sevenDaysAgo.toISOString() } }),
    db
      .collection("sleep")
      .find({ userId, timestamp: { $gte: today } })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray(),
    db
      .collection("pomodoros")
      .countDocuments({ userId, timestamp: { $gte: today } }),
    db
      .collection("books")
      .countDocuments({ userId, loggedDate: { $gte: thirtyDaysAgo } }),
  ]);

  const formattedTasks = tasks.map((taskList) => {
    const completed = taskList.tasks.filter(
      (t: { completed: boolean }) => t.completed
    ).length;
    const total = taskList.tasks.length;
    return {
      name: taskList.name,
      completedTasks: completed,
      totalTasks: total,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const context = {
    affirmations: affirmations?.affirmations || [],
    tasks: formattedTasks,
    mood: mood[0]?.mood || "Unknown",
    journal: latestJournal[0]?.content || "",
    journalStreak: journalDaysStreak.length,
    sleepHours: sleep[0]?.hours || null,
    pomoCountToday: pomoCountToday,
    bookCountMonth: bookCountMonth,
  };

  let prompt = "";
  let effect: "CONFETTI" | "SPARKLE" | null = null;
  let isSilent = false;

  switch (event) {
    case "TASK_COMPLETED":
      isSilent = true;
      break;

    case "TASK_LIST_COMPLETED":
      prompt = `User (named ${session.user.name || "friend"
        }) just completed a whole task list! Awesome work. (1-2 lines)`;
      effect = "CONFETTI";
      break;

    case "POMO_FINISHED":
      if (context.pomoCountToday > 0 && context.pomoCountToday % 4 === 0) {
        prompt = `User (named ${session.user.name || "friend"
          }) just completed a full Pomodoro round (${context.pomoCountToday
          } sessions today)! Congratulate them on their deep focus. (1-2 lines)`;
        effect = "CONFETTI";
      } else {
        isSilent = true;
      }
      break;

    case "JOURNAL_SAVED":
      if (context.journalStreak === 7) {
        prompt = `User (named ${session.user.name || "friend"
          }) just hit a 7-day journaling streak! Acknowledge this awesome consistency. (1-2 lines)`;
        effect = "SPARKLE";
      } else {
        isSilent = true;
      }
      break;

    case "BOOK_LOGGED":
      if (context.bookCountMonth > 0 && context.bookCountMonth % 3 === 0) {
        prompt = `User (named ${session.user.name || "friend"
          }) just logged their ${context.bookCountMonth
          }th book this month! That's amazing. (1-2 lines)`;
        effect = "SPARKLE";
      } else {
        isSilent = true;
      }
      break;

    default:
      prompt = `You're Flowivate's concise and friendly productivity buddy.

Based on the following user context, generate a VERY SHORT summary (max 2 sentences).
Start with a friendly greeting.

- ONLY comment on data that is present and positive.
- CRITICAL: Do NOT ask the user to do things (like "Ready to start?" or "Log your sleep"). We handle missing data with UI buttons.
- CRITICAL: Do NOT mention missing data (sleep, mood, journal).
- If everything is missing, just say "Hey there! Ready to conquer the day?".
- Be punchy and motivating.

User data:
${JSON.stringify(context, null, 2)}`;
      break;
  }

  if (isSilent) {
    return NextResponse.json({ speech: "SILENT_NO_OP", effect: null });
  }

  const messages = [{ role: "user", content: prompt }];

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Claude API error", details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    const speech = result.content?.[0]?.text || "No response.";

    // Identify missing essentials for the frontend to handle
    const missingData = {
      sleep: !context.sleepHours,
      mood: context.mood === "Unknown",
      journal: !context.journal,
      tasks: context.tasks.length === 0,
    };

    return NextResponse.json({ speech, effect, missingData });
  } catch (err) {
    console.error("Claude API call failed:", err);
    return NextResponse.json(
      { error: "Claude API call failed" },
      { status: 500 }
    );
  }
}