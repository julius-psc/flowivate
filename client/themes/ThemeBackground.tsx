"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

const JungleEnv = dynamic(() => import("./animated/JungleEnv"), { ssr: false });
const OceanEnv = dynamic(() => import("./animated/OceanEnv"), { ssr: false });

export default function ThemeBackground() {
  const { theme } = useTheme();

  if (theme === "jungle") return <JungleEnv />;
  if (theme === "ocean") return <OceanEnv />;


  // Temporarily skip displaying background images
  // const bgUrl = themeConfigs[bgKey];
  // return (
  //   <Image
  //     src={bgUrl}
  //     alt={`${theme} background`}
  //     fill
  //     priority
  //     className="object-cover"
  //   />
  // );

  // Return null instead of Image for now
  return null;
}
