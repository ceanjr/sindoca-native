import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';

interface QueuedUpload {
  id: string;
  type: 'photo' | 'audio' | 'message';
  data: any;
  timestamp: number;
  retries: number;
}

const UPLOAD_QUEUE_KEY = '@upload_queue';
const MAX_RETRIES = 3;

export function useUploadQueue() {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [processing, setProcessing] = useState(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (!isOffline && queue.length > 0 && !processing) {
      processQueue();
    }
  }, [isOffline, queue]);

  const loadQueue = async () => {
    try {
      const data = await AsyncStorage.getItem(UPLOAD_QUEUE_KEY);
      if (data) {
        setQueue(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading upload queue:', error);
    }
  };

  const saveQueue = async (newQueue: QueuedUpload[]) => {
    try {
      await AsyncStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (error) {
      console.error('Error saving upload queue:', error);
    }
  };

  const addToQueue = async (type: QueuedUpload['type'], data: any) => {
    const item: QueuedUpload = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    
    const newQueue = [...queue, item];
    await saveQueue(newQueue);
    
    // Try to process immediately if online
    if (!isOffline) {
      processQueue();
    }
    
    return item.id;
  };

  const processQueue = async () => {
    if (processing || isOffline) return;
    
    setProcessing(true);
    
    try {
      const itemsToProcess = [...queue];
      
      for (const item of itemsToProcess) {
        try {
          // Process based on type
          switch (item.type) {
            case 'photo':
              // await uploadPhoto(item.data);
              break;
            case 'audio':
              // await uploadAudio(item.data);
              break;
            case 'message':
              // await sendMessage(item.data);
              break;
          }
          
          // Remove from queue on success
          const newQueue = queue.filter(q => q.id !== item.id);
          await saveQueue(newQueue);
          
        } catch (error) {
          console.error(`Error processing ${item.type}:`, error);
          
          // Increment retries
          const updatedQueue = queue.map(q => 
            q.id === item.id 
              ? { ...q, retries: q.retries + 1 }
              : q
          );
          
          // Remove if max retries reached
          const filteredQueue = updatedQueue.filter(q => q.retries < MAX_RETRIES);
          await saveQueue(filteredQueue);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const clearQueue = async () => {
    await saveQueue([]);
  };

  return {
    queue,
    queueSize: queue.length,
    addToQueue,
    processQueue,
    clearQueue,
    processing,
  };
}
