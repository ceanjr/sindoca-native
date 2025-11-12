import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';

export default function StoryViewerModal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Card>
          <Text style={styles.title}>📖 Story Viewer</Text>
          <Text style={styles.subtitle}>
            Implementar Stories estilo Instagram:
          </Text>
          <Text style={styles.feature}>• Swipe horizontal entre stories</Text>
          <Text style={styles.feature}>• Progress bar animada</Text>
          <Text style={styles.feature}>• Tap para pausar/avançar</Text>
          <Text style={styles.feature}>• Auto-advance com timer</Text>
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
    backgroundColor: Colors.black,
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
