import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { Button, Card, Input } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export function PushNotificationTester() {
  const { user } = useAuth();
  const [title, setTitle] = useState('Teste de notificação');
  const [message, setMessage] = useState('Esta é uma mensagem de teste');
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    try {
      setSending(true);

      // Call the API route to send push notification
      const response = await fetch('https://sindoca.vercel.app/api/push/send-expo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          body: message,
          data: {
            screen: '/(tabs)/',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('Notification sent:', result);

      Alert.alert('Sucesso!', 'Notificação enviada com sucesso');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      Alert.alert('Erro', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>🔔 Testar Push Notifications</Text>
        <Text style={styles.subtitle}>
          Envie uma notificação de teste para você mesmo
        </Text>

        <Input
          label="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Título da notificação"
        />

        <Input
          label="Mensagem"
          value={message}
          onChangeText={setMessage}
          placeholder="Conteúdo da notificação"
          multiline
          numberOfLines={3}
        />

        <Button
          title={sending ? 'Enviando...' : '📤 Enviar Notificação'}
          onPress={sendTestNotification}
          loading={sending}
          disabled={sending || !user}
        />

        {!user && (
          <Text style={styles.warningText}>
            ⚠️ Faça login para testar notificações
          </Text>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Importante:</Text>
          <Text style={styles.infoText}>
            • Notificações só funcionam em dispositivos físicos
          </Text>
          <Text style={styles.infoText}>
            • Não funcionam em simuladores/emuladores
          </Text>
          <Text style={styles.infoText}>
            • Teste com o app em foreground, background e fechado
          </Text>
        </View>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});
