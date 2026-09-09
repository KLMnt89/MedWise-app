import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import Logo from '../components/Logo';
import { colors, spacing, type } from '../theme';
import { API_BASE_URL } from '../api/client';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Logo size={64} />
        <Text style={styles.title}>HealthOS</Text>
        <Text style={styles.tagline}>One AI. Every health signal. One clear next step.</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardLabel}>Connection</Text>
        <Text style={styles.cardValue}>{API_BASE_URL}</Text>
        <Text style={styles.cardHint}>Set EXPO_PUBLIC_API_URL to point this app at a different backend.</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardLabel}>About</Text>
        <Text style={styles.cardBody}>
          HealthOS scans a medicine, a blood test, or a glass of water and turns it into one clear,
          personalized next step — with Exa for lookup and a local fallback if AI is unavailable.
        </Text>
      </Card>

      <Card style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>⚠️ Medical disclaimer</Text>
        <Text style={styles.disclaimerBody}>
          HealthOS provides general health information and is not a substitute for professional medical
          advice. Do not use this app to diagnose a condition, change prescribed treatment, or make
          emergency medical decisions. Consult a qualified doctor or pharmacist for advice specific to
          your situation.
        </Text>
      </Card>

      <Text style={styles.version}>HealthOS · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: 140,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 12,
  },
  title: {
    ...type.display,
    color: colors.textPrimary,
  },
  tagline: {
    marginTop: 6,
    textAlign: 'center',
    ...type.body,
    color: colors.textSecondary,
    paddingHorizontal: 20,
  },
  card: {
    gap: 6,
  },
  cardLabel: {
    ...type.label,
    color: colors.textMuted,
  },
  cardValue: {
    ...type.subtitle,
    color: colors.textPrimary,
  },
  cardHint: {
    ...type.caption,
    color: colors.textSecondary,
  },
  cardBody: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  disclaimerCard: {
    backgroundColor: colors.warningSoft,
    gap: 6,
  },
  disclaimerTitle: {
    ...type.bodyMedium,
    color: '#B54708',
  },
  disclaimerBody: {
    ...type.caption,
    color: '#8A5A0A',
    lineHeight: 18,
  },
  version: {
    textAlign: 'center',
    ...type.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
