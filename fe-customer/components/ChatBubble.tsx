import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/config';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  currentUserId: string;
}

export function ChatBubble({ message, currentUserId }: Props) {
  const isMine = message.user_id === currentUserId;
  const isSystem = message.is_system;

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      {!isMine && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {message.sender?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine && (
          <Text style={styles.senderName}>{message.sender?.full_name}</Text>
        )}
        {message.content && (
          <Text style={[styles.content, isMine && styles.contentMine]}>{message.content}</Text>
        )}
        <Text style={[styles.time, isMine && styles.timeMine]}>
          {new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: 4 },
  rowMine: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  content: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  contentMine: { color: '#fff' },
  time: { fontSize: 10, color: COLORS.textSecondary, alignSelf: 'flex-end', marginTop: 2 },
  timeMine: { color: 'rgba(255,255,255,0.7)' },
  systemRow: { alignItems: 'center', marginVertical: 8 },
  systemText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    fontStyle: 'italic',
  },
});
