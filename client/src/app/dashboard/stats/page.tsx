"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { isEliteStatus } from "@/lib/subscription";
import Image from "next/image";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PaywallPopup from "@/components/dashboard/PaywallPopup";
import { useRouter } from "next/navigation";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SleepRecord { date: string; hours: number | null }
interface WaterRecord { date: string; ml: number | null }
interface MoodEntry { mood: string; count: number }

interface StatsData {
  isElite: boolean;
  accountCreatedAt: string | null;
  streak: number;
  focusSessions: number;
  tasks: { total: number; completed: number; completionRate: number };
  books: { total: number; completed: number; inProgress: number; avgRating: number | null };
  sleep: SleepRecord[];
  mood: MoodEntry[];
  journal: { total: number; thisMonth: number };
  water: WaterRecord[];
  dailyActivities: { date: string; count: number }[];
}

// ─── Mood config ──────────────────────────────────────────────────────────────

const MOOD_ORDER = ["angry", "miserable", "sad", "neutral", "cheerful", "happy", "ecstatic"];
const MOOD_LABELS: Record<string, string> = {
  angry: "Angry 😡", miserable: "Miserable 😭", sad: "Sad 😢", neutral: "Neutral 😐",
  cheerful: "Cheerful 🙂", happy: "Happy 😊", ecstatic: "Ecstatic 🤩",
};
const MOOD_COLORS: Record<string, string> = {
  angry: "#EF4444", miserable: "#F97316", sad: "#FB923C",
  neutral: "#FACC15", cheerful: "#A3E635", happy: "#22C55E", ecstatic: "#10B981",
};

// ─── Chart configs ────────────────────────────────────────────────────────────

const sleepConfig = {
  hours: { label: "Sleep (hrs)", color: "#a78bfa" },
} satisfies ChartConfig;

const waterConfig = {
  ml: { label: "Water (ml)", color: "#38bdf8" },
} satisfies ChartConfig;

const moodConfig = {
  count: { label: "Times", color: "var(--chart-1)" },
} satisfies ChartConfig;

// ─── Activity mock data ───────────────────────────────────────────────────────
interface SiteEntry { domain: string; label: string; minutes: number; productive: boolean }

const MOCK_DAILY: SiteEntry[] = [
  { domain: "github.com", label: "GitHub", minutes: 94, productive: true },
  { domain: "localhost", label: "localhost:3000", minutes: 71, productive: true },
  { domain: "notion.so", label: "Notion", minutes: 42, productive: true },
  { domain: "stackoverflow.com", label: "Stack Overflow", minutes: 38, productive: true },
  { domain: "youtube.com", label: "YouTube", minutes: 28, productive: false },
];

function fmtMinutes(m: number) {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min === 0 ? `${h}h` : `${h}h ${min}m`;
  }
  return `${m}m`;
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

interface HeatCell { date: Date; count: number; future: boolean }

function generateHeatmap(accountCreatedAt: Date | null, activities: { date: string; count: number }[]): HeatCell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const MAX_WEEKS = 16;
  const todayDow = (today.getDay() + 6) % 7;
  const startMonday = new Date(today);
  startMonday.setDate(today.getDate() - todayDow - (MAX_WEEKS - 1) * 7);

  const numWeeks = MAX_WEEKS;

  const activityMap = new Map(activities.map(a => [a.date, a.count]));

  let seed = 54321;
  const rand = () => {
    seed = ((seed * 1664525 + 1013904223) | 0) >>> 0;
    return seed / 0xffffffff;
  };

  const cursor = new Date(startMonday);
  const weeks: HeatCell[][] = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const isFuture = cursor > today;
      let count = 0;
      if (!isFuture) {
        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        count = activityMap.get(dateStr) || 0;

        // Add mock data for local testing as requested, strictly disappears when array is populated or in prod
        if (process.env.NODE_ENV === "development" && activities.length === 0) {
          const dow = (cursor.getDay() + 6) % 7;
          const isWeekend = dow >= 5;
          if (rand() > (isWeekend ? 0.55 : 0.2)) {
            count = isWeekend ? Math.ceil(rand() * 3) : Math.ceil(rand() * 7);
            const daysBack = Math.floor((today.getTime() - cursor.getTime()) / 86400000);
            if (daysBack < 14) count = Math.min(8, count + 2);
          }
        }
      }
      week.push({ date: new Date(cursor), count, future: isFuture });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function heatColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 1) return "bg-green-200 dark:bg-green-900";
  if (count <= 3) return "bg-green-300 dark:bg-green-800";
  if (count <= 6) return "bg-green-500 dark:bg-green-600";
  return "bg-green-700 dark:bg-green-400";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}



