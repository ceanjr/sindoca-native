import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function MensagensScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>💌 Mensagens</Text>
          <Text style={styles.subtitle}>
            Conversas românticas
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <Text style={styles.cardTitle}>Em breve!</Text>
            <Text style={styles.cardText}>
              O sistema de mensagens está sendo migrado do PWA.
            </Text>
            <Text style={styles.cardText}>
              Em breve você poderá enviar mensagens românticas aqui.
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
