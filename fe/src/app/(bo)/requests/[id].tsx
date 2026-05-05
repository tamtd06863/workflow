import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Text, Pressable, ScrollView } from '@/tw';
import { requestsApi } from '@/lib/api/requests';
import { staffApi } from '@/lib/api/staff';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';

const STATUS_LABELS: Record<string, string> = {
  available: 'Đang chờ',
  negotiating: 'Thương lượng',
  pending_assignment: 'Chờ phân công',
  assigned: 'Đã phân công',
  in_progress: 'Đang xử lý',
  completed: 'Hoàn thành',
  completed_late: 'Hoàn thành (trễ)',
  cancelled: 'Đã hủy',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start mb-3">
      <Text className="text-xs font-semibold text-on-surface-variant w-28">{label}</Text>
      <Text className="text-sm text-on-surface flex-1">{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-5 mb-4">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-4">{title}</Text>
      {children}
    </View>
  );
}

export default function BORequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [showStaffList, setShowStaffList] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => requestsApi.getById(id),
    select: (d) => d.data,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffApi.list(),
    enabled: showStaffList,
    select: (d: any) => d?.data ?? [],
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['service-request', id] });
    qc.invalidateQueries({ queryKey: ['service-requests'] });
  };

  const pushToPoolMutation = useMutation({
    mutationFn: () => requestsApi.pushToPool(id),
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  const assignMutation = useMutation({
    mutationFn: (staffId: string) => requestsApi.assign(id, staffId),
    onSuccess: () => { invalidate(); setShowStaffList(false); setSelectedStaffId(null); },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Phân công thất bại'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => requestsApi.cancel(id, 'Operator hủy'),
    onSuccess: () => { invalidate(); router.back(); },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  const req = data;
  const statusLabel = STATUS_LABELS[req.status] ?? req.status;
  const canAssign = ['negotiating', 'pending_assignment'].includes(req.status);
  const canPushToPool = req.status === 'negotiating';
  const canCancel = ['available', 'negotiating'].includes(req.status);
  const isTerminal = ['completed', 'completed_late', 'cancelled'].includes(req.status);

  return (
    <View className="flex-1 bg-surface">
      <View className="glass-effect px-5 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="active:opacity-60">
            <Text className="text-primary font-semibold">← Quay lại</Text>
          </Pressable>
          <Text className="text-lg font-extrabold text-on-surface flex-1" numberOfLines={1}>Chi tiết yêu cầu</Text>
          <View className="bg-primary/10 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-primary">{statusLabel}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Section title="Thông tin yêu cầu">
          <InfoRow label="Dịch vụ" value={req.category?.name} />
          <InfoRow label="Mô tả" value={req.description} />
          <InfoRow label="Ưu tiên" value={req.is_emergency ? '🚨 Khẩn cấp' : 'Bình thường'} />
          <InfoRow label="Thời gian" value={new Date(req.created_at).toLocaleString('vi-VN')} />
        </Section>

        <Section title="Khách hàng">
          <InfoRow label="Họ tên" value={req.customer?.full_name} />
          <InfoRow label="Điện thoại" value={req.customer?.phone} />
        </Section>

        {req.tenant && (
          <Section title="Doanh nghiệp được chọn">
            <InfoRow label="Tên" value={req.tenant.name} />
          </Section>
        )}

        {req.staff && (
          <Section title="Kỹ thuật viên">
            <InfoRow label="Tên" value={req.staff.full_name} />
          </Section>
        )}

        <Section title="Tài chính">
          <InfoRow label="Giá thỏa thuận" value={req.agreed_price != null ? `${req.agreed_price.toLocaleString('vi-VN')}₫` : undefined} />
          {req.collected_amount != null && (
            <View className="bg-success/10 rounded-xl px-3 py-2">
              <Text className="text-sm font-bold text-success">
                💰 Đã thu: {req.collected_amount.toLocaleString('vi-VN')}₫
              </Text>
            </View>
          )}
        </Section>

        {!isTerminal && (
          <Section title="Thao tác">
            {canPushToPool && (
              <Pressable
                onPress={() => pushToPoolMutation.mutate()}
                disabled={pushToPoolMutation.isPending}
                className="py-3 rounded-xl bg-secondary/10 items-center mb-3 active:opacity-70 disabled:opacity-50"
              >
                {pushToPoolMutation.isPending
                  ? <ActivityIndicator size="small" />
                  : <Text className="text-sm font-bold text-on-surface">📤 Đưa vào pool nhân viên</Text>
                }
              </Pressable>
            )}

            {canAssign && (
              <Pressable
                onPress={() => setShowStaffList((v) => !v)}
                className="py-3 rounded-xl items-center mb-3 active:opacity-70"
                style={{ backgroundColor: '#1E40AF' }}
              >
                <Text className="text-sm font-bold text-white">👤 Phân công nhân viên</Text>
              </Pressable>
            )}

            {showStaffList && (
              <View className="bg-surface-container-high rounded-xl p-3 mb-3 gap-2">
                {!staffData ? (
                  <ActivityIndicator size="small" />
                ) : staffData.length === 0 ? (
                  <Text className="text-sm text-on-surface-variant text-center">Không có nhân viên</Text>
                ) : (
                  staffData.map((s: any) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedStaffId(s.id)}
                      className={`flex-row items-center gap-3 px-3 py-2.5 rounded-xl ${selectedStaffId === s.id ? 'bg-primary/15' : 'active:bg-surface-container'}`}
                    >
                      <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                        <Text className="text-xs font-bold text-primary">{s.full_name?.charAt(0)}</Text>
                      </View>
                      <Text className="text-sm text-on-surface font-semibold flex-1">{s.full_name}</Text>
                      {selectedStaffId === s.id && <Text className="text-primary font-bold">✓</Text>}
                    </Pressable>
                  ))
                )}
                {selectedStaffId && (
                  <Pressable
                    onPress={() => assignMutation.mutate(selectedStaffId)}
                    disabled={assignMutation.isPending}
                    className="py-3 rounded-xl items-center active:opacity-70 disabled:opacity-50 bg-primary mt-1"
                  >
                    {assignMutation.isPending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text className="text-sm font-bold text-white">Xác nhận phân công</Text>
                    }
                  </Pressable>
                )}
              </View>
            )}

            {canCancel && (
              <Pressable
                onPress={() => Alert.alert('Hủy yêu cầu', 'Bạn có chắc muốn hủy?', [
                  { text: 'Không', style: 'cancel' },
                  { text: 'Hủy', style: 'destructive', onPress: () => cancelMutation.mutate() },
                ])}
                disabled={cancelMutation.isPending}
                className="py-3 rounded-xl bg-error-container items-center active:opacity-70 disabled:opacity-50"
              >
                {cancelMutation.isPending
                  ? <ActivityIndicator size="small" />
                  : <Text className="text-sm font-bold text-on-error-container">Hủy yêu cầu</Text>
                }
              </Pressable>
            )}
          </Section>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
