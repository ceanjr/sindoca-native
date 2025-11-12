import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';

export default function MusicaScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>🎵 Música</Text>
          <Text style={styles.subtitle}>
            Playlist colaborativa
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <Text style={styles.cardTitle}>Em breve!</Text>
            <Text style={styles.cardText}>
              A integração com Spotify está sendo migrada do PWA.
            </Text>
            <Text style={styles.cardText}>
              Em breve você poderá criar e gerenciar sua playlist colaborativa aqui.
            </Text>
          </Card>
        </FadeInView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
