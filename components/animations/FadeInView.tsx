import React from 'react';
import { ViewStyle, Platform, View } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, delay = 0, duration = 300, style }: FadeInViewProps) {
  // Use MotiView only on native platforms, plain View on web to avoid SSR issues
  if (Platform.OS === 'web') {
    return <View style={style}>{children}</View>;
  }

  // Dynamically import MotiView only on native platforms
  const { MotiView } = require('moti');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration,
        delay,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
