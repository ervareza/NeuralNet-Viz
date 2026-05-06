'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassSliderProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function GlassSlider({
  label,
  icon,
  value,
  min,
  max,
  step = 1,
  unit = '',
  color = '#38bdf8', // Default cyan
  onChange,
  className
}: GlassSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Create motion values for fluid interaction
  const sliderX = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 300 };
  const smoothX = useSpring(sliderX, springConfig);
  
  // Calculate percentage based on current value
  const percentage = ((value - min) / (max - min));
  
  // Initialize slider position
  useEffect(() => {
    if (containerRef.current && !isDragging) {
      const { width } = containerRef.current.getBoundingClientRect();
      sliderX.set(percentage * width);
    }
  }, [value, min, max, percentage, isDragging, sliderX]);

  // Handle pointer down (click to jump)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    sliderX.set(x);
    updateValueFromX(x, rect.width);
    setIsDragging(true);
  };

  const updateValueFromX = (x: number, width: number) => {
    const p = x / width;
    let newValue = min + p * (max - min);
    // Apply step rounding
    if (step) {
      const inv = 1.0 / step;
      newValue = Math.round(newValue * inv) / inv;
    }
    // Clamp
    newValue = Math.max(min, Math.min(newValue, max));
    onChange(newValue);
  };

  // Drag interaction
  const handleDrag = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!containerRef.current) return;
    const { width } = containerRef.current.getBoundingClientRect();
    updateValueFromX(info.point.x - containerRef.current.getBoundingClientRect().left, width);
  };

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Header */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-2 tracking-wide">
          {icon && <span className="opacity-70">{icon}</span>}
          {label}
        </span>
        <motion.span 
          key={value}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono font-semibold px-2 py-0.5 rounded shadow-inner"
          style={{ 
            backgroundColor: `rgba(255,255,255,0.06)`,
            color: color,
            textShadow: `0 0 8px ${color}80` 
          }}
        >
          {Number.isInteger(value) ? value : value.toFixed(1)}{unit}
        </motion.span>
      </div>

      {/* Slider Track */}
      <div 
        ref={containerRef}
        className="relative h-2 w-full rounded-full cursor-pointer touch-none group"
        onPointerDown={handlePointerDown}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {/* Fill */}
        <motion.div 
          className="absolute left-0 top-0 bottom-0 rounded-full"
          style={{ 
            width: smoothX,
            background: `linear-gradient(90deg, ${color}40, ${color})`,
            boxShadow: `0 0 10px ${color}50`
          }}
        />
        
        {/* Thumb */}
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={() => setIsDragging(false)}
          className="absolute top-1/2 -ml-2 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-lg"
          style={{ 
            x: smoothX, 
            y: '-50%',
            boxShadow: `0 0 15px ${color}`
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        </motion.div>
      </div>
    </div>
  );
}
