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
    wobblePath: [] as number[],
  });

  useEffect(() => {
    // --- FIX: Disable lint rule for this intentional client-side setup ---
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const duration = 4 + Math.random() * 4; // Varying duration based on randomness (could be size based too)
    const wobble = Math.random() * 30 + 10; // Random wobble amplitude

    setBubbleState({
      isClient: true,
      targetY: -window.innerHeight - 150,
      wobblePath: [0, wobble, -wobble, wobble / 2, -wobble / 2, 0], // Sine-like wave
      computedTransition: {
        y: { duration: duration, ease: 'linear' as const },
        x: { duration: duration, ease: 'easeInOut' as const, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
        opacity: { duration: duration * 0.8, ease: 'easeOut' as const, times: [0, 1] }, // Fade out near end
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
      },
    });
  }, [delay]);

  if (
    !bubbleState.isClient ||
    bubbleState.computedTransition === null ||
    bubbleState.targetY === null
  ) {
    return null;
  }

  const animateProps: MotionProps['animate'] = {
    y: bubbleState.targetY,
    x: bubbleState.wobblePath.map(val => val + xDrift), // Combine wobble with drift
    scale: [1, 1.1, 0.95, 1.05, 1],
    opacity: [0, 0.6, 0.6, 0], // Fade in, stay, fade out
  };

  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{
        width: size,
        height: size,
        bottom: '-10%', // Start slightly below view
        left: originX,
        boxShadow: 'inset 0 0 6px rgba(255, 255, 255, 0.8)', // Add depth
        filter: 'blur(0.5px)',
      }}
      initial={{ y: 0, x: 0, scale: 0.5, opacity: 0 }}
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
        x: -FISH_WIDTH,
        y: 100, // Start lower
        rotate: 0,
        transition: { duration: 0 },
      });

      // Animate fish across the screen with a graceful curve
      await fishControls.start({
        x: window.innerWidth + FISH_WIDTH,
        y: [100, 50, 120, 60, 100], // Smoother S-curve
        rotate: [0, -5, 5, -5, 0], // Gentle banking
        transition: {
          x: { duration: 35, ease: 'linear' as const }, // Slower, majestic swim
          y: { duration: 35, ease: 'easeInOut' as const, times: [0, 0.25, 0.5, 0.75, 1] },
          rotate: { duration: 35, ease: 'easeInOut' as const, times: [0, 0.25, 0.5, 0.75, 1] },
        },
      });

      setCycleCount(prev => prev + 1);
    };

    animateFish(); // Start animation

    // If you want the fish to loop based on interval, not just cycleCount:
    const intervalId = setInterval(animateFish, 40000); // Restart animation every 40 seconds

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