import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import PhotoUploadComponent from '@/components/photos/PhotoUpload';

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

        {user ? (
          <PhotoUploadComponent />
        ) : (
          <FadeInView delay={100}>
            <Card>
              <Text style={styles.cardText}>
                Faça login para acessar a galeria
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
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
