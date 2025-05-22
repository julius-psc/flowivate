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

  // Fetch user data
  const [affirmations, tasks, mood, journal] = await Promise.all([
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
  ]);

  // Format tasks to include completion stats
  const formattedTasks = tasks.map((taskList) => {
    // Define the Task type
    type Task = {
      completed: boolean;
    };

    const completedTasks: number = taskList.tasks.filter(
      (t: Task) => t.completed
    ).length;
    const totalTasks = taskList.tasks.length;
    return {
      name: taskList.name,
      completedTasks,
      totalTasks,
      progress:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });

  // Prepare context for Claude
  const context = {
    affirmations: affirmations?.affirmations || [],
    tasks: formattedTasks,
    mood: mood[0]?.mood || "Unknown",
    journal: journal[0]?.content || "",
  };

  // Create prompt for Claude that encourages a more JARVIS-like interaction
  const messages = [
    {
      role: "user",
      content: `You're Flowivate's concise and friendly productivity buddy.

Based on the following user context, generate a short, modern summary (no more than 4 lines), starting with a friendly greeting (e.g. "Hey Julius!"). Use a grid-style format separated by emoji headers if helpful (e.g. 📋, 🧠, 💧).

- Be positive but realistic.
- If mood is "sad", include a suggestion like "Want to talk about it?".
- If no journal or tasks, say something like "Ready to start your day?".
- If very productive, acknowledge with something like "Great job today! 👏".

Here is the user's current data:\n${JSON.stringify(context, null, 2)}`,
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
      const errorBody = await response.text();
      return NextResponse.json(
        { error: "Claude API error", details: errorBody },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      reply: result.content?.[0]?.text || "No response.",
    });
  } catch (error) {
    console.error("Claude API call failed:", error);
    return NextResponse.json(
      { error: "Claude API call failed" },
      { status: 500 }
    );
  }
}