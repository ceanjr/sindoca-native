import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="photo/[id]"
        options={{
          title: 'Foto',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="voice-recorder"
        options={{
          title: 'Gravar Áudio',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="story-viewer"
        options={{
          title: 'Stories',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
