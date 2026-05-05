import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABELS, STATUS_COLORS } from '../constants/config';

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? '#6B7280';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '600' },
});
