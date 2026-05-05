import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useRequests } from '../../hooks/useRequest';
import { StatusBadge } from '../../components/StatusBadge';
import { COLORS, CATEGORY_ICONS } from '../../constants/config';

const ACTIVE_STATUSES = ['unavailable', 'available', 'negotiating', 'pending_assignment', 'assigned', 'in_progress'];

export default function HomeScreen() {
  const { user } = useAuth();
  const { requests, loading, refresh } = useRequests();
  const router = useRouter();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const activeRequest = requests.find((r) => ACTIVE_STATUSES.includes(r.status));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Xin chào, {user?.full_name?.split(' ').pop() ?? 'bạn'} 👋</Text>
        <Text style={styles.greetingSubtitle}>Bạn cần hỗ trợ gì hôm nay?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
      ) : activeRequest ? (
        <TouchableOpacity
          style={styles.activeCard}
          onPress={() => router.push(`/request/${activeRequest.id}`)}
        >
          <View style={styles.activeCardHeader}>
            <Text style={styles.activeCardEmoji}>
              {CATEGORY_ICONS[activeRequest.category?.slug ?? ''] ?? '🔧'}
            </Text>
            <View style={styles.activeCardInfo}>
              <Text style={styles.activeCardTitle} numberOfLines={1}>
                {activeRequest.description}
              </Text>
              <StatusBadge status={activeRequest.status} />
            </View>
          </View>
          {activeRequest.staff && (
            <View style={styles.staffRow}>
              <Text style={styles.staffText}>👷 {activeRequest.staff.full_name}</Text>
              {activeRequest.staff.rating_avg && (
                <Text style={styles.ratingText}>⭐ {activeRequest.staff.rating_avg.toFixed(1)}</Text>
              )}
            </View>
          )}
          <Text style={styles.viewDetail}>Xem chi tiết & theo dõi →</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => router.push('/request/new')}
      >
        <Text style={styles.createBtnIcon}>🆘</Text>
        <View>
          <Text style={styles.createBtnTitle}>Tạo yêu cầu hỗ trợ</Text>
          <Text style={styles.createBtnSubtitle}>Sửa laptop, xe, điện, IT...</Text>
        </View>
        <Text style={styles.createBtnArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
        <View style={styles.categoryGrid}>
          {[
            { slug: 'sua-laptop', name: 'Sửa Laptop' },
            { slug: 'sua-xe-may', name: 'Sửa Xe Máy' },
            { slug: 'sua-o-to', name: 'Sửa Ô Tô' },
            { slug: 'dien-dien-lanh', name: 'Điện Lạnh' },
            { slug: 'it-support', name: 'IT Support' },
            { slug: 'khoa-cua', name: 'Khóa Cửa' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={styles.categoryCard}
              onPress={() => router.push({ pathname: '/request/new', params: { category_slug: cat.slug } })}
            >
              <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[cat.slug]}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 20 },
  greeting: { gap: 4 },
  greetingText: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  greetingSubtitle: { fontSize: 14, color: COLORS.textSecondary },
  activeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeCardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  activeCardEmoji: { fontSize: 32 },
  activeCardInfo: { flex: 1, gap: 6 },
  activeCardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  staffRow: { flexDirection: 'row', justifyContent: 'space-between' },
  staffText: { fontSize: 13, color: COLORS.textSecondary },
  ratingText: { fontSize: 13, color: COLORS.rating },
  viewDetail: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createBtnIcon: { fontSize: 32 },
  createBtnTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  createBtnSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  createBtnArrow: { marginLeft: 'auto', fontSize: 20, color: '#fff' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: 11, color: COLORS.text, fontWeight: '500', textAlign: 'center' },
});
