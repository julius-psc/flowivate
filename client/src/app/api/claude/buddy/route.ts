import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new ObjectId(session.user.id);
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const [affirmations, tasks, mood, journal, sleep] = await Promise.all([
    db.collection("users").findOne({ _id: userId }, { projection: { affirmations: 1 } }),
    db.collection("task_lists").find({ userId }).toArray(),
    db.collection("moods").find({ userId }).sort({ timestamp: -1 }).limit(1).toArray(),
    db.collection("journalEntries").find({ userId }).sort({ date: -1 }).limit(1).toArray(),
    db.collection("sleep").find({ userId }).sort({ timestamp: -1 }).limit(1).toArray(),
  ]);

  const formattedTasks = tasks.map((taskList) => {
    const completed = taskList.tasks.filter((t: { completed: boolean }) => t.completed).length;
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
    journal: journal[0]?.content || "",
    sleepHours: sleep[0]?.hours || null,
  };

  const messages = [
    {
      role: "user",
      content: `You're Flowivate's concise and friendly productivity buddy.

Based on the following user context, generate a short, modern summary (no more than 4 lines), starting with a friendly greeting (e.g. \"Hey Julius!\"). Use emoji section headers (e.g. 📋, 🧠, 😴, 💧) if helpful.

- Be positive but realistic.
- If mood is \"sad\", include a suggestion like \"Want to talk about it?\".
- If sleepHours < 6, suggest rest. If >8, praise it.
- If no journal/tasks, say \"Ready to start your day?\".
- If productive, celebrate it.

User data:
${JSON.stringify(context, null, 2)}`,
    },
  ];

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
      return NextResponse.json({ error: "Claude API error", details: errorText }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json({ reply: result.content?.[0]?.text || "No response." });
  } catch (err) {
    console.error("Claude API call failed:", err);
    return NextResponse.json({ error: "Claude API call failed" }, { status: 500 });
  }
}