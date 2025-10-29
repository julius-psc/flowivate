'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const JungleEnv: React.FC = () => {
  const [yOffset, setYOffset] = useState(0);
  const [, setDescentCount] = useState(0);

  // Natural pendulum swing loop (never stops)
  const swingAnimation = {
    rotate: [-15, 15, -15],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as const, // <-- FIXED HERE
    },
  };

  // Descent every minute
  useEffect(() => {
    const descentInterval = setInterval(() => {
      setDescentCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 7) {
          setYOffset(0);
          return 0;
        } else {
          setYOffset(prevYOffset => prevYOffset + 20);
          return newCount;
        }
      });
    }, 60000);
    return () => clearInterval(descentInterval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/assets/illustrations/animated/forest-bg.svg"
          alt="Jungle background"
          fill
          style={{ objectFit: 'cover' }}
          priority
          sizes="100vw"
        />
      </div>

      {/* Monkey swinging */}
      <motion.div
        className="absolute"
        animate={swingAnimation}
        style={{
          top: '10%',
          left: '25%',
          transform: `translateY(${yOffset}px)`,
          transformOrigin: 'top center', // pendulum-like swing
        }}
      >
        <Image
          src="/assets/animations/jungle/monkey-left.svg"
          alt="Swinging monkey"
          width={320}
          height={320}
          style={{ objectFit: 'contain' }}
          priority
        />
      </motion.div>
    </div>
  );
};

export default JungleEnv;