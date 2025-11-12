import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Card, Loading } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase/client';
import * as Haptics from 'expo-haptics';

export default function JoinScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode || inviteCode.length < 6) {
      Alert.alert('Erro', 'Digite um código de convite válido (6 caracteres)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setLoading(true);

      // Verificar se o código existe
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (error || !workspace) {
        throw new Error('Código de convite inválido');
      }

      // Navegar para tela de pergunta secreta
      router.push(`/auth/join/${inviteCode.toUpperCase()}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Join error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Código de convite inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <FadeInView>
            <Text style={styles.title}>💌 Código de Convite</Text>
            <Text style={styles.subtitle}>
              Digite o código que você recebeu
            </Text>
          </FadeInView>

          <FadeInView delay={100}>
            <Card>
              <Input
                label="Código de Convite"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
                maxLength={6}
              />

              <Button
                title={loading ? 'Verificando...' : 'Continuar'}
                onPress={handleJoin}
                loading={loading}
                disabled={loading || inviteCode.length < 6}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Voltar"
                onPress={() => router.back()}
                variant="outline"
                disabled={loading}
              />
            </Card>
          </FadeInView>

          <FadeInView delay={200}>
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ Como funciona?</Text>
              <Text style={styles.infoText}>
                1. Digite o código de 6 caracteres que você recebeu
              </Text>
              <Text style={styles.infoText}>
                2. Responda a pergunta secreta
              </Text>
              <Text style={styles.infoText}>
                3. Crie sua conta e comece a usar!
              </Text>
            </Card>
          </FadeInView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});
