import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!;
const STORAGE_KEY = '@sindoca_spotify_token';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri: string;
}

export function useSpotify() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  };

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'sindoca',
    path: 'spotify-callback',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: [
        'user-read-email',
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
      ],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      saveToken(access_token);
      setAccessToken(access_token);
    }
  }, [response]);

  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEY);
      if (token) {
        setAccessToken(token);
      }
    } catch (error) {
      console.error('Failed to load Spotify token:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async (token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, token);
    } catch (error) {
      console.error('Failed to save Spotify token:', error);
    }
  };

  const login = async () => {
    await promptAsync();
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
  };

  const searchTracks = async (query: string): Promise<SpotifyTrack[]> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search tracks');
    }

    const data = await response.json();
    return data.tracks.items;
  };

  const getMyPlaylists = async () => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get playlists');
    }

    const data = await response.json();
    return data.items;
  };

  const addTrackToPlaylist = async (playlistId: string, trackUri: string) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add track to playlist');
    }

    return response.json();
  };

  return {
    accessToken,
    loading,
    isAuthenticated: !!accessToken,
    login,
    logout,
    searchTracks,
    getMyPlaylists,
    addTrackToPlaylist,
  };
}
