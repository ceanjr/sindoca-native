import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { Button, Card } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigate to login screen
              // router.replace('/auth/login');
            } catch (error: any) {
              Alert.alert('Erro', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>👤 Perfil</Text>
          <Text style={styles.subtitle}>
            Suas informações
          </Text>
        </FadeInView>

        {user && (
          <>
            <FadeInView delay={100}>
              <Card>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user.email}</Text>
              </Card>
            </FadeInView>

            <FadeInView delay={200}>
              <Card>
                <Text style={styles.label}>ID do Usuário</Text>
                <Text style={styles.valueSmall}>{user.id}</Text>
              </Card>
            </FadeInView>

            <FadeInView delay={300}>
              <Card>
                <Text style={styles.label}>Conectado desde</Text>
                <Text style={styles.value}>
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </Card>
            </FadeInView>

            <FadeInView delay={400}>
              <View style={styles.buttonContainer}>
                <Button
                  title="Sair"
                  variant="outline"
                  onPress={handleSignOut}
                />
              </View>
            </FadeInView>
          </>
        )}

        {!user && (
          <FadeInView delay={100}>
            <Card>
              <Text style={styles.cardText}>
                Você não está conectado.
              </Text>
              <Button
                title="Fazer Login"
                onPress={() => {
                  // router.push('/auth/login');
                }}
              />
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: Colors.text,
  },
  valueSmall: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
