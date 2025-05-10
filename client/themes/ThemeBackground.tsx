'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const JungleEnv = dynamic(() => import('./animated/JungleEnv'), { ssr: false });
const OceanEnv = dynamic(() => import('./animated/OceanEnv'), { ssr: false });

// Theme background configuration
const themeConfigs = {
  default: '/assets/illustrations/gradient-bg-blue.svg',
  forest: '/assets/illustrations/gradient-bg-forest.svg',
  candy: '/assets/illustrations/gradient-bg-candy.svg',
  sunset: '/assets/illustrations/gradient-bg-sunset.svg',
  ocean: '/assets/illustrations/gradient-bg-ocean.svg',
  desert: '/assets/illustrations/gradient-bg-desert.svg',
};

export default function ThemeBackground() {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (theme === 'jungle') return <JungleEnv />;
  if (theme === 'ocean') return <OceanEnv />;

  const bgUrl = theme && themeConfigs[theme as keyof typeof themeConfigs];

  return bgUrl ? (
    <Image
      src={bgUrl}
      alt={`${theme} background`}
      fill
      priority
      className="object-cover"
    />
  ) : null;
}
