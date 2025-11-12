import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, Alert } from 'react-native';
import { Button, Card, Loading } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useImagePicker } from '@/hooks/useImagePicker';
import { supabase } from '@/lib/supabase/client';
import * as Haptics from 'expo-haptics';

export default function PhotoUploadComponent() {
  const { pickFromCamera, pickFromGallery } = useImagePicker();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    const uri = await pickFromCamera();
    if (uri) {
      setSelectedImage(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSelectFromGallery = async () => {
    const uri = await pickFromGallery(false);
    if (uri && typeof uri === 'string') {
      setSelectedImage(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar autenticado');
        return;
      }

      // Convert image to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      // Save photo record to database
      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          file_path: data.path,
          caption: '',
        });

      if (dbError) throw dbError;

      Alert.alert('Sucesso!', 'Foto enviada com sucesso');
      setSelectedImage(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Erro', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FadeInView>
          <Text style={styles.title}>📸 Upload de Foto</Text>
          <Text style={styles.subtitle}>
            Tire uma foto ou selecione da galeria
          </Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card>
            <View style={styles.buttonContainer}>
              <Button
                title="📷 Tirar Foto"
                onPress={handleTakePhoto}
                disabled={uploading}
              />
              <View style={styles.spacer} />
              <Button
                title="🖼️ Galeria"
                onPress={handleSelectFromGallery}
                variant="secondary"
                disabled={uploading}
              />
            </View>
          </Card>
        </FadeInView>

        {selectedImage && (
          <FadeInView delay={200}>
            <Card>
              <Image source={{ uri: selectedImage }} style={styles.preview} />
              <View style={styles.buttonContainer}>
                <Button
                  title="❌ Cancelar"
                  onPress={() => setSelectedImage(null)}
                  variant="outline"
                  disabled={uploading}
                />
                <View style={styles.spacer} />
                <Button
                  title={uploading ? 'Enviando...' : '✅ Upload'}
                  onPress={handleUpload}
                  loading={uploading}
                  disabled={uploading}
                />
              </View>
            </Card>
          </FadeInView>
        )}

        {uploading && (
          <FadeInView delay={300}>
            <Card>
              <Loading />
              <Text style={styles.loadingText}>Enviando foto...</Text>
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
  buttonContainer: {
    flexDirection: 'row',
  },
  spacer: {
    width: 8,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  loadingText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
