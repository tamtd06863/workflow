import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/config';

interface Props {
  visible: boolean;
  mode: 'time' | 'datetime';
  value: Date;
  minimumDate?: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

function toInputValue(date: Date, mode: 'time' | 'datetime'): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (mode === 'time') return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function toMinValue(date: Date, mode: 'time' | 'datetime'): string {
  return toInputValue(date, mode);
}

export function DateTimePickerModal({ visible, mode, value, minimumDate, onChange, onClose }: Props) {
  const [current, setCurrent] = useState(value);

  useEffect(() => { setCurrent(value); }, [value]);

  // Android: native dialog, no modal wrapper needed
  if (Platform.OS === 'android') {
    if (!visible) return null;
    return (
      <DateTimePicker
        value={current}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        onChange={(e: DateTimePickerEvent, date?: Date) => {
          if (e.type === 'dismissed') { onClose(); return; }
          if (date) onChange(date);
          onClose();
        }}
      />
    );
  }

  const title = mode === 'time' ? '🕐 Chọn giờ hôm nay' : '📅 Chọn ngày & giờ';

  // Web: use native HTML input directly
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>

            {/* @ts-ignore — web-only HTML input */}
            <input
              type={mode === 'time' ? 'time' : 'datetime-local'}
              value={toInputValue(current, mode)}
              min={minimumDate ? toMinValue(minimumDate, mode) : undefined}
              onChange={(e: any) => {
                const raw = e.target.value;
                if (!raw) return;
                let parsed: Date;
                if (mode === 'time') {
                  const [h, m] = raw.split(':').map(Number);
                  parsed = new Date(current);
                  parsed.setHours(h, m, 0, 0);
                } else {
                  parsed = new Date(raw);
                }
                if (!isNaN(parsed.getTime())) setCurrent(parsed);
              }}
              style={{
                fontSize: 16,
                padding: '10px 14px',
                borderRadius: 10,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.text,
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
              } as any}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => { onChange(current); onClose(); }}>
                <Text style={styles.confirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // iOS: DateTimePicker in modal with spinner + confirm
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <DateTimePicker
            value={current}
            mode={mode}
            display="spinner"
            minimumDate={minimumDate}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              if (date) setCurrent(date);
            }}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => { onChange(current); onClose(); }}>
              <Text style={styles.confirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 320,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
