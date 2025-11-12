import React from 'react';
import { MotiView } from 'moti';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function FadeInView({ children, delay = 0, duration = 300 }: FadeInViewProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
    >
      {children}
    </MotiView>
  );
}
