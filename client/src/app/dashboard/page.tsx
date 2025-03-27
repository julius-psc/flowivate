"use client";
import Greeting from "../../components/dashboard/features/Greeting";
import Tasks from "../../components/dashboard/features/Tasks";
import Pomodoro from "../../components/dashboard/features/Pomodoro";
import Ambient from "../../components/dashboard/features/Ambient";
import Mood from "../../components/dashboard/features/Mood";
import Assistant from "../../components/dashboard/features/Assistant";
import Meditation from '../../components/dashboard/features/Meditation';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <div className="md:col-start-1 flex flex-col gap-2">
        <Greeting />
        <Tasks />
      </div>
      <div className="md:col-start-2 flex flex-col gap-2">
        <Pomodoro />
        <Ambient />
      </div>
      <div className="md:col-start-3 flex flex-col gap-2">
        <Mood />
        <Assistant />
      </div>
      <div className="md:col-start-4 flex flex-col gap-2">
        <Meditation />
      </div>
    </div>
  );
}