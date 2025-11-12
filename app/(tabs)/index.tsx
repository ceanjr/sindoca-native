import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Button, Card } from '@/components/ui';
import { FadeInView, ScaleOnPress } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>❤️ Sindoca</Text>
          <Text style={styles.subtitle}>
            Bem-vindo ao app nativo!
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <Text style={styles.cardTitle}>🎉 Migração em Andamento</Text>
            <Text style={styles.cardText}>
              Este é o novo app nativo do Sindoca, construído com Expo e React Native.
            </Text>
            <Text style={styles.cardText}>
              Fase 2 completa! UI components, navegação e estilos implementados.
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
            <Text style={styles.cardTitle}>✅ Fase 1 Completa</Text>
            <Text style={styles.cardText}>
              • Supabase configurado{'\n'}
              • Push Notifications prontos{'\n'}
              • Estrutura de pastas criada
            </Text>
          </Card>
        </FadeInView>

        <FadeInView delay={400}>
          <Card>
            <Text style={styles.cardTitle}>✅ Fase 2 Completa</Text>
            <Text style={styles.cardText}>
              • Componentes UI base criados{'\n'}
              • Navegação configurada{'\n'}
              • Context API implementado{'\n'}
              • Animações funcionando
            </Text>
          </Card>
        </FadeInView>

        <FadeInView delay={500}>
          <ScaleOnPress>
            <Card style={styles.highlightCard}>
              <Text style={styles.highlightText}>
                🚀 Pronto para Fase 3!
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
  highlightCard: {
    backgroundColor: Colors.primary,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
});
