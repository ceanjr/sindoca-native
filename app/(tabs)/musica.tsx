import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { Button, Card, Input, Loading } from '@/components/ui';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import { useSpotify } from '@/hooks/useSpotify';
import * as Haptics from 'expo-haptics';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function MusicaScreen() {
  const { isAuthenticated, login, searchTracks, loading } = useSpotify();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await searchTracks(searchQuery);
      setTracks(results);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (searchQuery) {
      await handleSearch();
    }
    setRefreshing(false);
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={styles.trackItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Image
        source={{ uri: item.album.images[2]?.url || item.album.images[0]?.url }}
        style={styles.albumArt}
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artists.map(a => a.name).join(', ')}
        </Text>
        <Text style={styles.albumName} numberOfLines={1}>
          {item.album.name}
        </Text>
      </View>
      <Button
        title="+"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        size="small"
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <FadeInView style={styles.emptyContainer as any}>
      <Text style={styles.emptyIcon}>🎵</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Nenhuma música encontrada' : 'Busque músicas'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? 'Tente uma pesquisa diferente' 
          : 'Use a busca para encontrar suas músicas favoritas'}
      </Text>
    </FadeInView>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <FadeInView>
            <Text style={styles.title}>🎵 Música</Text>
            <Text style={styles.subtitle}>
              Playlist colaborativa
            </Text>
          </FadeInView>

          <FadeInView delay={100}>
            <Card>
              <Text style={styles.cardTitle}>Spotify não conectado</Text>
              <Text style={styles.cardText}>
                Conecte sua conta Spotify para buscar e adicionar músicas à playlist compartilhada.
              </Text>
              <Button
                title="Conectar Spotify"
                onPress={login}
              />
            </Card>
          </FadeInView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar músicas..."
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <Button
          title={searching ? '...' : '🔍'}
          onPress={handleSearch}
          disabled={!searchQuery.trim() || searching}
          loading={searching}
          size="small"
        />
      </View>

      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tracksList}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-end',
  },
  searchInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  tracksList: {
    padding: 16,
    flexGrow: 1,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    marginRight: 8,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  albumName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
