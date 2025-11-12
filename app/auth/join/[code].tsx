import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Input, Card, Loading } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function JoinWithCodeScreen() {
  const { code } = useLocalSearchParams();
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [code]);

  const loadWorkspace = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('invite_code', code)
        .single();

      if (error || !data) {
        throw new Error('Workspace not found');
      }

      setWorkspace(data);
    } catch (error: any) {
      console.error('Load workspace error:', error);
      Alert.alert('Erro', 'Código de convite inválido');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!answer || !email || !password || !fullName) {
      Alert.alert('Erro', 'Preencha todos os campos');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 6 caracteres');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setSubmitting(true);

      // Verificar resposta secreta (você precisará criar uma função no backend)
      const { data: verifyData, error: verifyError } = await supabase
        .rpc('verify_secret_answer', {
          workspace_id: workspace.id,
          answer: answer.toLowerCase(),
        });

      if (verifyError || !verifyData) {
        throw new Error('Resposta incorreta');
      }

      // Criar conta
      await signUp(email, password, fullName);

      // Adicionar usuário ao workspace
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('workspace_members').insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'member',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Sucesso!',
        'Você entrou no workspace! Verifique seu email para confirmar.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/') }]
      );
    } catch (error: any) {
      console.error('Join error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Falha ao entrar no workspace');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading fullscreen />;
  }

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
            <Text style={styles.title}>🔐 Pergunta Secreta</Text>
            <Text style={styles.subtitle}>
              Workspace: {workspace?.name}
            </Text>
          </FadeInView>

          <FadeInView delay={100}>
            <Card>
              <Text style={styles.question}>
                {workspace?.secret_question}
              </Text>

              <Input
                label="Sua Resposta"
                value={answer}
                onChangeText={setAnswer}
                placeholder="Digite sua resposta"
                autoCapitalize="none"
              />
            </Card>
          </FadeInView>

          <FadeInView delay={200}>
            <Card>
              <Text style={styles.sectionTitle}>Criar sua Conta</Text>
              
              <Input
                label="Nome Completo"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Seu nome completo"
                autoCapitalize="words"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Input
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
              />

              <Button
                title={submitting ? 'Entrando...' : 'Entrar no Workspace'}
                onPress={handleJoin}
                loading={submitting}
                disabled={submitting}
              />

              <Button
                title="Voltar"
                onPress={() => router.back()}
                variant="outline"
                disabled={submitting}
              />
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
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
});
