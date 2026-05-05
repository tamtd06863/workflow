import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/config';

export default function RequestSuccessScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 6,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', gap: 8 }}>
          <Text style={styles.title}>Yêu cầu đã được gửi!</Text>
          <Text style={styles.subtitle}>
            Doanh nghiệp sẽ sớm liên hệ và cử kỹ thuật viên đến gặp bạn.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📋</Text>
              <Text style={styles.infoText}>Yêu cầu đã được ghi nhận</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔔</Text>
              <Text style={styles.infoText}>Bạn sẽ nhận thông báo khi kỹ thuật viên xác nhận</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💬</Text>
              <Text style={styles.infoText}>Bạn có thể chat trực tiếp với doanh nghiệp</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.replace(`/request/${id}`)}
        >
          <Text style={styles.trackBtnText}>Theo dõi yêu cầu →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.homeBtnText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 28 },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  checkIcon: { fontSize: 48, color: '#fff', fontWeight: '900', lineHeight: 56 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 18, width: 24 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  footer: {
    padding: 24,
    paddingBottom: 44,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  trackBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
  },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  homeBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 50,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  homeBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
});
