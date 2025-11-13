import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { CONTENT_PADDING_BOTTOM } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  badge,
  disabled,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, disabled && styles.menuItemDisabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons
          name={icon as any}
          size={24}
          color={disabled ? Colors.textTertiary : Colors.primary}
        />
      </View>
      <View style={styles.menuItemContent}>
        <Text
          style={[
            styles.menuItemTitle,
            disabled && styles.menuItemTitleDisabled,
          ]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        {disabled && <Text style={styles.disabledBadge}>Em breve</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {!disabled && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textTertiary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: CONTENT_PADDING_BOTTOM },
        ]}
      >
        <FadeInView>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
            <Text style={styles.userName}>{user?.email || 'Usuário'}</Text>
            <Text style={styles.userSubtitle}>Sindoca App</Text>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recursos</Text>
            <View style={styles.menuList}>
              <MenuItem
                icon="gift"
                title="Surpresas"
                subtitle="Algo especial"
                onPress={() => {}}
                disabled
              />
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configurações</Text>
            <View style={styles.menuList}>
              <MenuItem
                icon="person"
                title="Perfil"
                subtitle="Editar informações"
                onPress={() => {}}
                disabled
              />
              <MenuItem
                icon="notifications"
                title="Notificações"
                subtitle="Gerenciar notificações"
                onPress={() => {}}
                disabled
              />
              <MenuItem
                icon="settings"
                title="Configurações"
                subtitle="Preferências do app"
                onPress={() => {}}
                disabled
              />
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={300}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </FadeInView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sindoca v1.0.0</Text>
          <Text style={styles.footerSubtext}>Feito com ❤️ pelo mozão</Text>
        </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuItemTitleDisabled: {
    color: Colors.textSecondary,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  disabledBadge: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
