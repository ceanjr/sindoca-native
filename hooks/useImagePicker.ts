import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

export function useImagePicker() {
  const pickFromCamera = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'Precisamos de acesso à câmera para tirar fotos'
      );
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return await compressImage(result.assets[0].uri);
    }

    return null;
  };

  const pickFromGallery = async (multiple = false) => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'Precisamos de acesso à galeria para selecionar fotos'
      );
      return null;
    }

    // Launch gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 10 : 1,
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (multiple) {
        return await Promise.all(
          result.assets.map((asset) => compressImage(asset.uri))
        );
      } else {
        return await compressImage(result.assets[0].uri);
      }
    }

    return null;
  };

  return { pickFromCamera, pickFromGallery };
}

async function compressImage(uri: string) {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }], // Max width keeping aspect ratio
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
}
