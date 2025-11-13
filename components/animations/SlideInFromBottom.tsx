import React from 'react';
import { Platform, View } from 'react-native';

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
  // Use MotiView only on native platforms, plain View on web to avoid SSR issues
  if (Platform.OS === 'web') {
    return <View>{children}</View>;
  }

  // Dynamically import MotiView only on native platforms
  const { MotiView } = require('moti');

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
