import { useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { View, Text, Pressable, ScrollView, TextInput } from '@/tw';
import { technicianApi } from '@/lib/api/technician';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorView } from '@/components/ui/ErrorView';
import { ApiError } from '@/lib/api/client';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-surface-container-lowest rounded-xl p-5 mb-4">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-4">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row items-start mb-3">
      <Text className="text-xs font-semibold text-on-surface-variant w-24">{label}</Text>
      <Text className="text-sm text-on-surface flex-1">{value}</Text>
    </View>
  );
}

export default function StaffJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [collectedAmount, setCollectedAmount] = useState('');
  const [showRequote, setShowRequote] = useState(false);
  const [requotePrice, setRequotePrice] = useState('');
  const [requoteReason, setRequoteReason] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['technician-job', id],
    queryFn: () => technicianApi.getJob(id),
    select: (d: any) => d.data ?? d,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['technician-job', id] });
    qc.invalidateQueries({ queryKey: ['technician-jobs'] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => technicianApi.acceptJob(id),
    onSuccess: () => { invalidate(); Alert.alert('Đã xác nhận', 'Bạn đã xác nhận nhận công việc.'); },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  const declineMutation = useMutation({
    mutationFn: () => technicianApi.declineJob(id),
    onSuccess: () => { router.back(); },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 0, lng = 0;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      return technicianApi.startJob(id, lat, lng);
    },
    onSuccess: invalidate,
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  const completeMutation = useMutation({
    mutationFn: () => {
      const amount = collectedAmount.trim() ? Number(collectedAmount) : undefined;
      return technicianApi.completeJob(id, amount);
    },
    onSuccess: () => {
      invalidate();
      Alert.alert('Hoàn thành!', 'Công việc đã được hoàn thành thành công.');
      router.replace('/(staff)/jobs');
    },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  const reqouteMutation = useMutation({
    mutationFn: () => technicianApi.requote(id, Number(requotePrice), requoteReason),
    onSuccess: () => {
      invalidate();
      setShowRequote(false);
      Alert.alert('Đã gửi', 'Yêu cầu báo giá lại đã được gửi cho khách hàng.');
    },
    onError: (e) => Alert.alert('Lỗi', e instanceof ApiError ? e.message : 'Thất bại'),
  });

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <ErrorView onRetry={refetch} />;

  const job = data;
  const isAssigned = job.status === 'assigned';
  const isInProgress = job.status === 'in_progress';

  return (
    <View className="flex-1 bg-surface">
      <View className="glass-effect px-5 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="active:opacity-60">
            <Text className="text-primary font-semibold">← Quay lại</Text>
          </Pressable>
          <Text className="text-lg font-extrabold text-on-surface tracking-tight flex-1" numberOfLines={1}>
            Chi tiết công việc
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-5"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Section title="Thông tin yêu cầu">
          <InfoRow label="Dịch vụ" value={job.category?.name} />
          <InfoRow label="Mô tả" value={job.description} />
          <InfoRow label="Khách hàng" value={job.customer?.full_name} />
          <InfoRow label="Điện thoại" value={job.customer?.phone} />
          <InfoRow label="Ưu tiên" value={job.is_emergency ? '🚨 Khẩn cấp' : 'Bình thường'} />
          {job.agreed_price != null && (
            <InfoRow label="Giá thỏa thuận" value={`${Number(job.agreed_price).toLocaleString('vi-VN')}₫`} />
          )}
        </Section>

        {isAssigned && (
          <Section title="Xác nhận công việc">
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="flex-1 bg-primary py-3 rounded-xl items-center active:opacity-70 disabled:opacity-50"
              >
                {acceptMutation.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text className="text-white font-bold text-sm">✅ Xác nhận</Text>
                }
              </Pressable>
              <Pressable
                onPress={() => declineMutation.mutate()}
                disabled={declineMutation.isPending}
                className="flex-1 bg-error-container py-3 rounded-xl items-center active:opacity-70 disabled:opacity-50"
              >
                {declineMutation.isPending
                  ? <ActivityIndicator size="small" />
                  : <Text className="text-on-error-container font-bold text-sm">✕ Từ chối</Text>
                }
              </Pressable>
            </View>
            <Pressable
              onPress={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="mt-3 bg-success py-3 rounded-xl items-center active:opacity-70 disabled:opacity-50"
            >
              {startMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold">🚗 Bắt đầu di chuyển</Text>
              }
            </Pressable>
          </Section>
        )}

        {isInProgress && (
          <Section title="Hoàn thành công việc">
            <TextInput
              className="bg-surface-container-high rounded-xl px-4 py-3 text-base text-on-surface mb-3"
              placeholder="Số tiền thu được (VNĐ)"
              placeholderTextColor="#737685"
              value={collectedAmount}
              onChangeText={setCollectedAmount}
              keyboardType="numeric"
            />

            <Pressable
              onPress={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="bg-success py-4 rounded-xl items-center active:opacity-80 disabled:opacity-50 mb-3"
            >
              {completeMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">🏁 Hoàn thành công việc</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => setShowRequote((v) => !v)}
              className="py-3 rounded-xl bg-surface-container-high items-center active:opacity-70"
            >
              <Text className="text-sm font-bold text-on-surface">💬 Báo giá lại</Text>
            </Pressable>

            {showRequote && (
              <View className="mt-3 gap-3">
                <TextInput
                  className="bg-surface-container-high rounded-xl px-4 py-3 text-base text-on-surface"
                  placeholder="Giá mới (VNĐ)"
                  placeholderTextColor="#737685"
                  value={requotePrice}
                  onChangeText={setRequotePrice}
                  keyboardType="numeric"
                />
                <TextInput
                  className="bg-surface-container-high rounded-xl px-4 py-3 text-base text-on-surface"
                  placeholder="Lý do báo giá lại"
                  placeholderTextColor="#737685"
                  value={requoteReason}
                  onChangeText={setRequoteReason}
                  multiline
                />
                <Pressable
                  onPress={() => reqouteMutation.mutate()}
                  disabled={reqouteMutation.isPending || !requotePrice || !requoteReason}
                  className="bg-primary py-3 rounded-xl items-center active:opacity-70 disabled:opacity-50"
                >
                  {reqouteMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text className="text-white font-bold text-sm">Gửi báo giá lại</Text>
                  }
                </Pressable>
              </View>
            )}
          </Section>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
