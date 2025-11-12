import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedAction {
  id: string;
  type: 'upload_photo' | 'send_message' | 'upload_audio';
  data: any;
  timestamp: number;
}

const QUEUE_KEY = '@sindoca_offline_queue';

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedAction[]>([]);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online ?? false);

      // When coming back online, process queue
      if (online) {
        processQueue();
      }
    });

    // Load queue from storage
    loadQueue();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadQueue = async () => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueJson) {
        const loadedQueue = JSON.parse(queueJson);
        setQueue(loadedQueue);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  const saveQueue = async (newQueue: QueuedAction[]) => {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  };

  const addToQueue = async (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const newQueue = [...queue, newAction];
    await saveQueue(newQueue);
    
    console.log('Action queued for later:', newAction.type);
    return newAction.id;
  };

  const removeFromQueue = async (actionId: string) => {
    const newQueue = queue.filter((action) => action.id !== actionId);
    await saveQueue(newQueue);
  };

  const processQueue = async () => {
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued actions...`);

    for (const action of queue) {
      try {
        // Process based on type
        switch (action.type) {
          case 'upload_photo':
            await processPhotoUpload(action.data);
            break;
          case 'send_message':
            await processSendMessage(action.data);
            break;
          case 'upload_audio':
            await processAudioUpload(action.data);
            break;
        }

        // Remove from queue if successful
        await removeFromQueue(action.id);
        console.log('Action processed successfully:', action.type);
      } catch (error) {
        console.error('Failed to process action:', action.type, error);
        // Keep in queue for retry
      }
    }
  };

  const processPhotoUpload = async (data: any) => {
    // Implement actual photo upload logic here
    // This would call your Supabase upload function
    console.log('Processing photo upload:', data);
  };

  const processSendMessage = async (data: any) => {
    // Implement actual message send logic here
    console.log('Processing message send:', data);
  };

  const processAudioUpload = async (data: any) => {
    // Implement actual audio upload logic here
    console.log('Processing audio upload:', data);
  };

  return {
    isOnline,
    queue,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueLength: queue.length,
  };
}
