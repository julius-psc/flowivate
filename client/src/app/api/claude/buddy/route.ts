import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
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
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray(),
    db
      .collection("journalEntries")
      .find({ userId })
      .sort({ date: -1 })
      .limit(1)
      .toArray(),
    db
      .collection("journalEntries")
      .distinct("date", { userId, date: { $gte: sevenDaysAgo.toISOString() } }),
    db
      .collection("sleep")
      .find({ userId })
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
      prompt = `User (named ${
        session.user.name || "friend"
      }) just completed a whole task list! Awesome work. (1-2 lines)`;
      effect = "CONFETTI";
      break;

    case "POMO_FINISHED":
      if (context.pomoCountToday > 0 && context.pomoCountToday % 4 === 0) {
        prompt = `User (named ${
          session.user.name || "friend"
        }) just completed a full Pomodoro round (${
          context.pomoCountToday
        } sessions today)! Congratulate them on their deep focus. (1-2 lines)`;
        effect = "CONFETTI";
      } else {
        isSilent = true;
      }
      break;

    case "JOURNAL_SAVED":
      if (context.journalStreak === 7) {
        prompt = `User (named ${
          session.user.name || "friend"
        }) just hit a 7-day journaling streak! Acknowledge this awesome consistency. (1-2 lines)`;
        effect = "SPARKLE";
      } else {
        isSilent = true;
      }
      break;

    case "BOOK_LOGGED":
      if (context.bookCountMonth > 0 && context.bookCountMonth % 3 === 0) {
        prompt = `User (named ${
          session.user.name || "friend"
        }) just logged their ${
          context.bookCountMonth
        }th book this month! That's amazing. (1-2 lines)`;
        effect = "SPARKLE";
      } else {
        isSilent = true;
      }
      break;

    default:
      prompt = `You're Flowivate's concise and friendly productivity buddy.

Based on the following user context, generate a short, modern summary (no more than 4 lines), starting with a friendly greeting (e.g. "Hey ${
        session.user.name || "there"
      }!"). Use emoji section headers (e.g. 📋, 🧠, 😴, 💧) if helpful.

- Be positive but realistic.
- If mood is "sad", include a suggestion like "Want to talk about it?".
- If sleepHours < 6, suggest rest. If > 8, praise it.
- If no journal/tasks, say "Ready to start your day?".
- If productive (e.g., journalStreak > 0, pomoCountToday > 0), celebrate it.

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

    return NextResponse.json({ speech, effect });
  } catch (err) {
    console.error("Claude API call failed:", err);
    return NextResponse.json(
      { error: "Claude API call failed" },
      { status: 500 }
    );
  }
}