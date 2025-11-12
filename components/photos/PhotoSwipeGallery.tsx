import React from 'react';
import { StyleSheet, View, Dimensions, Image, Text } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface Photo {
  id: string;
  uri: string;
  caption?: string;
}

interface PhotoSwipeGalleryProps {
  photos: Photo[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function PhotoSwipeGallery({
  photos,
  initialIndex = 0,
  onClose,
  onIndexChange,
}: PhotoSwipeGalleryProps) {
  const translateX = useSharedValue(-initialIndex * width);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const updateIndex = (newIndex: number) => {
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = -currentIndex * width + e.translationX;
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      const translation = e.translationX;

      let newIndex = currentIndex;

      // Determine if we should move to next/previous image
      if (Math.abs(velocity) > 500 || Math.abs(translation) > width / 3) {
        if (translation > 0 && currentIndex > 0) {
          // Swipe right - go to previous
          newIndex = currentIndex - 1;
        } else if (translation < 0 && currentIndex < photos.length - 1) {
          // Swipe left - go to next
          newIndex = currentIndex + 1;
        }
      }

      translateX.value = withSpring(-newIndex * width, {
        velocity: velocity / 1000,
      });

      if (newIndex !== currentIndex) {
        runOnJS(updateIndex)(newIndex);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.scrollContainer, animatedStyle]}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.imageContainer}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.image}
                resizeMode="contain"
              />
              {photo.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.caption}>{photo.caption}</Text>
                </View>
              )}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Page indicator */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {photos.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContainer: {
    flexDirection: 'row',
    height: height,
  },
  imageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    padding: 16,
  },
  caption: {
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: Colors.overlay,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
