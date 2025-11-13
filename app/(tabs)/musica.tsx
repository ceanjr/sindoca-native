import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { CONTENT_PADDING_BOTTOM } from '@/constants/layout';
import { FadeInView, MarqueeText } from '@/components/animations';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { SpotifySearchModal } from '@/components/SpotifySearchModal';

interface Track {
  id: string;
  name: string;
  artists: string;
  album: string;
  album_art: string;
  added_by: string;
  added_by_name: string;
  created_at: string;
  is_favorite: boolean;
  spotify_id: string;
  spotify_url?: string;
  preview_url?: string;
  duration_ms?: number;
}

const TRACKS_PER_PAGE = 15;

export default function MusicaScreen() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(TRACKS_PER_PAGE);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTracks();
      checkSpotifyConnection();
      subscribeToTracks();
    }
  }, [user]);

  const subscribeToTracks = () => {
    if (!workspaceId) return;

    const channel = supabase
      .channel('tracks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadTracks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkSpotifyConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('spotify_tokens')
        .eq('id', user!.id)
        .single();

      if (!error && data?.spotify_tokens) {
        setSpotifyConnected(true);
      }
    } catch (error) {
      console.log('Error checking Spotify:', error);
    }
  };

  const loadTracks = async () => {
    try {
      console.log('[Musica] Loading tracks for user:', user?.id);
      
      const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id, user_id')
        .eq('user_id', user!.id)
        .single();

      console.log('[Musica] Workspace members:', members);

      if (!members) {
        console.log('[Musica] No workspace found');
        setLoading(false);
        return;
      }
      setWorkspaceId(members.workspace_id);

      // Get partner info
      const { data: allMembers } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', members.workspace_id);

      const partner = allMembers?.find((m) => m.user_id !== user!.id);
      if (partner) {
        setPartnerId(partner.user_id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, nickname')
          .eq('id', partner.user_id)
          .single();

        if (profile) {
          setPartnerName(profile.nickname || profile.full_name || 'Parceiro');
        }
      }

      // Load tracks with author information
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          title,
          description,
          reactions!content_id (
            user_id,
            type
          ),
          profiles!content_author_id_fkey (
            full_name,
            nickname
          )
        `)
        .eq('workspace_id', members.workspace_id)
        .eq('type', 'music')
        .order('created_at', { ascending: false });

      console.log('[Musica] Tracks query result:', { count: data?.length, error });

      if (!error && data) {
        const formattedTracks: Track[] = data.map((item) => {
          // Check if current user has favorited this track
          const isFavorite = item.reactions?.some(
            (reaction: any) =>
              reaction.type === 'favorite' &&
              reaction.user_id === user!.id
          ) || false;

          // Get author name from profiles
          const authorProfile = item.profiles as any;
          const authorName = authorProfile?.nickname || authorProfile?.full_name || 'Desconhecido';

          return {
            id: item.id,
            name: item.title || item.data?.name || '',
            artists: item.description || item.data?.artist || item.data?.artists || '',
            album: item.data?.album || '',
            album_art: item.data?.album_cover || item.data?.album_art || '',
            added_by: item.author_id,
            added_by_name: authorName,
            created_at: item.created_at,
            is_favorite: isFavorite,
            spotify_id: item.data?.spotify_track_id || item.data?.spotify_id || '',
            spotify_url: item.data?.spotify_url,
            preview_url: item.data?.preview_url,
            duration_ms: item.data?.duration_ms,
          };
        });
        console.log('[Musica] Formatted tracks:', formattedTracks.length);
        setTracks(formattedTracks);

        // Check turn
        if (data.length > 0) {
          const lastTrack = data[0];
          setIsMyTurn(lastTrack.author_id !== user!.id);
        }
      }
    } catch (error) {
      console.error('[Musica] Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const allFilteredTracks = useMemo(() => {
    return showOnlyFavorites ? tracks.filter((t) => t.is_favorite) : tracks;
  }, [tracks, showOnlyFavorites]);

  const filteredTracks = useMemo(() => {
    return allFilteredTracks.slice(0, displayedCount);
  }, [allFilteredTracks, displayedCount]);

  const hasMore = allFilteredTracks.length > displayedCount;
  const favoritesCount = tracks.filter((t) => t.is_favorite).length;

  const toggleFavorite = async (trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    try {
      if (track.is_favorite) {
        // Remove favorite from reactions table
        await supabase
          .from('reactions')
          .delete()
          .eq('content_id', trackId)
          .eq('user_id', user!.id)
          .eq('type', 'favorite');
      } else {
        // Add favorite to reactions table
        await supabase
          .from('reactions')
          .insert({
            content_id: trackId,
            user_id: user!.id,
            type: 'favorite',
          });
      }

      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, is_favorite: !t.is_favorite } : t
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddTrack = async (track: any) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'Configure EXPO_PUBLIC_API_URL no arquivo .env com o endereço do seu backend'
        );
      }

      // Get auth session for authenticated API calls
      const { data: { session } } = await supabase.auth.getSession();

      const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Add auth token if available
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${apiUrl}/api/spotify/playlist/add-track`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          track: {
            id: track.id,
            name: track.name,
            artist: track.artist,
            album: track.album,
            albumCover: track.albumCover,
            uri: track.uri,
            spotify_url: track.spotify_url,
            preview_url: track.preview_url,
            duration_ms: track.duration_ms,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      Alert.alert('Sucesso', 'Música adicionada à playlist!');
      loadTracks();
    } catch (error: any) {
      console.error('Error adding track:', error);

      let errorMessage = 'Não foi possível adicionar a música';

      if (error.message.includes('Network request failed')) {
        errorMessage = 'Erro de conexão. Verifique se o backend está rodando e acessível.';
      } else if (error.message.includes('EXPO_PUBLIC_API_URL')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erro', errorMessage);
      throw error;
    }
  };

  const deleteTrack = async (trackId: string, authorId: string) => {
    if (authorId !== user!.id) {
      Alert.alert('Erro', 'Você só pode deletar músicas que adicionou');
      return;
    }

    Alert.alert(
      'Remover música',
      'Tem certeza que deseja remover esta música?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('content').delete().eq('id', trackId);
              loadTracks();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover a música');
            }
          },
        },
      ]
    );
  };

  const openSpotify = async (track: Track) => {
    const url =
      track.spotify_url ||
      `https://open.spotify.com/track/${track.spotify_id}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o Spotify');
    }
  };

  const connectSpotify = async () => {
    Alert.alert(
      'Conectar Spotify',
      'Para adicionar músicas, você precisa conectar sua conta Spotify no site.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir Site',
          onPress: async () => {
            const url = `${process.env.EXPO_PUBLIC_WEB_URL || 'https://sindoca.vercel.app'}/musica`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
            }
          },
        },
      ]
    );
  };

  const loadMore = () => {
    setDisplayedCount((prev) => prev + TRACKS_PER_PAGE);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <FadeInView>
          <View style={styles.headerContent}>
            <Ionicons name="musical-notes" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Música</Text>
              <Text style={styles.subtitle}>
                {allFilteredTracks.length}{' '}
                {allFilteredTracks.length === 1 ? 'música' : 'músicas'}
              </Text>
            </View>
          </View>
        </FadeInView>

        {spotifyConnected ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setSearchModalOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={connectSpotify}
            activeOpacity={0.7}
          >
            <Ionicons name="musical-notes" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterButtonsRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !showOnlyFavorites && styles.filterButtonActive,
            ]}
            onPress={() => {
              setShowOnlyFavorites(false);
              setDisplayedCount(TRACKS_PER_PAGE);
            }}
          >
            <Text
              style={[
                styles.filterText,
                !showOnlyFavorites && styles.filterTextActive,
              ]}
            >
              Todas ({tracks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showOnlyFavorites && styles.filterButtonActive,
            ]}
            onPress={() => {
              setShowOnlyFavorites(true);
              setDisplayedCount(TRACKS_PER_PAGE);
            }}
          >
            <Ionicons
              name="heart"
              size={16}
              color={showOnlyFavorites ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                showOnlyFavorites && styles.filterTextActive,
              ]}
            >
              Favoritas ({favoritesCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: CONTENT_PADDING_BOTTOM },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando playlist...</Text>
          </View>
        ) : filteredTracks.length === 0 ? (
          <FadeInView>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="musical-notes"
                  size={64}
                  color={Colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {showOnlyFavorites ? 'Nenhuma música favorita' : 'Playlist vazia'}
              </Text>
              <Text style={styles.emptyText}>
                {showOnlyFavorites
                  ? 'Favorite suas músicas especiais'
                  : 'Adicione suas primeiras músicas especiais'}
              </Text>
              {!spotifyConnected && (
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={20} color={Colors.secondary} />
                  <Text style={styles.infoText}>
                    Conecte sua conta Spotify no site para adicionar músicas à playlist!
                  </Text>
                </View>
              )}
            </View>
          </FadeInView>
        ) : (
          <>
            {/* Turn Indicator */}
            {tracks.length > 0 && (
              <View style={styles.turnIndicator}>
                <Ionicons
                  name={isMyTurn ? 'checkmark-circle' : 'time'}
                  size={20}
                  color={isMyTurn ? Colors.success : Colors.warning}
                />
                <Text style={styles.turnText}>
                  {isMyTurn
                    ? 'É sua vez de adicionar uma música!'
                    : `Aguarde ${partnerName} adicionar uma música`}
                </Text>
              </View>
            )}

            {/* Tracks List */}
            {filteredTracks.map((track, index) => (
              <FadeInView key={track.id} delay={index * 50}>
                <View style={{ overflow: 'visible' }}>
                  <TouchableOpacity
                    style={styles.trackCard}
                    onPress={() => openSpotify(track)}
                    activeOpacity={0.7}
                  >
                    {/* Album Art */}
                    {track.album_art && track.album_art.trim() !== '' ? (
                      <Image
                        source={{ uri: track.album_art }}
                        style={styles.albumArt}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                        <Ionicons
                          name="musical-note"
                          size={24}
                          color={Colors.textTertiary}
                        />
                      </View>
                    )}

                    {/* Track Info */}
                    <View style={styles.trackInfo}>
                      <MarqueeText text={track.name} speed={15} style={styles.trackName} />
                      <MarqueeText text={track.artists} speed={15} style={styles.trackArtist} />
                      <View style={styles.trackMeta}>
                        <Text style={styles.trackAlbum} numberOfLines={1}>
                          {track.album}
                        </Text>
                        {track.duration_ms && (
                          <Text style={styles.trackDuration}>
                            {formatDuration(track.duration_ms)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.trackAuthor}>
                        Adicionado por {track.added_by_name}
                      </Text>
                      <Text style={styles.trackDate}>{formatDate(track.created_at)}</Text>
                    </View>

                    {/* Actions - Menu Button */}
                    <View style={styles.trackActions}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === track.id ? null : track.id);
                        }}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Dropdown Menu */}
                  {openMenuId === track.id && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track.id);
                          setOpenMenuId(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={track.is_favorite ? 'heart' : 'heart-outline'}
                          size={20}
                          color={track.is_favorite ? Colors.primary : Colors.textSecondary}
                        />
                        <Text style={styles.menuItemText}>
                          {track.is_favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        </Text>
                      </TouchableOpacity>

                      {track.added_by === user!.id && (
                        <TouchableOpacity
                          style={[styles.menuItem, styles.menuItemDanger]}
                          onPress={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            deleteTrack(track.id, track.added_by);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={20} color={Colors.error} />
                          <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                            Remover música
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </FadeInView>
            ))}

            {/* Load More */}
            {hasMore && (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
                <Text style={styles.loadMoreText}>
                  Carregar mais ({allFilteredTracks.length - displayedCount}{' '}
                  restantes)
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Menu Overlay - close menu when clicking outside */}
      {openMenuId && (
        <Pressable
          style={styles.screenOverlay}
          onPress={() => setOpenMenuId(null)}
        />
      )}

      {/* Spotify Search Modal */}
      <SpotifySearchModal
        visible={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAddTrack={handleAddTrack}
      />
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
  connectButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  addMusicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  addMusicButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  content: {
    padding: 16,
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
    alignItems: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: `${Colors.secondary}15`,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: `${Colors.secondary}30`,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  turnText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  trackCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  albumArt: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  albumArtPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackAlbum: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
  },
  trackDuration: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  trackAuthor: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trackDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
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
  screenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  menuItemText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundGradient,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
