'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Utensils, AlertTriangle, EyeOff, 
  Droplets, Moon, Heart, Compass 
} from 'lucide-react';
import type { Scenario } from '@/lib/scenarios';

const ICON_MAP: Record<string, React.ReactNode> = {
  'crosshair': <Crosshair size={14} />,
  'utensils': <Utensils size={14} />,
  'alert-triangle': <AlertTriangle size={14} />,
  'eye-off': <EyeOff size={14} />,
  'droplets': <Droplets size={14} />,
  'moon': <Moon size={14} />,
  'heart': <Heart size={14} />,
  'compass': <Compass size={14} />,
};

interface ScenarioIndicatorProps {
  scenario: Scenario;
  progress: number; // 0-1
}

export function ScenarioIndicator({ scenario, progress }: ScenarioIndicatorProps) {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.name}
          initial={{ opacity: 0, y: -15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 px-5 py-2.5 rounded-full border pointer-events-auto"
          style={{
            background: 'rgba(6, 14, 36, 0.7)',
            backdropFilter: 'blur(20px)',
            borderColor: scenario.color + '40',
            boxShadow: `0 0 30px ${scenario.color}15, inset 0 1px 1px rgba(255,255,255,0.05)`,
          }}
        >
          {/* Icon */}
          <span style={{ color: scenario.color }}>
            {ICON_MAP[scenario.icon]}
          </span>

          {/* Text */}
          <div className="flex flex-col">
            <span 
              className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase"
              style={{ color: scenario.color }}
            >
              {scenario.name}
            </span>
            <span className="text-[8px] font-mono text-slate-500 tracking-wider">
              {scenario.description}
            </span>
          </div>

          {/* Progress ring */}
          <div className="relative w-5 h-5 ml-1">
            <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10" cy="10" r="8"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />
              <circle
                cx="10" cy="10" r="8"
                fill="none"
                stroke={scenario.color}
                strokeWidth="2"
                strokeDasharray={`${progress * 50.26} 50.26`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
