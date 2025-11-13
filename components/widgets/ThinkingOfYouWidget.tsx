import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { FadeInView } from '@/components/animations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface ThinkingOfYouWidgetProps {
  workspaceId: string;
  partnerId: string;
  partnerName?: string;
}

// Progressive messages that get more intense with each click
const PROGRESSIVE_MESSAGES = [
  '{partnerName} pensou em você. De novo. Claro.',
  '{partnerName} ainda não superou o pensamento anterior.',
  '{partnerName} tá basicamente com você alugando um triplex na mente.',
  'Mais uma hora, mais um looping mental de {partnerName}.',
  '{partnerName} jura que é coincidência pensar tanto assim.',
  'Aparentemente, você é o único assunto de {partnerName} hoje.',
  '{partnerName} começou a falar de você com o espelho. Só avisando.',
  "{partnerName} já tá pesquisando o significado de 'pensar demais'.",
  'Isso já ultrapassou o limite do saudável, {partnerName}.',
  '{partnerName} tá um passo de fundar o fã-clube oficial. Cuidado.',
];

const PROGRESSIVE_TITLES = [
  '💭 De novo por aqui',
  '💕 Ainda por aí',
  '🏠 Morando na mente',
  '🔄 Loop ativado',
  '🤷 Só coincidência...',
  '📢 Assunto principal',
  '🪞 Conversa solo',
  '🔍 Pesquisando ajuda',
  '⚠️ Nível crítico',
  '🎪 Fã-clube incoming',
];

const MAX_CLICKS_PER_DAY = 10;
const COOLDOWN_HOURS = 2;

