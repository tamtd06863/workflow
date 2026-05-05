import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useRequest } from '../../hooks/useRequest';
import { api } from '../../lib/api';
import { COLORS } from '../../constants/config';

export default function RatingScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { request } = useRequest(requestId ?? null);

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (score === 0) {
      Alert.alert('Thiếu đánh giá', 'Vui lòng chọn số sao trước khi gửi');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/requests/${requestId}/rate`, { score, comment: comment.trim() || undefined });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSubmitting(false);
    }
  }, [requestId, score, comment]);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.checkmark}>✅</Text>
        <Text style={styles.title}>Yêu cầu hoàn thành!</Text>
        <Text style={styles.subtitle}>
          Hãy đánh giá kỹ thuật viên để giúp chúng tôi cải thiện chất lượng dịch vụ
        </Text>
      </View>

      {/* Staff info */}
      {request?.staff && (
        <View style={styles.staffCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {request.staff.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.staffName}>{request.staff.full_name}</Text>
            <Text style={styles.staffLabel}>Kỹ thuật viên</Text>
          </View>
        </View>
      )}

      {/* Star rating */}
      <View style={styles.starsSection}>
        <Text style={styles.starsLabel}>Bạn đánh giá dịch vụ thế nào?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setScore(s)} activeOpacity={0.7}>
              <Text style={[styles.star, s <= score && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        {score > 0 && (
          <Text style={styles.scoreLabel}>
            {score === 1 ? 'Rất tệ' : score === 2 ? 'Tệ' : score === 3 ? 'Bình thường' : score === 4 ? 'Tốt' : 'Xuất sắc'}
          </Text>
        )}
      </View>

      {/* Comment */}
      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Nhận xét (không bắt buộc)</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.commentCount}>{comment.length}/500</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitBtn, (score === 0 || submitting) && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={score === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, gap: 24, paddingBottom: 48 },
  header: { alignItems: 'center', gap: 10, paddingTop: 20 },
  checkmark: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  staffCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  staffName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  staffLabel: { fontSize: 12, color: COLORS.textSecondary },
  starsSection: { alignItems: 'center', gap: 12 },
  starsLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 44, color: COLORS.border },
  starActive: { color: COLORS.rating },
  scoreLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  commentSection: { gap: 8 },
  commentLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  commentInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
  },
  commentCount: { fontSize: 11, color: COLORS.textSecondary, alignSelf: 'flex-end' },
  actions: { gap: 12 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { fontSize: 14, color: COLORS.textSecondary },
});