function avgSleep(records: SleepRecord[]) {
  const valid = records.filter((r) => r.hours !== null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((s, r) => s + (r.hours ?? 0), 0) / valid.length) * 10) / 10;
}

function topMood(entries: MoodEntry[]) {
  if (!entries.length) return null;
  return entries.reduce((a, b) => (a.count >= b.count ? a : b)).mood;
}

function waterGoalDays(records: WaterRecord[], goal = 2500) {
  return records.filter((r) => r.ml !== null && (r.ml ?? 0) >= goal).length;
}



// ─── Sub-components ───────────────────────────────────────────────────────────

function SiteRow({ site, maxMinutes }: { site: SiteEntry; maxMinutes: number }) {
  const isLocal = site.domain === "localhost";
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${site.domain}&sz=16`;
  const barClass = site.productive ? "bg-emerald-500/70" : "bg-orange-400/70";

  return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        {isLocal ? (
          <span className="text-[10px] font-mono text-muted-foreground">{"<>"}</span>
        ) : (
          <Image
            src={faviconUrl}
            alt={site.label}
            width={16}
            height={16}
            className="rounded-sm"
            unoptimized
          />
        )}
      </div>
      <span className="text-xs w-28 truncate shrink-0 text-muted-foreground">{site.label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${(site.minutes / maxMinutes) * 100}%` }}
        />
      </div>
      <span className="text-xs tabular-nums shrink-0 w-12 text-right text-muted-foreground">
        {fmtMinutes(site.minutes)}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("your city");
  const { status: subscriptionStatus, loading: subLoading } = useSubscriptionStatus();
  const [apiIsElite, setApiIsElite] = useState<boolean | null>(null);

  // Default to NOT showing paywall. Only show if we've confirmed from at least one source
  // that the user is not elite, AND no source says they ARE elite.
  const doneChecking = !subLoading && apiIsElite !== null;
  const isEliteByHook = isEliteStatus(subscriptionStatus);
  const isEliteByApi = apiIsElite === true;
  const showPaywall = doneChecking && !isEliteByHook && !isEliteByApi;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        console.log("[Stats] API response isElite:", data.isElite, "subscriptionStatus from hook:", subscriptionStatus);
        setApiIsElite(data.isElite === true);
        setStats(data);
      })
      .catch(() => {
        setApiIsElite(false);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d: { city?: string }) => { if (d.city) setCity(d.city); })
      .catch(() => { });
  }, []);

  const isSpecialTheme = useMemo(
    () => mounted && !!theme && specialSceneThemeNames.includes(theme as (typeof specialSceneThemeNames)[number]),
    [mounted, theme]
  );
  const cardClass = isSpecialTheme
    ? "dark bg-zinc-900/70 border-zinc-800/50 shadow-none"
    : "shadow-none";

  // Rotating insight — cycles every 3 hours
  const insightPool = useMemo<{ headline: React.ReactNode; body: string; accent: string }[]>(() => [
    {
      headline: <>4.2h on <span className="text-orange-400">Netflix</span> this week</>,
      body: "Enough for 2 full courses.",
      accent: "border-l-[3px] border-l-orange-400",
    },
    {
      headline: <><span className="text-yellow-400">14 tab switches</span> in 20 min</>,
      body: "Each switch costs ~23 min of recovery.",
      accent: "border-l-[3px] border-l-yellow-400",
    },
    {
      headline: <><span className="text-blue-400">StackOverflow</span> → <span className="text-red-400">Reddit</span></>,
      body: "You lost the thread. Close the tab.",
      accent: "border-l-[3px] border-l-blue-400",
    },
    {
      headline: <>3.1h on <span className="text-orange-400">YouTube</span> this week</>,
      body: "186 min of passive content — what would you build instead?",
      accent: "border-l-[3px] border-l-orange-400",
    },
    {
      headline: <>Top 5% of focusers in <span className="text-green-500">{city}</span></>,
      body: "Most people check their phone every 3 minutes.",
      accent: "border-l-[3px] border-l-green-500",
    },
    {
      headline: <><span className="text-yellow-400">22 context switches</span> today</>,
      body: "You're sprinting between 22 starting lines.",
      accent: "border-l-[3px] border-l-yellow-400",
    },
    {
      headline: <><span className="text-blue-400">Twitter</span> → <span className="text-red-400">3 YouTube videos</span></>,
      body: "Started with one tweet. The algorithm did the rest.",
      accent: "border-l-[3px] border-l-blue-400",
    },
    {
      headline: <><span className="text-green-500">3,500 ft</span> climbed today</>,
      body: "12% of Everest, powered by focus alone.",
      accent: "border-l-[3px] border-l-green-500",
    },
    {
      headline: <>2.4h on <span className="text-orange-400">Instagram</span> this week</>,
      body: "That's 80 pages of reading you didn't do.",
      accent: "border-l-[3px] border-l-orange-400",
    },
  ], [city]);

  const currentInsight = insightPool[Math.floor(Date.now() / (1000 * 60 * 60 * 3)) % insightPool.length];

  if (!mounted || loading || subLoading || apiIsElite === null) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 mb-1" />
        <Skeleton className="h-5 w-64 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>

        <Skeleton className="h-44 rounded-xl mt-4 mb-4" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Failed to load stats.</p>
      </div>
    );
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto blur-md">
        <PaywallPopup isOpen={true} onClose={() => router.push("/dashboard")} />
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const sleepData = stats.sleep.map((r) => ({ day: shortDate(r.date), hours: r.hours ?? undefined }));
  const waterData = stats.water.map((r) => ({ day: shortDate(r.date), ml: r.ml ?? undefined }));

  const moodCountMap = Object.fromEntries(stats.mood.map((m) => [m.mood, m.count]));
  const moodData = MOOD_ORDER
    .filter((m) => moodCountMap[m])
    .map((m) => ({ mood: m, label: MOOD_LABELS[m], count: moodCountMap[m], color: MOOD_COLORS[m] }));

  const totalMoodEntries = stats.mood.reduce((s, m) => s + m.count, 0);

  const MIN_ENTRIES = 3;
  const sleepLogged = stats.sleep.filter((r) => r.hours !== null).length;
  const waterLogged = stats.water.filter((r) => r.ml !== null).length;

  const hasSleep = sleepLogged >= MIN_ENTRIES;
  const hasMood = totalMoodEntries >= MIN_ENTRIES;
  const hasWater = waterLogged >= MIN_ENTRIES;

  const sleepAvg = avgSleep(stats.sleep);
  const bestMood = topMood(stats.mood);
  const goalDays = waterGoalDays(stats.water);



  const heatmapWeeks = generateHeatmap(
    stats.accountCreatedAt ? new Date(stats.accountCreatedAt) : null,
    stats.dailyActivities || []
  );
  const activeDays = heatmapWeeks.flat().filter((c) => !c.future && c.count > 0).length;

  const monthLabelCols: string[] = heatmapWeeks.map((week, wi) => {
    const first = week[0].date;
    const isNew = wi === 0 || first.getMonth() !== heatmapWeeks[wi - 1][0].date.getMonth();
    return isNew ? first.toLocaleString("default", { month: "short" }) : "";
  });

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto">

      {/* Header & Motivational Message */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">
          {currentInsight.headline}
        </h1>
        <p className="text-muted-foreground mt-1.5">
          {currentInsight.body} Impressive, Julius!
        </p>
      </div>

      {/* ── Bio charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">

        {/* Sleep */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>Sleep</CardTitle>
            <CardDescription>Hours per night, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {hasSleep ? (
              <ChartContainer config={sleepConfig} className="h-[180px] w-full">
                <AreaChart accessibilityLayer data={sleepData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <defs>
                    <linearGradient id="fillSleep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="hours" type="natural" fill="url(#fillSleep)" fillOpacity={0.4} stroke="var(--color-hours)" stackId="a" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-1.5 text-center px-6">
                <p className="text-sm font-medium">Keep logging your sleep!</p>
                <p className="text-xs text-muted-foreground">
                  {sleepLogged === 0
                    ? "Log at least 3 nights to unlock your sleep trend."
                    : `${sleepLogged} of 3 nights logged — almost there.`}
                </p>
              </div>
            )}
          </CardContent>
          {hasSleep && (
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <p className="font-medium leading-none">
                {sleepAvg !== null ? `Avg ${sleepAvg}h / night` : "—"}
              </p>
              <p className="text-muted-foreground leading-none text-xs">
                {sleepAvg !== null
                  ? sleepAvg >= 7 && sleepAvg <= 9 ? "Within healthy range"
                    : sleepAvg < 7 ? "Below recommended 7–9h"
                      : "Above recommended range"
                  : ""}
              </p>
            </CardFooter>
          )}
        </Card>

        {/* Mood */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>Mood</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMood ? (
              <ChartContainer config={moodConfig} className="h-[180px] w-full">
                <BarChart accessibilityLayer data={moodData} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" tickLine={false} tickMargin={8} axisLine={false} tick={{ fontSize: 12 }} width={110} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={5}>
                    {moodData.map((entry) => (
                      <Cell key={entry.mood} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-1.5 text-center px-6">
                <p className="text-sm font-medium">Start tracking your mood!</p>
                <p className="text-xs text-muted-foreground">
                  {totalMoodEntries === 0
                    ? "Log at least 3 moods to see your patterns."
                    : `${totalMoodEntries} of 3 moods logged — keep going.`}
                </p>
              </div>
            )}
          </CardContent>
          {hasMood && bestMood && (
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <p className="font-medium leading-none">Most frequent: {MOOD_LABELS[bestMood]}</p>
              <p className="text-muted-foreground leading-none text-xs">
                {totalMoodEntries} mood {totalMoodEntries === 1 ? "check-in" : "check-ins"} this month
              </p>
            </CardFooter>
          )}
        </Card>

        {/* ── Focus Streak Heatmap ── */}
        <Card className={cn(cardClass, "flex flex-col flex-1")}>
          <CardHeader>
            <CardTitle>Consistency</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col w-full flex-1">
            <div className="flex gap-2">

              {/* Day-of-week labels */}
              <div className="flex flex-col gap-1 pt-[18px] pr-1 shrink-0">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <div
                    key={d}
                    className="h-3 text-[9px] text-muted-foreground flex items-center"
                    style={{ visibility: i % 2 === 0 ? "visible" : "hidden" }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid + month labels */}
              <div className="min-w-0">
                <div
                  className="mb-1"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${heatmapWeeks.length}, 12px)`,
                    columnGap: "4px",
                  }}
                >
                  {monthLabelCols.map((label, wi) => (
                    <div
                      key={wi}
                      className="text-[9px] text-muted-foreground col-span-1"
                      style={{ overflow: "visible", whiteSpace: "nowrap" }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Cell rows */}
                {Array.from({ length: 7 }, (_, di) => (
                  <div key={di} className="flex gap-1 mb-1">
                    {heatmapWeeks.map((week, wi) => {
                      const cell = week[di];
                      return (
                        <div
                          key={wi}
                          className={cn(
                            "h-3 w-3 rounded-sm",
                            cell.future ? "opacity-0" : heatColor(cell.count)
                          )}
                          title={
                            !cell.future
                              ? `${cell.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend as requested */}
            <div className="mt-auto pt-6 w-full flex items-center justify-end gap-2 opacity-80">
              <span className="text-xs text-muted-foreground mr-1">Less</span>
              <div className="flex gap-1 items-center">
                <div className={cn("h-3 w-3 rounded-sm", heatColor(0))} />
                <div className={cn("h-3 w-3 rounded-sm", heatColor(1))} />
                <div className={cn("h-3 w-3 rounded-sm", heatColor(3))} />
                <div className={cn("h-3 w-3 rounded-sm", heatColor(6))} />
                <div className={cn("h-3 w-3 rounded-sm", heatColor(10))} />
              </div>
              <span className="text-xs text-muted-foreground ml-1">More</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
            <p className="font-medium leading-none">{activeDays} active days since you joined</p>
          </CardFooter>
        </Card>

        {/* Water */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>Hydration</CardTitle>
            <CardDescription>Daily water intake, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {hasWater ? (
              <ChartContainer config={waterConfig} className="h-[180px] w-full">
                <AreaChart accessibilityLayer data={waterData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <defs>
                    <linearGradient id="fillWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-ml)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-ml)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area dataKey="ml" type="natural" fill="url(#fillWater)" fillOpacity={0.4} stroke="var(--color-ml)" stackId="a" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-1.5 text-center px-6">
                <p className="text-sm font-medium">Stay on top of your hydration!</p>
                <p className="text-xs text-muted-foreground">
                  {waterLogged === 0
                    ? "Log intake on at least 3 days to see your trend."
                    : `${waterLogged} of 3 days logged — you're getting there.`}
                </p>
              </div>
            )}
          </CardContent>
          {hasWater && (
            <CardFooter className="flex-col items-start gap-1 text-sm">
              <p className="font-medium leading-none">{goalDays} of 7 days hit the 2.5L goal</p>
              <p className="text-muted-foreground leading-none text-xs">
                {goalDays >= 5 ? "Great hydration week" : goalDays >= 3 ? "Room to improve" : "Drink more water"}
              </p>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* ── Recent Activity ── */}
      <Card className={cn(cardClass, "mt-4 mb-4 relative overflow-hidden")}>
        {/* Overlay showing Coming Soon */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/20 backdrop-blur-[2px]">
          <div className={cn(cardClass, "px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm border-none")}>
            <span className="text-lg">🔒</span>
            <span className="font-semibold text-sm text-foreground">Coming Soon</span>
          </div>
        </div>

        <CardHeader className="opacity-40">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Activity tracking across your apps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 opacity-30 select-none pointer-events-none pb-8">
          {MOCK_DAILY.map((site) => (
            <SiteRow key={site.domain} site={site} maxMinutes={94} />
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
