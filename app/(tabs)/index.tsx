import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { CONTENT_PADDING_BOTTOM } from '@/constants/layout';
import { FadeInView, ScaleInView } from '@/components/animations';
import DaysCounter from '@/components/DaysCounter';
import ThinkingOfYouWidget from '@/components/widgets/ThinkingOfYouWidget';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [workspaceData, setWorkspaceData] = useState<{
    workspaceId: string;
    partnerId: string;
    partnerName: string;
  } | null>(null);

  // Load workspace and partner info - MUST be at the top before any returns!
  useEffect(() => {
    const loadWorkspace = async () => {
      if (user) {
        try {
          // Get workspace
          const { data: members, error: membersError } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .single();

          if (membersError || !members) return;

          // Get all members to find partner
          const { data: allMembers, error: allMembersError } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', members.workspace_id);

          if (allMembersError || !allMembers) return;

          // Find partner
          const partnerId = allMembers?.find(m => m.user_id !== user.id)?.user_id;

          if (partnerId) {
            // Get partner profile
            const { data: partnerProfile, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, nickname')
              .eq('id', partnerId)
              .single();

            if (!profileError && partnerProfile) {
              setWorkspaceData({
                workspaceId: members.workspace_id,
                partnerId: partnerId,
                partnerName: partnerProfile.nickname || partnerProfile.full_name || 'Alguém especial',
              });
            }
          }
        } catch (error) {
          console.error('Error loading workspace:', error);
        }
      }
    };
    loadWorkspace();
  }, [user]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="heart" size={48} color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  const isSindy = user.email === 'sindyguimaraes.a@gmail.com';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{flex: 1}} contentContainerStyle={[styles.content, { paddingBottom: CONTENT_PADDING_BOTTOM }]}>
        {/* Hero Section */}
        <FadeInView>
        <View style={styles.heroSection}>
          <ScaleInView delay={100}>
            <Ionicons
              name="heart"
              size={64}
              color={Colors.primary}
              style={styles.heroHeart}
            />
          </ScaleInView>

          <Text style={styles.heroTitle}>
            Bem-vinda,{'\n'}
            <Text style={styles.heroTitleAccent}>Sindoca!</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Seja a Maria Bethânia dos meus sonhos mais sacanas.
          </Text>
        </View>
      </FadeInView>

      {/* Days Counter */}
      <View style={styles.counterSection}>
        <DaysCounter showQuote={true} />
      </View>

      {/* Thinking of You Widget */}
      {workspaceData && (
        <ThinkingOfYouWidget
          workspaceId={workspaceData.workspaceId}
          partnerId={workspaceData.partnerId}
          partnerName={workspaceData.partnerName}
        />
      )}

      {/* Credentials Card - Only for Sindy */}
      {isSindy && (
        <FadeInView delay={400}>
          <View style={styles.credentialsCard}>
            <View style={styles.credentialsHeader}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.credentialsTitle}>
                Suas Credenciais Extremamente Sigilosas
              </Text>
            </View>

            <View style={styles.credentialsContent}>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Email</Text>
                <View style={styles.credentialValue}>
                  <Text style={styles.credentialText}>
                    sindyguimaraes.a@gmail.com
                  </Text>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Senha</Text>
                <View style={styles.credentialValue}>
                  <Text style={styles.credentialText}>feitopelomozao</Text>
                </View>
              </View>
            </View>

            <Text style={styles.credentialsFooter}>
              💡 Guarde essas informações com carinho (para fazer login)
            </Text>
          </View>
        </FadeInView>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGradient,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGradient,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroHeart: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 56,
  },
  heroTitleAccent: {
    color: Colors.primary,
  },
  heroSubtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 28,
  },
  counterSection: {
    marginBottom: 32,
  },
  credentialsCard: {
    backgroundColor: `${Colors.primary}15`, // 15% opacity
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  lockIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  credentialsContent: {
    gap: 12,
  },
  credentialItem: {
    gap: 4,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  credentialValue: {
    backgroundColor: `${Colors.white}80`, // 50% opacity
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  credentialText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.text,
  },
  credentialsFooter: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
