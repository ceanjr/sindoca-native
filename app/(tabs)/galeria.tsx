import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button, Card } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function GaleriaScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>📸 Galeria</Text>
          <Text style={styles.subtitle}>
            Suas fotos especiais juntos
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <Text style={styles.cardTitle}>Em breve!</Text>
            <Text style={styles.cardText}>
              A galeria de fotos está sendo migrada do PWA.
            </Text>
            <Text style={styles.cardText}>
              Em breve você poderá adicionar e ver todas as suas fotos aqui.
            </Text>
          </Card>
        </FadeInView>

        {user && (
          <FadeInView delay={200}>
            <Card>
              <Text style={styles.infoText}>
                👤 Conectado como: {user.email}
              </Text>
            </Card>
          </FadeInView>
        )}
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
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
