import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as Haptics from 'expo-haptics';

interface Reaction {
  id: string;
  target_type: 'photo' | 'message';
  target_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export function useReactions(targetType: 'photo' | 'message', targetId: string | null) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const fetchReactions = async () => {
      try {
        const { data, error } = await supabase
          .from('reactions')
          .select('*')
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReactions(data || []);
      } catch (err: any) {
        console.error('Error fetching reactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();

    // Subscribe to realtime changes
    channel = supabase
      .channel(`reactions:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `target_type=eq.${targetType},target_id=eq.${targetId}`,
        },
        (payload) => {
          console.log('Reaction change received:', payload);

          if (payload.eventType === 'INSERT') {
            setReactions((current) => [payload.new as Reaction, ...current]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (payload.eventType === 'DELETE') {
            setReactions((current) =>
              current.filter((reaction) => reaction.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [targetType, targetId]);

  const addReaction = async (emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !targetId) {
        throw new Error('User not authenticated or no target');
      }

      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        (r) => r.user_id === user.id && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove the reaction (toggle off)
        await removeReaction(existingReaction.id);
        return null;
      }

      // Add new reaction
      const { data, error } = await supabase
        .from('reactions')
        .insert([
          {
            target_type: targetType,
            target_id: targetId,
            user_id: user.id,
            emoji,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return data;
    } catch (err: any) {
      console.error('Error adding reaction:', err);
      throw err;
    }
  };

  const removeReaction = async (reactionId: string) => {
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      console.error('Error removing reaction:', err);
      throw err;
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return {
    reactions,
    groupedReactions,
    loading,
    error,
    addReaction,
    removeReaction,
  };
}
