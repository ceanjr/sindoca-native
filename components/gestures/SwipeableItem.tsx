import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  deleteText?: string;
  archiveText?: string;
}

export function SwipeableItem({
  children,
  onDelete,
  onArchive,
  deleteText = 'Excluir',
  archiveText = 'Arquivar',
}: SwipeableItemProps) {
  const renderRightActions = () => {
    if (!onDelete && !onArchive) return null;

    return (
      <View style={styles.rightActionsContainer}>
        {onArchive && (
          <Animated.View style={[styles.actionButton, styles.archiveButton]}>
            <Text style={styles.actionText}>{archiveText}</Text>
          </Animated.View>
        )}
        {onDelete && (
          <Animated.View style={[styles.actionButton, styles.deleteButton]}>
            <Text style={styles.actionText}>{deleteText}</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  const handleSwipeableOpen = (direction: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (direction === 'right' && onDelete) {
      onDelete();
    } else if (direction === 'left' && onArchive) {
      onArchive();
    }
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  archiveButton: {
    backgroundColor: '#FFA500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
