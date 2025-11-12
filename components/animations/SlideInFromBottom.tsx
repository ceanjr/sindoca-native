import React from 'react';
import { MotiView } from 'moti';

interface SlideInFromBottomProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}

export function SlideInFromBottom({
  children,
  delay = 0,
  duration = 400,
}: SlideInFromBottomProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 100 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 100 }}
      transition={{
        type: 'spring',
        delay,
        damping: 20,
        stiffness: 90,
      }}
    >
      {children}
    </MotiView>
  );
}
