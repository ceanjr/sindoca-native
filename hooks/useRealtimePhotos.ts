import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Photo {
  id: string;
  workspace_id: string;
  user_id: string;
  file_path: string;
  caption?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useRealtimePhotos(workspaceId: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotos(data || []);
      } catch (err: any) {
        console.error('Error fetching photos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();

    // Subscribe to realtime changes
    channel = supabase
      .channel(`photos:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('Photo change received:', payload);

          if (payload.eventType === 'INSERT') {
            setPhotos((current) => [payload.new as Photo, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setPhotos((current) =>
              current.map((photo) =>
                photo.id === payload.new.id ? (payload.new as Photo) : photo
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setPhotos((current) =>
              current.filter((photo) => photo.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [workspaceId]);

  const addPhoto = async (photoData: Partial<Photo>) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert([photoData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error adding photo:', err);
      throw err;
    }
  };

  const updatePhoto = async (photoId: string, updates: Partial<Photo>) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', photoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error updating photo:', err);
      throw err;
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      throw err;
    }
  };

  return {
    photos,
    loading,
    error,
    addPhoto,
    updatePhoto,
    deletePhoto,
  };
}
