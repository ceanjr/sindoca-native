import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'large', color = Colors.primary, fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
