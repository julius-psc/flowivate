"use client";
import Sidebar from '../components/dashboard/navigation/Sidebar';
import Navbar from '../components/dashboard/navigation/Navbar';

import Greeting from '../components/dashboard/features/Greeting';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-blue-50">
      <div className="flex-shrink-0">
        <Navbar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4">
          <Greeting/>
          <h1>Hello</h1>
        </main>
      </div>
    </div>
  );
}