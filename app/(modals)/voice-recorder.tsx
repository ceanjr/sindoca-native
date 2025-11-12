import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';

export default function VoiceRecorderModal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card>
          <Text style={styles.title}>🎤 Gravador de Áudio</Text>
          <Text style={styles.subtitle}>
            Implementar com expo-av:
          </Text>
          <Text style={styles.feature}>• Record/Pause/Resume</Text>
          <Text style={styles.feature}>• Waveform visualization</Text>
          <Text style={styles.feature}>• Playback controls</Text>
          <Text style={styles.feature}>• Upload para Supabase</Text>
        </Card>

        <Button
          title="Fechar"
          onPress={() => router.back()}
          variant="outline"
        />
      </View>
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
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  feature: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
