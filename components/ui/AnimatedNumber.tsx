'use client';

import React, { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  duration?: number;
  className?: string;
  delay?: number;
}

export function AnimatedNumber({ 
  value, 
  format = (val) => Math.round(val).toString(), 
  duration = 1,
  className,
  delay = 0
}: AnimatedNumberProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => format(latest));
  const [displayValue, setDisplayValue] = useState(format(0));

  useEffect(() => {
    // Unsubscribe from transform and manually update state to trigger re-renders
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });
    
    return () => unsubscribe();
  }, [rounded]);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: duration,
      ease: [0.16, 1, 0.3, 1], // easeOutQuint
      delay: delay
    });

    return controls.stop;
  }, [value, duration, delay, count]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}
