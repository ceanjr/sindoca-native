import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface NotificationSettings {
  push_enabled: boolean;
  music_notifications: boolean;
  photo_notifications: boolean;
  reason_notifications: boolean;
  daily_reminder: boolean;
}

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingItem({
  icon,
  iconColor = Colors.primary,
  title,
  description,
  value,
  onValueChange,
  disabled,
}: SettingItemProps) {
  const handleToggle = (newValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(newValue);
  };

  return (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={handleToggle}
        trackColor={{ false: Colors.borderLight, true: `${Colors.primary}50` }}
        thumbColor={value ? Colors.primary : Colors.white}
        disabled={disabled}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    music_notifications: true,
    photo_notifications: true,
    reason_notifications: true,
    daily_reminder: false,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if they don't exist
        const defaultSettings = {
          user_id: user.id,
          push_enabled: true,
          music_notifications: true,
          photo_notifications: true,
          reason_notifications: true,
          daily_reminder: false,
        };

        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert([defaultSettings]);

        if (!insertError) {
          setSettings(defaultSettings);
        }
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean
  ) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating setting:', error);
      // Revert on error
      setSettings(settings);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* General Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Geral</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="notifications"
              title="Notificações Push"
              description="Receber notificações no dispositivo"
              value={settings.push_enabled}
              onValueChange={(value) => updateSetting('push_enabled', value)}
            />
          </View>
        </View>

        {/* Content Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades do Mozão</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="musical-notes"
              iconColor="#E91E63"
              title="Novas Músicas"
              description="Quando seu mozão adicionar uma música nova"
              value={settings.music_notifications}
              onValueChange={(value) =>
                updateSetting('music_notifications', value)
              }
              disabled={!settings.push_enabled}
            />

            <SettingItem
              icon="images"
              iconColor="#9C27B0"
              title="Novas Fotos"
              description="Quando seu mozão adicionar uma foto nova"
              value={settings.photo_notifications}
              onValueChange={(value) =>
                updateSetting('photo_notifications', value)
              }
              disabled={!settings.push_enabled}
            />

            <SettingItem
              icon="heart"
              iconColor="#F44336"
              title="Novas Razões"
              description="Quando seu mozão escrever uma razão nova"
              value={settings.reason_notifications}
              onValueChange={(value) =>
                updateSetting('reason_notifications', value)
              }
              disabled={!settings.push_enabled}
            />
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes</Text>
          <View style={styles.settingsList}>
            <SettingItem
              icon="time"
              iconColor="#FF9800"
              title="Lembrete Diário"
              description="Um lembrete para interagir com seu mozão"
              value={settings.daily_reminder}
              onValueChange={(value) => updateSetting('daily_reminder', value)}
              disabled={!settings.push_enabled}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            As notificações ajudam você a ficar por dentro de tudo que seu mozão
            compartilha no app. Você pode personalizar quais notificações deseja
            receber.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
