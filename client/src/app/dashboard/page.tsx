"use client";
import Greeting from '../../components/dashboard/features/Greeting';
import Tasks from '../../components/dashboard/features/Tasks';
import Pomodoro from '../../components/dashboard/features/Pomodoro';
import Ambient from '../../components/dashboard/features/Ambient';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3">
      <div className="col-span-1 flex flex-col">
        <Greeting />
        <Tasks />
      </div>
      <div className="col-span-2">
        <Pomodoro />
        <Ambient />
      </div>
    </div>
  );
}