import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

export default function PhotoModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Foto {id}</Text>
        <Text style={styles.subtitle}>
          Lightbox modal - implementar gestos de pinch-to-zoom e swipe
        </Text>
        
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📸</Text>
          <Text style={styles.placeholderSubtext}>
            Imagem será carregada aqui
          </Text>
        </View>

        <Button
          title="Fechar"
          onPress={() => router.back()}
          variant="secondary"
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  placeholder: {
    width: width - 32,
    height: height * 0.5,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
