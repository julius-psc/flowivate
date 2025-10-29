'use client';

import React, { useEffect, useState } from 'react';
import {
  motion,
  useAnimationControls,
  MotionProps,
  Transition,
} from 'framer-motion';
import Image from 'next/image';

const FISH_WIDTH = 320;

// Bubble component Props
interface BubbleProps {
  delay: number;
  size: number;
  xDrift: number;
  originX: string;
}

const Bubble: React.FC<BubbleProps> = ({ delay, size, xDrift, originX }) => {
  const [bubbleState, setBubbleState] = useState({
    isClient: false,
    targetY: null as number | null,
    computedTransition: null as Transition | null,
  });

  useEffect(() => {
    // --- FIX: Disable lint rule for this intentional client-side setup ---
    // This is necessary to get client-side window dimensions for animation
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBubbleState({
      isClient: true,
      targetY: -window.innerHeight - 100, // Safely access window.innerHeight
      computedTransition: {
        y: { duration: 5 + Math.random() * 2, ease: 'linear' as const },
        x: { duration: 5 + Math.random() * 2, ease: 'easeInOut' as const },
        scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        opacity: { duration: 5 + Math.random() * 2, ease: 'linear' as const },
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
      },
    });
  }, [delay]);

  if (
    !bubbleState.isClient ||
    bubbleState.computedTransition === null ||
    bubbleState.targetY === null
  ) {
    // Render nothing on the server or before client-side values are ready
    return null;
  }

  const animateProps: MotionProps['animate'] = {
    y: bubbleState.targetY,
    x: xDrift,
    scale: [1, 1.2, 1],
    opacity: 0,
  };

  return (
    <motion.div
      className="absolute rounded-full bg-white opacity-40"
      style={{
        width: size,
        height: size,
        bottom: '10%', // Initial vertical position relative to parent
        left: originX, // Initial horizontal position
      }}
      initial={{ y: 0, x: 0, scale: 1, opacity: 0.5 }} // x:0 means xDrift is purely an animation target
      animate={animateProps}
      transition={bubbleState.computedTransition}
    />
  );
};

const OceanEnv: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const fishControls = useAnimationControls();
  const [bubbles, setBubbles] = useState<BubbleProps[]>([]);

  useEffect(() => {
    // --- FIX: Disable lint rule for this intentional client-side check ---
    // This is the standard way to ensure code runs only on the client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true); // Set to true once component has mounted on the client
  }, []);

  // Fish animation
  useEffect(() => {
    if (!isMounted) return; // Guard: Only run on client after mount

    const animateFish = async () => {
      // Reset fish to start off-screen left
      await fishControls.start({
        x: -FISH_WIDTH, // Start off-screen
        y: 0,
        transition: { duration: 0 }, // Instantaneous
      });

      // Animate fish across the screen
      await fishControls.start({
        x: window.innerWidth + FISH_WIDTH, // Safely use window.innerWidth
        y: [0, 20, 0, -20, 0], // Vertical bobbing motion
        transition: {
          x: { duration: 25, ease: 'linear' as const },
          y: { duration: 5, ease: 'easeInOut' as const, repeat: Infinity },
        },
      });

      setCycleCount(prev => prev + 1); // Increment to potentially re-trigger effect if needed for looping
    };

    animateFish(); // Start animation

    // If you want the fish to loop based on interval, not just cycleCount:
    const intervalId = setInterval(animateFish, 30000); // Restart animation every 30 seconds

    return () => clearInterval(intervalId); // Cleanup interval
  }, [isMounted, fishControls, cycleCount]); // cycleCount dependency will re-run if it changes

  // Bubble bursts
  useEffect(() => {
    if (!isMounted) return; // Guard: Only run on client after mount

    const emitters = ['15%', '50%', '85%'];

    const generateBurst = () => {
      const burst: BubbleProps[] = [];
      const count = 10 + Math.floor(Math.random() * 10); // 10–20 bubbles

      for (let i = 0; i < count; i++) {
        burst.push({
          delay: Math.random() * 1.5,
          size: 5 + Math.random() * 15, // Random size
          xDrift: (Math.random() - 0.5) * 200, // Random horizontal drift
          originX: emitters[Math.floor(Math.random() * emitters.length)], // Random emitter
        });
      }
      setBubbles(burst); // Update bubbles state, triggering re-render
    };

    generateBurst();
    const intervalId = setInterval(generateBurst, 8000); // New burst every 8 seconds

    return () => clearInterval(intervalId);
  }, [isMounted]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/illustrations/animated/ocean-bg.svg"
          alt="Ocean background"
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="100vw"
        />
      </div>

      {/* Fish animation */}
      <motion.div
        className="absolute"
        style={{
          top: '60%',
        }}
        initial={{ x: -FISH_WIDTH }} // Ensure fish starts off-screen for SSR & initial client render
        animate={fishControls}
      >
        <Image
          src="/assets/animations/ocean/school-left.svg"
          alt="School of fish"
          width={FISH_WIDTH}
          height={FISH_WIDTH}
          style={{ objectFit: 'contain' }}
          priority
        />
      </motion.div>

      {isMounted &&
        bubbles.map((bubble, index) => (
          <Bubble
            key={index}
            delay={bubble.delay}
            size={bubble.size}
            xDrift={bubble.xDrift}
            originX={bubble.originX}
          />
        ))}
    </div>
  );
};

export default OceanEnv;