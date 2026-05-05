import { Stack } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function RatingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[requestId]" options={{ title: 'Đánh giá dịch vụ', headerBackVisible: false }} />
    </Stack>
  );
}
