'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  borderOpacity?: number;
}

export function GlassCard({ 
  children, 
  className, 
  intensity = 'medium',
  borderOpacity = 0.1,
  ...props 
}: GlassCardProps) {
  
  const intensityMap = {
    low: 'bg-white/[0.02] backdrop-blur-[8px]',
    medium: 'bg-[#0a1535]/60 backdrop-blur-[24px]',
    high: 'bg-[#060e24]/80 backdrop-blur-[40px]'
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "border shadow-2xl",
        intensityMap[intensity],
        className
      )}
      style={{
        borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, ${borderOpacity * 1.5})`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {/* Noise Texture Overlay for realism */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
