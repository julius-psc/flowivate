// Run with: node scripts/seed-stats.mjs
import { MongoClient, ObjectId } from "mongodb";

const URI = "mongodb://localhost:27017/FlowivateDev";
const DB  = "FlowivateDev";
const EMAIL = "peschardjulius03@gmail.com";

const client = new MongoClient(URI);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(23, 0, 0, 0);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgoMidnight(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function thisMonthDate(day) {
  const d = new Date();
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d;
}

async function run() {
  await client.connect();
  const db = client.db(DB);

  // ── Find user ─────────────────────────────────────────────────────────────
  const user = await db.collection("users").findOne({ email: EMAIL });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }
  const userId = user._id;
  console.log(`Seeding for user ${EMAIL} (${userId})`);

  // ── Helper: upsert per userId ─────────────────────────────────────────────
  const upsert = (col, filter, doc) =>
    db.collection(col).updateOne(filter, { $set: doc }, { upsert: true });

  // ── streaks ───────────────────────────────────────────────────────────────
  await upsert("streaks", { userId }, { userId, count: 14, updatedAt: new Date() });

  // ── pomodoro ──────────────────────────────────────────────────────────────
  await upsert("pomodoro", { userId }, { userId, focusSessions: 42, updatedAt: new Date() });

  // ── task_lists ────────────────────────────────────────────────────────────
  await db.collection("task_lists").deleteMany({ userId, _seedMock: true });
  await db.collection("task_lists").insertOne({
    userId,
    _seedMock: true,
    name: "Work",
    tasks: [
      { completed: true,  title: "Set up project repo" },
      { completed: true,  title: "Design database schema" },
      { completed: true,  title: "Build auth flow",
        subtasks: [
          { completed: true,  title: "Login page" },
          { completed: true,  title: "OAuth providers" },
          { completed: false, title: "Magic link" },
        ]
      },
      { completed: false, title: "Write API tests" },
      { completed: false, title: "Deploy to staging" },
      { completed: true,  title: "Code review session" },
      { completed: false, title: "Update docs" },
      { completed: true,  title: "Fix layout bugs",
        subtasks: [
          { completed: true,  title: "Mobile nav" },
          { completed: true,  title: "Dark mode" },
        ]
      },
    ],
  });
  await db.collection("task_lists").insertOne({
    userId,
    _seedMock: true,
    name: "Personal",
    tasks: [
      { completed: true,  title: "Go to the gym" },
      { completed: true,  title: "Read 20 pages" },
      { completed: false, title: "Plan weekend trip" },
      { completed: true,  title: "Call parents" },
      { completed: false, title: "Dentist appointment" },
    ],
  });

  // ── books ─────────────────────────────────────────────────────────────────
  await db.collection("books").deleteMany({ userId, _seedMock: true });
  await db.collection("books").insertMany([
    { userId, _seedMock: true, title: "Atomic Habits",           status: "completed",   rating: 5 },
    { userId, _seedMock: true, title: "Deep Work",               status: "completed",   rating: 4 },
    { userId, _seedMock: true, title: "The Pragmatic Programmer",status: "in-progress", rating: null },
    { userId, _seedMock: true, title: "Clean Code",              status: "completed",   rating: 4 },
    { userId, _seedMock: true, title: "Thinking Fast and Slow",  status: "in-progress", rating: null },
  ]);

  // ── sleep (last 7 days) ───────────────────────────────────────────────────
  await db.collection("sleep").deleteMany({ userId, _seedMock: true });
  const sleepData = [7.5, 6.0, 8.0, 7.0, 6.5, 9.0, 7.5]; // oldest → newest
  await db.collection("sleep").insertMany(
    sleepData.map((hours, i) => ({
      userId,
      _seedMock: true,
      timestamp: daysAgo(6 - i),
      hours,
    }))
  );

  // ── moods (this month) ────────────────────────────────────────────────────
  await db.collection("moods").deleteMany({ userId, _seedMock: true });
  const moodEntries = [
    { day: 1,  mood: "neutral"  },
    { day: 2,  mood: "happy"    },
    { day: 3,  mood: "happy"    },
    { day: 4,  mood: "cheerful" },
    { day: 5,  mood: "sad"      },
    { day: 6,  mood: "neutral"  },
    { day: 7,  mood: "happy"    },
    { day: 8,  mood: "ecstatic" },
    { day: 9,  mood: "cheerful" },
    { day: 10, mood: "happy"    },
    { day: 11, mood: "neutral"  },
    { day: 12, mood: "sad"      },
    { day: 13, mood: "cheerful" },
    { day: 14, mood: "happy"    },
  ];
  await db.collection("moods").insertMany(
    moodEntries.map(({ day, mood }) => ({
      userId,
      _seedMock: true,
      timestamp: thisMonthDate(day),
      mood,
    }))
  );

  // ── journalEntries ────────────────────────────────────────────────────────
  await db.collection("journalEntries").deleteMany({ userId, _seedMock: true });
  const journalDays = [1, 2, 4, 5, 7, 8, 9, 11, 12, 14]; // this month
  await db.collection("journalEntries").insertMany(
    journalDays.map((day) => ({
      userId,
      _seedMock: true,
      createdAt: thisMonthDate(day),
      title: `Entry ${day}`,
      content: "Mock journal entry.",
    }))
  );
  // A few older entries for the total count
  const oldJournalDates = [-30, -45, -60, -75, -90].map((offset) => daysAgo(Math.abs(offset)));
  await db.collection("journalEntries").insertMany(
    oldJournalDates.map((createdAt) => ({
      userId,
      _seedMock: true,
      createdAt,
      title: "Old entry",
      content: "Mock journal entry.",
    }))
  );

  // ── waterIntake (last 7 days) ─────────────────────────────────────────────
  await db.collection("waterIntake").deleteMany({ userId, _seedMock: true });
  const waterMl = [2200, 3100, 1800, 2500, 2800, 2600, 3000]; // oldest → newest
  await db.collection("waterIntake").insertMany(
    waterMl.map((totalAmount, i) => ({
      userId,
      _seedMock: true,
      date: daysAgoMidnight(6 - i),
      totalAmount,
    }))
  );

  console.log("✓ Seed complete");
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
