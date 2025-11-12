import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Button, Card } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase/client';

export function VoiceRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [recording, sound]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos de acesso ao microfone para gravar áudio'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Update duration every second
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Store interval for cleanup
      (recording as any).durationInterval = interval;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Erro', 'Falha ao iniciar gravação');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Clear duration interval
      if ((recording as any).durationInterval) {
        clearInterval((recording as any).durationInterval);
      }

      setRecording(null);
      setIsRecording(false);
      setRecordingUri(uri);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Erro', 'Falha ao parar gravação');
    }
  };

  const playSound = async () => {
    if (!recordingUri) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(sound);
      setIsPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
      Alert.alert('Erro', 'Falha ao reproduzir áudio');
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const uploadAudio = async () => {
    if (!recordingUri) return;

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar autenticado');
        return;
      }

      // Convert audio to blob
      const response = await fetch(recordingUri);
      const blob = await response.blob();

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}.m4a`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(filename, blob, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (error) throw error;

      // Save audio record to database (if you have an audio table)
      // You might want to create a 'voice_messages' table
      
      Alert.alert('Sucesso!', 'Áudio enviado com sucesso');
      setRecordingUri(null);
      setDuration(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Erro', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploading(false);
    }
  };

  const deleteRecording = () => {
    setRecordingUri(null);
    setDuration(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>🎤 Gravador de Voz</Text>
        
        {!recordingUri && (
          <View>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.redDot} />
                <Text style={styles.recordingText}>
                  Gravando... {formatDuration(duration)}
                </Text>
              </View>
            )}

            <Button
              title={isRecording ? '⏹️ Parar' : '🎙️ Gravar'}
              onPress={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'secondary' : 'primary'}
            />
          </View>
        )}

        {recordingUri && (
          <View>
            <Text style={styles.durationText}>
              Duração: {formatDuration(duration)}
            </Text>

            <View style={styles.buttonRow}>
              <Button
                title={isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir'}
                onPress={isPlaying ? stopSound : playSound}
                variant="secondary"
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="🗑️ Excluir"
                onPress={deleteRecording}
                variant="outline"
                disabled={uploading}
              />
              <View style={styles.spacer} />
              <Button
                title={uploading ? 'Enviando...' : '📤 Enviar'}
                onPress={uploadAudio}
                loading={uploading}
                disabled={uploading}
              />
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  spacer: {
    width: 8,
  },
});
