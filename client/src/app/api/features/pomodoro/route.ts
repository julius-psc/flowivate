import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";

// Type for Pomodoro Settings
interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakAfter: number;
}

// Type for Pomodoro Data stored in MongoDB
interface PomodoroData {
  email: string;
  pomodoroSettings: PomodoroSettings;
  focusSessions: number;
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const pomodoroData = await pomodoroCollection.findOne({ email });

    if (!pomodoroData) {
      // If no settings exist, return default settings
      const defaultSettings: PomodoroSettings = {
        focusTime: 25 * 60,
        shortBreakTime: 5 * 60,
        longBreakTime: 15 * 60,
        longBreakAfter: 4,
      };
      return NextResponse.json({ settings: defaultSettings, focusSessions: 0 }, { status: 200 });
    }

    return NextResponse.json(
      { settings: pomodoroData.pomodoroSettings, focusSessions: pomodoroData.focusSessions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/pomodoro:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const { settings } = await request.json();

    // Validate settings (optional, but recommended)
    if (
      !settings ||
      typeof settings.focusTime !== 'number' ||
      typeof settings.shortBreakTime !== 'number' ||
      typeof settings.longBreakTime !== 'number' ||
      typeof settings.longBreakAfter !== 'number'
    ) {
      return NextResponse.json({ message: "Invalid settings data" }, { status: 400 });
    }

    const updateResult = await pomodoroCollection.updateOne(
      { email },
      { $set: { pomodoroSettings: settings } },
      { upsert: true } // Creates a new document if one doesn't exist
    );

    if (updateResult.acknowledged) {
      return NextResponse.json({ message: "Pomodoro settings saved successfully" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Failed to save pomodoro settings" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST /api/pomodoro:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const updateResult = await pomodoroCollection.updateOne(
      { email },
      { $inc: { focusSessions: 1 } },
      { upsert: true } // Creates a new document if one doesn't exist
    );

    if (updateResult.acknowledged) {
      return NextResponse.json({ message: "Focus session count incremented" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Failed to increment focus session count" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in PUT /api/pomodoro:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}