export default function ThinkingOfYouWidget({
  workspaceId,
  partnerId,
  partnerName = 'Alguém especial',
}: ThinkingOfYouWidgetProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [todayClickCount, setTodayClickCount] = useState(0);
  const [partnerThoughts, setPartnerThoughts] = useState<{
    count: number;
    lastMessage?: string;
    lastReceivedAt?: Date;
  }>({ count: 0 });

  // Load user profile
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    };

    loadProfile();
  }, [user]);

  // Load user's clicks today
  useEffect(() => {
    if (!user) return;

    const loadTodayClicks = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('content')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .eq('author_id', user.id)
        .eq('type', 'message')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTodayClickCount(data.length);
        setLastSentTime(new Date(data[0].created_at));
      }
    };

    loadTodayClicks();
  }, [user, workspaceId]);

  // Check partner's thoughts for today
  useEffect(() => {
    if (!user || !partnerId) return;

    const checkPartnerThoughts = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('content')
        .select('description, created_at, author_id, data')
        .eq('workspace_id', workspaceId)
        .eq('author_id', partnerId)
        .eq('type', 'message')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setPartnerThoughts({
          count: data.length,
          lastMessage: data[0].description,
          lastReceivedAt: new Date(data[0].created_at),
        });
      } else {
        setPartnerThoughts({ count: 0 });
      }
    };

    checkPartnerThoughts();

    // Subscribe to new messages
    const channel = supabase
      .channel(`thinking-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: any) => {
          if (
            payload.new?.type === 'message' &&
            payload.new?.author_id === partnerId
          ) {
            setPartnerThoughts((prev) => ({
              count: prev.count + 1,
              lastMessage: payload.new.description,
              lastReceivedAt: new Date(payload.new.created_at),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, workspaceId]);

  const canSend = () => {
    if (todayClickCount >= MAX_CLICKS_PER_DAY) {
      return false;
    }

    if (!lastSentTime) return true;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    return timeSinceLastSend > cooldownMs;
  };

  const getRemainingCooldown = () => {
    if (!lastSentTime) return 0;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    const remaining = cooldownMs - timeSinceLastSend;
    const remainingMinutes = Math.ceil(remaining / 1000 / 60);

    if (remainingMinutes >= 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }

    return `${remainingMinutes} min`;
  };

  const sendNotification = async () => {
    if (!user) return;

    if (todayClickCount >= MAX_CLICKS_PER_DAY) {
      alert(`Limite diário atingido! Você já pensou ${MAX_CLICKS_PER_DAY}x hoje. Descanse um pouco! 😅`);
      return;
    }

    if (!canSend()) {
      alert(`Aguarde um pouco! Você pode enviar novamente em ${getRemainingCooldown()}`);
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const messageIndex = Math.min(todayClickCount, MAX_CLICKS_PER_DAY - 1);
      const messageTemplate = PROGRESSIVE_MESSAGES[messageIndex];
      const senderName = profile?.nickname || profile?.full_name || 'Alguém especial';
      const message = messageTemplate.replace(/{partnerName}/g, senderName);

      const { error: insertError } = await supabase.from('content').insert({
        workspace_id: workspaceId,
        author_id: user.id,
        type: 'message',
        title: 'Pensando em Você',
        description: message,
        data: {
          type: 'thinking_of_you',
          sent_at: new Date().toISOString(),
          message_index: messageIndex,
        },
      });

      if (insertError) {
        throw new Error(`Erro ao salvar: ${insertError.message}`);
      }

      setLastSentTime(new Date());
      setTodayClickCount((prev) => prev + 1);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      alert(`Erro ao enviar: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getButtonText = () => {
    const remainingClicks = MAX_CLICKS_PER_DAY - todayClickCount;
    const clickText = remainingClicks <= 3 && remainingClicks > 0 ? ` (${remainingClicks} restantes)` : '';
    return ['Dependência Emocional', `Diga que está pensando${clickText}`];
  };

  return (
    <FadeInView delay={400}>
      <View style={styles.container}>
        {/* Button Section */}
        <TouchableOpacity
          style={[styles.button, (!canSend() || isSending) && styles.buttonDisabled]}
          onPress={sendNotification}
          disabled={isSending || !canSend()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="heart"
            size={36}
            color={Colors.white}
            style={styles.buttonIcon}
          />
          <View style={styles.buttonContent}>
            {isSending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.buttonTitle}>Enviando...</Text>
              </View>
            ) : !canSend() && todayClickCount < MAX_CLICKS_PER_DAY ? (
              <>
                <Text style={styles.buttonTitle}>Aguarde</Text>
                <Text style={styles.buttonSubtitle}>{getRemainingCooldown()}</Text>
              </>
            ) : todayClickCount >= MAX_CLICKS_PER_DAY ? (
              <>
                <Text style={styles.buttonTitle}>Limite atingido!</Text>
                <Text style={styles.buttonSubtitle}>
                  {todayClickCount}/{MAX_CLICKS_PER_DAY} hoje
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonTitle}>{getButtonText()[0]}</Text>
                <Text style={styles.buttonSubtitle}>{getButtonText()[1]}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Status Section */}
        <View style={styles.statusCard}>
          {partnerThoughts.count > 0 ? (
            <View>
              <View style={styles.statusHeader}>
                <View style={styles.statusTitleContainer}>
                  <Ionicons name="heart" size={20} color={Colors.primary} />
                  <Text style={styles.statusTitle}>
                    {partnerName} pensou em você hoje!
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{partnerThoughts.count}x</Text>
                </View>
              </View>
              <Text style={styles.statusMessage}>
                "{partnerThoughts.lastMessage}"
              </Text>
              {partnerThoughts.lastReceivedAt && (
                <Text style={styles.statusTime}>
                  Recebido às {formatTime(partnerThoughts.lastReceivedAt)}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyStatus}>
              <Ionicons name="heart-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyStatusText}>
                {partnerName} ainda não pensou em você hoje...
              </Text>
              <Text style={styles.emptyStatusSubtext}>
                Acho que você deveria começar uma briga
              </Text>
            </View>
          )}
        </View>
      </View>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonContent: {
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statusMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  statusTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  emptyStatus: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyStatusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyStatusSubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
