import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ChatBubble from '../components/ChatBubble';
import { colors, fonts, gradients, radii, spacing, type } from '../theme';
import { getChatHistory, sendChatMessage } from '../api/client';

const CONTEXT_CHIPS = [
  { label: 'Medicine', emoji: '💊' },
  { label: 'Blood', emoji: '🩸' },
  { label: 'Water', emoji: '💧' },
  { label: 'History', emoji: '🕐' },
];

const SUGGESTIONS = [
  'Based on everything I logged today, what should I pay attention to?',
  'Am I drinking enough water today?',
  'Any patterns in my last blood report?',
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const history = await getChatHistory();
        setMessages(history || []);
      } catch {
        // start with an empty conversation if history can't be loaded
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content || sending) return;
      setDraft('');
      setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content }]);
      scrollToEnd();
      setSending(true);
      try {
        const response = await sendChatMessage(content);
        setMessages((prev) => [...prev, response]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Couldn't reach the AI assistant: ${err?.message || 'unknown error'}`,
          },
        ]);
      } finally {
        setSending(false);
        scrollToEnd();
      }
    },
    [sending, scrollToEnd]
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <LinearGradient colors={gradients.assistant} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>✨</Text>
        </LinearGradient>
        <View>
          <Text style={styles.headerTitle}>Health Assistant</Text>
          <Text style={styles.headerSubtitle}>Your health context is connected</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {CONTEXT_CHIPS.map((chip) => (
          <View key={chip.label} style={styles.contextChip}>
            <Text style={styles.contextChipEmoji}>{chip.emoji}</Text>
            <Text style={styles.contextChipText}>{chip.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToEnd}
        showsVerticalScrollIndicator={false}
      >
        {loadingHistory ? (
          <ActivityIndicator color={colors.assistantDark} style={{ marginTop: 24 }} />
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ask me anything about your health data</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestionChip} onPress={() => send(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          messages.map((message, index) => (
            <ChatBubble key={message.id ?? index} role={message.role} content={message.content} />
          ))
        )}
        {sending ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.assistantDark} />
            <Text style={styles.typingText}>Thinking…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          onSubmitEditing={() => send(draft)}
        />
        <Pressable
          onPress={() => send(draft)}
          disabled={!draft.trim() || sending}
          style={{ opacity: !draft.trim() || sending ? 0.4 : 1 }}
        >
          <LinearGradient colors={gradients.assistant} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtn}>
            <Text style={styles.sendArrow}>➤</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    ...type.title,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  chipRowContent: {
    paddingHorizontal: spacing.xl,
    gap: 8,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.assistantSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  contextChipEmoji: {
    fontSize: 12,
  },
  contextChipText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.assistantDark,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  empty: {
    marginTop: 20,
    gap: 14,
  },
  emptyTitle: {
    ...type.subtitle,
    color: colors.textSecondary,
  },
  suggestions: {
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
  },
  suggestionText: {
    ...type.body,
    color: colors.textPrimary,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typingText: {
    ...type.caption,
    color: colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.select({ ios: 32, default: spacing.xl }),
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...type.body,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: {
    color: colors.textOnPrimary,
    fontSize: 16,
    marginLeft: 2,
  },
});
