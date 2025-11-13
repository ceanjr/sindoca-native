import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumCover: string;
  duration_ms: number;
  preview_url?: string;
  uri: string;
  spotify_url: string;
}

interface SpotifySearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTrack: (track: Track) => Promise<void>;
}

export const SpotifySearchModal: React.FC<SpotifySearchModalProps> = ({
  visible,
  onClose,
  onAddTrack,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() === '') {
      setResults([]);
      setError(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchSpotify(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const searchSpotify = async (searchQuery: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;

      if (!apiUrl) {
        throw new Error(
          'Configure EXPO_PUBLIC_API_URL no arquivo .env com o endereço do seu backend (ex: http://192.168.1.100:3000)'
        );
      }

      const response = await fetch(
        `${apiUrl}/api/spotify/search?q=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.tracks || []);
    } catch (err: any) {
      console.error('Search error:', err);

      // Better error messages
      if (err.message.includes('Network request failed')) {
        setError('Erro de conexão. Verifique se o backend está rodando e acessível.');
      } else if (err.message.includes('EXPO_PUBLIC_API_URL')) {
        setError(err.message);
      } else {
        setError(err.message || 'Erro ao buscar músicas');
      }

      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = async (track: Track) => {
    setAddingTrackId(track.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onAddTrack(track);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Close modal after successful add
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Failed to add track:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setTimeout(() => {
        setAddingTrackId(null);
      }, 500);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <View style={styles.trackItem}>
      <View style={styles.albumArtContainer}>
        {item.albumCover ? (
          <Image
            source={{ uri: item.albumCover }}
            style={styles.albumArt}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
            <Ionicons name="musical-note" size={24} color={Colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist} • {formatDuration(item.duration_ms)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          addingTrackId === item.id && styles.addButtonDisabled,
        ]}
        onPress={() => handleAddTrack(item)}
        disabled={addingTrackId === item.id}
        activeOpacity={0.7}
      >
        {addingTrackId === item.id ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Ionicons name="add" size={20} color={Colors.white} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Adicionar Música</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar música, artista ou álbum..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Buscando músicas...</Text>
          </View>
        )}

        {/* Results */}
        {!isSearching && results.length > 0 && (
          <FlatList
            data={results}
            renderItem={renderTrack}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Empty States */}
        {!isSearching && query && results.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Nenhuma música encontrada</Text>
            <Text style={styles.emptySubtext}>Tente outra busca</Text>
          </View>
        )}

        {!query && !isSearching && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Busque por músicas</Text>
            <Text style={styles.emptySubtext}>Artistas, álbuns ou títulos</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.error}15`,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  resultsList: {
    padding: 16,
    gap: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  albumArtContainer: {
    flexShrink: 0,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  albumArtPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 4,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
