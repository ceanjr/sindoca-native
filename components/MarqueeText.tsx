import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, LayoutChangeEvent } from 'react-native';

interface MarqueeTextProps {
  text: string;
  style?: any;
  speed?: number; // pixels per second
  delay?: number; // delay before starting animation (ms)
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  style,
  speed = 20,
  delay = 1000,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Check if text is longer than container
    if (textWidth > containerWidth && containerWidth > 0) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [textWidth, containerWidth]);

  useEffect(() => {
    if (shouldAnimate) {
      // Reset animation
      animatedValue.setValue(0);

      // Calculate animation duration based on text width and speed
      const distance = textWidth + 20; // Add some spacing
      const duration = (distance / speed) * 1000;

      // Start animation after delay
      const timer = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: -distance,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);

      return () => {
        clearTimeout(timer);
        animatedValue.stopAnimation();
      };
    }
  }, [shouldAnimate, textWidth, speed, delay]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTextWidth(width);
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {shouldAnimate ? (
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: animatedValue }],
            },
          ]}
        >
          <Text
            style={[styles.text, style]}
            numberOfLines={1}
            onLayout={handleTextLayout}
          >
            {text}
          </Text>
        </Animated.View>
      ) : (
        <Text
          style={[styles.text, style]}
          numberOfLines={1}
          onLayout={handleTextLayout}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  animatedContainer: {
    flexDirection: 'row',
  },
  text: {
    flexShrink: 0,
  },
});
