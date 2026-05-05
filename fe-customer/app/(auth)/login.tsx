import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/config';

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      Alert.alert('Lỗi', 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🛠️</Text>
        <Text style={styles.title}>RescueNow</Text>
        <Text style={styles.subtitle}>Kỹ thuật viên đến tận nơi{'\n'}giải quyết sự cố của bạn</Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '📍', text: 'Tìm kỹ thuật viên gần nhất' },
          { icon: '⚡', text: 'Phản hồi trong vài phút' },
          { icon: '💬', text: 'Trao đổi trực tiếp' },
          { icon: '⭐', text: 'Đánh giá minh bạch' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{item.icon}</Text>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.disabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Tiếp tục với Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          Bằng cách tiếp tục, bạn đồng ý với{' '}
          <Text style={styles.link}>Điều khoản dịch vụ</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: 16,
    marginBottom: 48,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
    width: 36,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  bottom: {
    marginTop: 'auto',
    gap: 16,
  },
  googleBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
