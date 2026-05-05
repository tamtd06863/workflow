import { Stack } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function RequestLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="new" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Chi tiết yêu cầu' }} />
      <Stack.Screen name="[id]/chat" options={{ title: 'Chat hỗ trợ' }} />
    </Stack>
  );
}
