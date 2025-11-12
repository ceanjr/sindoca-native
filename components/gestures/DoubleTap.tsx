import React, { useRef } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface DoubleTapProps {
  children: React.ReactNode;
  onDoubleTap?: () => void;
  onSingleTap?: () => void;
  delay?: number;
}

export function DoubleTap({
  children,
  onDoubleTap,
  onSingleTap,
  delay = 300,
}: DoubleTapProps) {
  const lastTap = useRef<number>(0);
  const timer = useRef<NodeJS.Timeout>();

  const handlePress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap detected
      if (timer.current) {
        clearTimeout(timer.current);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      // Single tap
      lastTap.current = now;
      
      timer.current = setTimeout(() => {
        onSingleTap?.();
      }, delay);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View>{children}</View>
    </TouchableWithoutFeedback>
  );
}
