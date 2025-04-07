"use client";

import Greeting from "../../components/dashboard/features/Greeting";
import Tasks from "../../components/dashboard/features/Tasks";
import Pomodoro from "../../components/dashboard/features/Pomodoro";
import Ambient from "../../components/dashboard/features/Ambient";
import Mood from "../../components/dashboard/features/Mood";
import Assistant from "../../components/dashboard/features/Assistant";
import Meditation from "../../components/dashboard/features/Meditation";
import Water from "../../components/dashboard/features/Water";
import Books from "../../components/dashboard/features/Books";
import Sleep from "../../components/dashboard/features/Sleep";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-full ">
      <div className="md:col-start-1 w-full flex flex-col gap-2">
        <Greeting />
        <Tasks />
      </div>
      <div className="md:col-start-2 w-full flex flex-col gap-2">
        <Pomodoro />
        <Ambient />
      </div>
      <div className="md:col-start-3 w-full flex flex-col gap-2">
        <Mood />
        <Assistant />
        <Water />
      </div>
      <div className="md:col-start-4 w-full flex flex-col gap-2">
        <Meditation />
        <Books />
        <Sleep />
      </div>
    </div>
  );
}