import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { VoiceRecorder } from '@/components/audio/VoiceRecorder';

export default function VoiceRecorderModal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <VoiceRecorder />
        
        <View style={styles.closeButtonContainer}>
          <Button
            title="Fechar"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  closeButtonContainer: {
    padding: 16,
    marginTop: 16,
  },
});
