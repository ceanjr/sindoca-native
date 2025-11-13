import { FadeInView, MarqueeText } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { CONTENT_PADDING_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Reason {
  id: string;
  reason: string;
  description?: string;
  category: string;
  created_at: string;
  author_id: string;
  subject: string;
  added_by_name: string;
}

const REASONS_PER_PAGE = 9;

export default function RazoesScreen() {
  const { user } = useAuth();
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newReason, setNewReason] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [editingReason, setEditingReason] = useState<Reason | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'sindy' | 'junior'>('all');
  const [visibleCount, setVisibleCount] = useState(REASONS_PER_PAGE);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set()
  );
  const [randomModalVisible, setRandomModalVisible] = useState(false);
  const [randomReason, setRandomReason] = useState<Reason | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadReasons();
      subscribeToReasons();
    }
  }, [user]);

  const subscribeToReasons = () => {
    if (!workspaceId) return;

    const channel = supabase
      .channel('reasons-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadReasons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadReasons = async () => {
    try {
      const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id, user_id')
        .eq('user_id', user!.id)
        .single();

      if (!members) return;
      setWorkspaceId(members.workspace_id);

      // Get partner ID
      const { data: allMembers } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', members.workspace_id);

      const partner = allMembers?.find((m) => m.user_id !== user!.id);
      if (partner) {
        setPartnerId(partner.user_id);
      }

      const { data, error } = await supabase
        .from('content')
        .select('*, profiles!content_author_id_fkey (full_name, nickname)')
        .eq('workspace_id', members.workspace_id)
        .eq('type', 'love_reason')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReasons(
          data.map((item) => ({
            id: item.id,
            reason: item.data?.reason || '',
            description: item.data?.description || item.data?.secret || '',
            category: item.data?.category || 'Geral',
            created_at: item.created_at,
            author_id: item.author_id,
            subject: item.data?.subject || 'sindy',
            added_by_name:
              (item as any).profiles?.nickname ||
              (item as any).profiles?.full_name ||
              'Desconhecido',
          }))
        );
      }
    } catch (error) {
      console.error('Error loading reasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReasons = useMemo(() => {
    if (activeTab === 'all') return reasons;
    return reasons.filter((r) => r.subject === activeTab);
  }, [reasons, activeTab]);

  const visibleReasons = useMemo(() => {
    return filteredReasons.slice(0, visibleCount);
  }, [filteredReasons, visibleCount]);

  const reasonCounts = useMemo(() => {
    return {
      all: reasons.length,
      sindy: reasons.filter((r) => r.subject === 'sindy').length,
      junior: reasons.filter((r) => r.subject === 'junior').length,
    };
  }, [reasons]);

  const addReason = async () => {
    if (!newReason.trim() || !workspaceId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (editingReason) {
        // Update
        await supabase
          .from('content')
          .update({
            data: {
              reason: newReason.trim(),
              description: newDescription.trim(),
              category: 'Geral',
              subject: 'sindy',
            },
          })
          .eq('id', editingReason.id);

        Alert.alert('Sucesso', 'Razão atualizada!');
      } else {
        // Insert
        await supabase.from('content').insert({
          workspace_id: workspaceId,
          author_id: user!.id,
          type: 'love_reason',
          data: {
            reason: newReason.trim(),
            description: newDescription.trim(),
            category: 'Geral',
            subject: 'sindy',
          },
        });

        Alert.alert('Sucesso', 'Nova razão adicionada!');

        // Send push notification to partner
        if (partnerId) {
          try {
            await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/push/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientUserId: partnerId,
                title: 'Nova razão adicionada!',
                body: 'Seu parceiro adicionou uma nova razão para amar você ❤️',
                data: { screen: '/razoes' },
              }),
            });
          } catch (error) {
            console.log('Error sending notification:', error);
          }
        }
      }

      setNewReason('');
      setNewDescription('');
      setEditingReason(null);
      setModalVisible(false);
      loadReasons();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding reason:', error);
      Alert.alert('Erro', 'Erro ao adicionar razão');
    }
  };

  const editReason = (reason: Reason) => {
    setOpenMenuId(null);
    setEditingReason(reason);
    setNewReason(reason.reason);
    setNewDescription(reason.description || '');
    setModalVisible(true);
  };

  const deleteReason = async (reasonId: string) => {
    setOpenMenuId(null);
    Alert.alert('Apagar razão', 'Tem certeza que deseja apagar esta razão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('content').delete().eq('id', reasonId);
            loadReasons();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Razão apagada!');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível apagar a razão');
          }
        },
      },
    ]);
  };

  const toggleSecret = (reasonId: string) => {
    setRevealedSecrets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reasonId)) {
        newSet.delete(reasonId);
      } else {
        newSet.add(reasonId);
      }
      return newSet;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const showRandomReason = () => {
    if (filteredReasons.length === 0) return;

    const random =
      filteredReasons[Math.floor(Math.random() * filteredReasons.length)];
    setRandomReason(random);
    setRandomModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + REASONS_PER_PAGE);
  };

  const hasMoreReasons = visibleCount < filteredReasons.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <FadeInView>
          <View style={styles.headerContent}>
            <Ionicons name="heart" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Razões</Text>
              <Text style={styles.subtitle}>
                {filteredReasons.length} motivo(s) para amar
              </Text>
            </View>
          </View>
        </FadeInView>

        <View style={styles.headerActions}>
          {filteredReasons.length >= 7 && (
            <TouchableOpacity
              style={styles.randomButton}
              onPress={showRandomReason}
              activeOpacity={0.7}
            >
              <Ionicons name="shuffle" size={20} color={Colors.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingReason(null);
              setNewReason('');
              setNewDescription('');
              setModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => {
            setActiveTab('all');
            setVisibleCount(REASONS_PER_PAGE);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.tabTextActive,
            ]}
          >
            Todas ({reasonCounts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sindy' && styles.tabActive]}
          onPress={() => {
            setActiveTab('sindy');
            setVisibleCount(REASONS_PER_PAGE);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sindy' && styles.tabTextActive,
            ]}
          >
            Sindy ({reasonCounts.sindy})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'junior' && styles.tabActive]}
          onPress={() => {
            setActiveTab('junior');
            setVisibleCount(REASONS_PER_PAGE);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'junior' && styles.tabTextActive,
            ]}
          >
            Junior ({reasonCounts.junior})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overlay to close menu when clicking outside */}
      {openMenuId && (
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setOpenMenuId(null)}
        />
      )}

      {/* Reasons List */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: CONTENT_PADDING_BOTTOM },
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando razões...</Text>
          </View>
        ) : visibleReasons.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="sparkles-outline"
              size={64}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyText}>Nenhuma razão ainda</Text>
            <Text style={styles.emptySubtext}>
              Adicione os motivos que fazem você amar
            </Text>
          </View>
        ) : (
          <>
            {visibleReasons.map((reason, index) => (
              <FadeInView key={reason.id} delay={index * 50}>
                <View style={styles.reasonCard}>
                  <View style={styles.reasonHeader}>
                    <View style={styles.reasonIconContainer}>
                      <Ionicons name="heart" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.reasonContent}>
                      <MarqueeText
                        text={reason.reason}
                        style={styles.reasonText}
                        speed={15}
                      />
                      <Text style={styles.authorText}>
                        Adicionado por {reason.added_by_name}
                      </Text>
                      {reason.description && (
                        <TouchableOpacity
                          onPress={() => toggleSecret(reason.id)}
                          style={styles.secretButton}
                        >
                          <Ionicons
                            name={
                              revealedSecrets.has(reason.id) ? 'eye-off' : 'eye'
                            }
                            size={16}
                            color={Colors.textSecondary}
                          />
                          <Text style={styles.secretButtonText}>
                            {revealedSecrets.has(reason.id)
                              ? 'Ocultar'
                              : 'Revelar'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {revealedSecrets.has(reason.id) && reason.description && (
                        <View style={styles.descriptionContainer}>
                          <Text style={styles.descriptionText}>
                            {reason.description}
                          </Text>
                        </View>
                      )}
                    </View>
                    {reason.author_id === user?.id && (
                      <View style={styles.menuContainer}>
                        <TouchableOpacity
                          onPress={() => {
                            setOpenMenuId(
                              openMenuId === reason.id ? null : reason.id
                            );
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }}
                          style={styles.menuButton}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color={Colors.textSecondary}
                          />
                        </TouchableOpacity>
                        {openMenuId === reason.id && (
                          <View style={styles.dropdownMenu}>
                            <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => editReason(reason)}
                            >
                              <Ionicons
                                name="pencil"
                                size={18}
                                color={Colors.textSecondary}
                              />
                              <Text style={styles.menuItemText}>Editar</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity
                              style={styles.menuItem}
                              onPress={() => deleteReason(reason.id)}
                            >
                              <Ionicons
                                name="trash"
                                size={18}
                                color={Colors.error}
                              />
                              <Text
                                style={[
                                  styles.menuItemText,
                                  styles.menuItemTextDanger,
                                ]}
                              >
                                Apagar
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </FadeInView>
            ))}

            {hasMoreReasons && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMore}
              >
                <Text style={styles.loadMoreText}>
                  Carregar mais ({filteredReasons.length - visibleCount}{' '}
                  restantes)
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Reason Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingReason ? 'Editar Razão' : 'Nova Razão'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Ex: Seu sorriso ilumina meu dia"
                placeholderTextColor={Colors.textTertiary}
                value={newReason}
                onChangeText={setNewReason}
                multiline
                maxLength={200}
                autoFocus
              />

              <TextInput
                style={styles.input}
                placeholder="Descrição ou segredo (opcional)"
                placeholderTextColor={Colors.textTertiary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                maxLength={300}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !newReason.trim() && styles.submitButtonDisabled,
                ]}
                onPress={addReason}
                disabled={!newReason.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>
                  {editingReason ? 'Atualizar' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Random Reason Modal */}
      <Modal
        visible={randomModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRandomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.randomModalContent}>
            <View style={styles.randomIconContainer}>
              <Ionicons name="sparkles" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.randomTitle}>Razão Aleatória</Text>
            {randomReason && (
              <View style={styles.randomReasonCard}>
                <Text style={styles.randomReasonText}>
                  {randomReason.reason}
                </Text>
                {randomReason.description && (
                  <Text style={styles.randomDescriptionText}>
                    {randomReason.description}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.randomCloseButton}
              onPress={() => setRandomModalVisible(false)}
            >
              <Text style={styles.randomCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGradient,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  randomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  reasonCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
  },
  reasonHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reasonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  reasonContent: {
    flex: 1,
    gap: 8,
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  authorText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  secretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secretButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    fontStyle: 'italic',
  },
  menuContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    minWidth: 140,
    paddingVertical: 4,
    zIndex: 1002,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  menuItemTextDanger: {
    color: Colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  loadMoreButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  randomModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  randomIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  randomTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  randomReasonCard: {
    width: '100%',
    padding: 20,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 16,
    marginBottom: 24,
  },
  randomReasonText: {
    fontSize: 18,
    lineHeight: 26,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  randomDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  randomCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  randomCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
