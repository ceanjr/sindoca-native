import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button, Card } from '@/components/ui';
import { FadeInView, ScaleOnPress } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationTester } from '@/components/notifications/PushTester';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>❤️ Sindoca</Text>
          <Text style={styles.subtitle}>
            App nativo completo!
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <Text style={styles.cardTitle}>🎉 Fase 3 Completa!</Text>
            <Text style={styles.cardText}>
              Todos os recursos nativos implementados!
            </Text>
          </Card>
        </FadeInView>

        {user && (
          <FadeInView delay={200}>
            <Card>
              <Text style={styles.cardTitle}>👋 Olá!</Text>
              <Text style={styles.cardText}>
                Você está conectado como: {user.email}
              </Text>
            </Card>
          </FadeInView>
        )}

        <FadeInView delay={300}>
          <Card>
            <Text style={styles.cardTitle}>✅ Features Implementadas</Text>
            <Text style={styles.cardText}>
              • Push Notifications{'\n'}
              • Câmera & Galeria{'\n'}
              • Gravação de Áudio{'\n'}
              • Animações Complexas{'\n'}
              • Deep Linking{'\n'}
              • Offline Mode{'\n'}
              • Spotify OAuth
            </Text>
          </Card>
        </FadeInView>

        <FadeInView delay={400}>
          <Card>
            <Text style={styles.cardTitle}>🧪 Testar Features</Text>
            <View style={styles.buttonRow}>
              <Button
                title="📸 Galeria"
                onPress={() => router.push('/(tabs)/galeria')}
                size="small"
              />
              <View style={styles.spacer} />
              <Button
                title="🎤 Áudio"
                onPress={() => router.push('/(modals)/voice-recorder')}
                size="small"
                variant="secondary"
              />
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={500}>
          <PushNotificationTester />
        </FadeInView>

        <FadeInView delay={600}>
          <ScaleOnPress>
            <Card style={styles.highlightCard}>
              <Text style={styles.highlightText}>
                🚀 App Completo!
              </Text>
              <Text style={styles.highlightSubtext}>
                Fases 1, 2 e 3 implementadas
              </Text>
            </Card>
          </ScaleOnPress>
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
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  spacer: {
    width: 8,
  },
  highlightCard: {
    backgroundColor: Colors.primary,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  highlightSubtext: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
});
