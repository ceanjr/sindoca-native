import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (when app is opened from notification)
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleUrl(url);
      }
    };

    // Handle URL changes (when app is already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    handleInitialUrl();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = (url: string) => {
    console.log('Deep link received:', url);

    // Parse the URL
    const { path, queryParams } = Linking.parse(url);

    if (!path) return;

    // Handle different routes
    if (path === 'photo' && queryParams?.id) {
      router.push(`/(modals)/photo/${queryParams.id}`);
    } else if (path === 'message' && queryParams?.id) {
      // router.push('/(tabs)/mensagens');
      // Could navigate to specific message
    } else if (path === 'galeria') {
      router.push('/(tabs)/galeria');
    } else if (path === 'musica') {
      router.push('/(tabs)/musica');
    } else if (path === 'perfil') {
      // router.push('/(tabs)/perfil');
    } else {
      // Default to home
      router.push('/(tabs)/' as any);
    }
  };

  return { handleUrl };
}
