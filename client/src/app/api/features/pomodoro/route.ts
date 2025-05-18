import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb';

interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakAfter: number;
}

interface PomodoroData {
  _id?: ObjectId; // _id is present when fetched from DB
  userId: ObjectId;
  pomodoroSettings: PomodoroSettings;
  focusSessions: number;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusTime: 25 * 60,      // 25 minutes in seconds
  shortBreakTime: 5 * 60,  // 5 minutes in seconds
  longBreakTime: 15 * 60,  // 15 minutes in seconds
  longBreakAfter: 4,       // After 4 focus sessions
};

// Min/Max values in seconds for time settings, and counts for cycles
const MIN_TIME_SECONDS = 1 * 60;       // 1 minute
const MAX_TIME_SECONDS = 120 * 60;     // 2 hours
const MIN_LONG_BREAK_AFTER = 1;
const MAX_LONG_BREAK_AFTER = 10;


function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

function validatePomodoroSettings(settings: Partial<PomodoroSettings>): settings is PomodoroSettings {
    if (!settings || typeof settings !== 'object') return false;

    const { focusTime, shortBreakTime, longBreakTime, longBreakAfter } = settings;

    if (typeof focusTime !== 'number' || focusTime < MIN_TIME_SECONDS || focusTime > MAX_TIME_SECONDS) return false;
    if (typeof shortBreakTime !== 'number' || shortBreakTime < MIN_TIME_SECONDS || shortBreakTime > MAX_TIME_SECONDS) return false;
    if (typeof longBreakTime !== 'number' || longBreakTime < MIN_TIME_SECONDS || longBreakTime > MAX_TIME_SECONDS) return false;
    if (typeof longBreakAfter !== 'number' || longBreakAfter < MIN_LONG_BREAK_AFTER || longBreakAfter > MAX_LONG_BREAK_AFTER) return false;

    return true;
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in GET /api/features/pomodoro: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const pomodoroData = await pomodoroCollection.findOne({ userId: userObjectId });

    if (!pomodoroData) {
      return NextResponse.json(
        { settings: DEFAULT_POMODORO_SETTINGS, focusSessions: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        settings: pomodoroData.pomodoroSettings || DEFAULT_POMODORO_SETTINGS,
        focusSessions: typeof pomodoroData.focusSessions === 'number' ? pomodoroData.focusSessions : 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/features/pomodoro:", error);
    return NextResponse.json({ message: "Failed to retrieve Pomodoro data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in POST /api/features/pomodoro: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (parseError) {
        console.error("Error in POST /api/features/pomodoro: Invalid JSON payload", parseError);
        return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    const { settings } = requestBody;

    if (!validatePomodoroSettings(settings)) {
      return NextResponse.json({ message: "Invalid settings data provided. Ensure all fields are present and within valid ranges." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const updateResult = await pomodoroCollection.updateOne(
      { userId: userObjectId },
      {
        $set: { pomodoroSettings: settings },
        $setOnInsert: { focusSessions: 0, userId: userObjectId } // Initialize focusSessions if new
      },
      { upsert: true }
    );

    if (updateResult.acknowledged) {
      return NextResponse.json({ message: "Pomodoro settings saved successfully", settings }, { status: 200 });
    } else {
      console.error(`Error in POST /api/features/pomodoro: Failed to save pomodoro settings for user ${userId} - DB operation not acknowledged.`);
      return NextResponse.json({ message: "Failed to save pomodoro settings" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in POST /api/features/pomodoro:", error);
    return NextResponse.json({ message: "Failed to save Pomodoro settings" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in PUT /api/features/pomodoro: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const pomodoroCollection = db.collection<PomodoroData>("pomodoro");

    const updateResult = await pomodoroCollection.findOneAndUpdate(
      { userId: userObjectId },
      {
        $inc: { focusSessions: 1 },
        $setOnInsert: { pomodoroSettings: DEFAULT_POMODORO_SETTINGS, userId: userObjectId } // Initialize settings if new
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!updateResult) {
         console.error(`Error in PUT /api/features/pomodoro: Failed to increment focus session for user ${userId} - findOneAndUpdate returned null.`);
         return NextResponse.json({ message: "Failed to update focus session count" }, { status: 500 });
    }
    
    const updatedData = updateResult as PomodoroData;

    return NextResponse.json(
        {
            message: "Focus session count incremented",
            focusSessions: updatedData.focusSessions,
            settings: updatedData.pomodoroSettings // Return settings as well for context
        },
        { status: 200 }
    );

  } catch (error) {
    console.error("Error in PUT /api/features/pomodoro:", error);
    return NextResponse.json({ message: "Failed to update focus session count" }, { status: 500 });
  }
}