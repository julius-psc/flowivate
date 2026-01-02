"use client";

import { SessionProvider } from "next-auth/react";
import OnboardingClient from "./OnboardingClient";

export default function OnboardingPage() {
  return (
    <SessionProvider>
      <OnboardingClient />
    </SessionProvider>
  );
}
