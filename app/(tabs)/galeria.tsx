import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Colors } from '@/constants/Colors';
import { CONTENT_PADDING_BOTTOM } from '@/constants/layout';
import { FadeInView } from '@/components/animations';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');
const numColumns = 2;
const imageSize = (width - 48) / numColumns;

interface Photo {
  id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  created_at: string;
  author_id: string;
  is_favorite?: boolean;
  reactions?: any[];
}

interface Reaction {
  emoji: string;
  user_id: string;
}

export default function GaleriaScreen() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [newCaption, setNewCaption] = useState('');

  useEffect(() => {
    if (user) {
      loadPhotos();
      subscribeToPhotos();
    }
  }, [user]);

  const subscribeToPhotos = () => {
    if (!workspaceId) return;

    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadPhotos = async () => {
    try {
      console.log('[Galeria] Loading photos for user:', user?.id);
      
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user!.id)
        .single();

      console.log('[Galeria] Workspace query result:', { members, error: membersError });

      if (membersError || !members) {
        console.log('[Galeria] No workspace found for user');
        setLoading(false);
        return;
      }
      setWorkspaceId(members.workspace_id);

      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          storage_path,
          description,
          reactions!content_id (
            user_id,
            type
          )
        `)
        .eq('workspace_id', members.workspace_id)
        .eq('type', 'photo')
        .order('created_at', { ascending: false });

      console.log('[Galeria] Photos query result:', { count: data?.length, error });

      if (!error && data) {
        const formattedPhotos: Photo[] = data.map((item) => {
          // Generate URL from storage_path if not in data
          let photoUrl = item.data?.url || '';
          if (!photoUrl && item.storage_path) {
            const cleanPath = item.storage_path.replace(/^gallery\//, '');
            const { data: urlData } = supabase.storage
              .from('gallery')
              .getPublicUrl(cleanPath);
            photoUrl = urlData?.publicUrl || '';
          }

          // Check if current user has favorited this photo
          const isFavorite = item.reactions?.some(
            (reaction: any) =>
              reaction.type === 'favorite' &&
              reaction.user_id === user!.id
          ) || false;

          return {
            id: item.id,
            url: photoUrl,
            thumbnail_url: item.data?.thumbnail_url || photoUrl,
            caption: item.description || item.data?.caption || '',
            created_at: item.created_at,
            author_id: item.author_id,
            is_favorite: isFavorite,
            reactions: item.reactions || [],
          };
        });
        console.log('[Galeria] Formatted photos:', formattedPhotos.length);
        setPhotos(formattedPhotos);
      }
    } catch (error) {
      console.error('[Galeria] Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    if (filter === 'favorites') {
      return photos.filter((p) => p.is_favorite);
    }
    return photos;
  }, [photos, filter]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de permissão para acessar suas fotos!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      uploadPhotos(result.assets);
    }
  };

  const uploadPhotos = async (assets: any[]) => {
    if (!workspaceId) return;

    setUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      for (const asset of assets) {
        // Compress image
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1920 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Read file as base64
        const response = await fetch(manipResult.uri);
        const blob = await response.blob();
        const reader = new FileReader();

        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const base64data = await base64Promise;

        // Generate unique filename
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${workspaceId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, decode(base64data), {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL (for backward compatibility, but we'll use storage_path)
        const {
          data: { publicUrl },
        } = supabase.storage.from('gallery').getPublicUrl(filePath);

        // Save to database using web structure
        await supabase.from('content').insert({
          workspace_id: workspaceId,
          author_id: user!.id,
          type: 'photo',
          category: 'momentos',
          title: fileName.replace(/\.[^/.]+$/, ''),
          description: '',
          storage_path: filePath,
          data: {
            size: blob.size,
            mime_type: 'image/jpeg',
            compressed: true,
            original_name: fileName,
          },
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', `${assets.length} foto(s) enviada(s)!`);
      loadPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      Alert.alert('Erro', 'Erro ao fazer upload das fotos');
    } finally {
      setUploading(false);
    }
  };

  const decode = (base64: string) => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') bufferLength--;
    }
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = chars.indexOf(base64[i]);
      const encoded2 = chars.indexOf(base64[i + 1]);
      const encoded3 = chars.indexOf(base64[i + 2]);
      const encoded4 = chars.indexOf(base64[i + 3]);
      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes;
  };

  const toggleFavorite = async (photoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    try {
      if (photo.is_favorite) {
        // Remove favorite from reactions table
        await supabase
          .from('reactions')
          .delete()
          .eq('content_id', photoId)
          .eq('user_id', user!.id)
          .eq('type', 'favorite');
      } else {
        // Add favorite to reactions table
        await supabase
          .from('reactions')
          .insert({
            content_id: photoId,
            user_id: user!.id,
            type: 'favorite',
          });
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, is_favorite: !p.is_favorite } : p
        )
      );

      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto({ ...photo, is_favorite: !photo.is_favorite });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deletePhoto = async (photoId: string) => {
    Alert.alert('Remover foto', 'Tem certeza que deseja remover esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('content').delete().eq('id', photoId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setLightboxVisible(false);
            loadPhotos();
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover a foto');
          }
        },
      },
    ]);
  };

  const deleteSelectedPhotos = async () => {
    Alert.alert(
      'Remover fotos',
      `Tem certeza que deseja remover ${selectedPhotos.length} foto(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const photoId of selectedPhotos) {
                await supabase.from('content').delete().eq('id', photoId);
              }
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              setDeleteMode(false);
              setSelectedPhotos([]);
              loadPhotos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover as fotos');
            }
          },
        },
      ]
    );
  };

  const updateCaption = async () => {
    if (!selectedPhoto) return;

    try {
      await supabase
        .from('content')
        .update({
          description: newCaption,
        })
        .eq('id', selectedPhoto.id);

      setCaptionModalVisible(false);
      setNewCaption('');
      loadPhotos();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a legenda');
    }
  };

  const openPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setLightboxVisible(true);
  };

  const navigatePhoto = (direction: number) => {
    const currentIndex = filteredPhotos.findIndex(
      (p) => p.id === selectedPhoto?.id
    );
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < filteredPhotos.length) {
      setSelectedPhoto(filteredPhotos[newIndex]);
    } else if (newIndex < 0) {
      setSelectedPhoto(filteredPhotos[filteredPhotos.length - 1]);
    } else {
      setSelectedPhoto(filteredPhotos[0]);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const renderPhoto = ({ item }: { item: Photo }) => {
    const imageUri = item.thumbnail_url || item.url;

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        activeOpacity={0.9}
        onPress={() => {
          if (deleteMode) {
            togglePhotoSelection(item.id);
          } else {
            openPhoto(item);
          }
        }}
        onLongPress={() => {
          if (!deleteMode) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setDeleteMode(true);
            setSelectedPhotos([item.id]);
          }
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="image-outline" size={48} color={Colors.textTertiary} />
          </View>
        )}
        {item.is_favorite && !deleteMode && (
          <View style={styles.favoriteIconBadge}>
            <Ionicons name="heart" size={16} color={Colors.white} />
          </View>
        )}
        {deleteMode && (
          <View style={styles.selectionOverlay}>
            <View
              style={[
                styles.selectionCheckbox,
                selectedPhotos.includes(item.id) &&
                  styles.selectionCheckboxSelected,
              ]}
            >
              {selectedPhotos.includes(item.id) && (
                <Ionicons name="checkmark" size={20} color={Colors.white} />
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <FadeInView>
          <View style={styles.headerContent}>
            <Ionicons name="images" size={32} color={Colors.primary} />
            <View style={styles.headerText}>
              <Text style={styles.title}>Galeria</Text>
              <Text style={styles.subtitle}>
                {filteredPhotos.length} foto(s)
              </Text>
            </View>
          </View>
        </FadeInView>

        {!deleteMode && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="add" size={24} color={Colors.white} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {!deleteMode && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'favorites' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('favorites')}
          >
            <Ionicons
              name="heart"
              size={16}
              color={filter === 'favorites' ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                filter === 'favorites' && styles.filterTextActive,
              ]}
            >
              Favoritas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Photos Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando fotos...</Text>
        </View>
      ) : filteredPhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {filter === 'favorites' ? 'Nenhuma foto favorita' : 'Nenhuma foto ainda'}
          </Text>
          <Text style={styles.emptySubtext}>
            Adicione suas primeiras memórias juntos
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPhotos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: deleteMode ? 100 : CONTENT_PADDING_BOTTOM },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Delete Mode Action Bar */}
      {deleteMode && (
        <View style={styles.deleteActionBar}>
          <TouchableOpacity
            style={styles.deleteActionButton}
            onPress={() => {
              setDeleteMode(false);
              setSelectedPhotos([]);
            }}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
            <Text style={styles.deleteActionText}>Cancelar</Text>
          </TouchableOpacity>

          <Text style={styles.deleteActionCount}>
            {selectedPhotos.length} selecionada(s)
          </Text>

          <TouchableOpacity
            style={[
              styles.deleteActionButton,
              selectedPhotos.length === 0 && styles.deleteActionButtonDisabled,
            ]}
            onPress={deleteSelectedPhotos}
            disabled={selectedPhotos.length === 0}
          >
            <Ionicons
              name="trash"
              size={24}
              color={selectedPhotos.length > 0 ? Colors.error : Colors.textTertiary}
            />
            <Text
              style={[
                styles.deleteActionText,
                { color: selectedPhotos.length > 0 ? Colors.error : Colors.textTertiary },
              ]}
            >
              Apagar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={styles.lightboxContainer}>
          {/* Header */}
          <View style={styles.lightboxHeader}>
            <TouchableOpacity
              onPress={() => setLightboxVisible(false)}
              style={styles.lightboxHeaderButton}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.lightboxHeaderActions}>
              <TouchableOpacity
                onPress={() => selectedPhoto && toggleFavorite(selectedPhoto.id)}
                style={styles.lightboxHeaderButton}
              >
                <Ionicons
                  name={selectedPhoto?.is_favorite ? 'heart' : 'heart-outline'}
                  size={28}
                  color={Colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectedPhoto && deletePhoto(selectedPhoto.id)}
                style={styles.lightboxHeaderButton}
              >
                <Ionicons name="trash-outline" size={26} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          <View style={styles.lightboxImageContainer}>
            <Image
              source={{ uri: selectedPhoto?.url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />

            {/* Navigation Buttons */}
            <TouchableOpacity
              style={[styles.lightboxNavButton, styles.lightboxNavButtonLeft]}
              onPress={() => navigatePhoto(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={32} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.lightboxNavButton, styles.lightboxNavButtonRight]}
              onPress={() => navigatePhoto(1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={32} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View style={styles.lightboxFooter}>
            {selectedPhoto?.caption ? (
              <TouchableOpacity
                onPress={() => {
                  setNewCaption(selectedPhoto.caption || '');
                  setCaptionModalVisible(true);
                }}
              >
                <Text style={styles.captionText}>{selectedPhoto.caption}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setNewCaption('');
                  setCaptionModalVisible(true);
                }}
                style={styles.addCaptionButton}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.addCaptionText}>Adicionar legenda</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Caption Modal */}
      <Modal
        visible={captionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCaptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Legenda da foto</Text>
              <TouchableOpacity onPress={() => setCaptionModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Adicione uma legenda..."
              placeholderTextColor={Colors.textTertiary}
              value={newCaption}
              onChangeText={setNewCaption}
              multiline
              maxLength={200}
              autoFocus
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={updateCaption}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>Salvar</Text>
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
  grid: {
    padding: 16,
    gap: 12,
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  deleteActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteActionButtonDisabled: {
    opacity: 0.5,
  },
  deleteActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  deleteActionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  lightboxHeaderActions: {
    flexDirection: 'row',
    gap: 16,
  },
  lightboxHeaderButton: {
    padding: 8,
  },
  lightboxImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: width,
    height: height - 200,
  },
  lightboxNavButton: {
    position: 'absolute',
    top: '50%',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  lightboxNavButtonLeft: {
    left: 16,
  },
  lightboxNavButtonRight: {
    right: 16,
  },
  lightboxFooter: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  captionText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
  },
  addCaptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCaptionText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.7,
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
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
