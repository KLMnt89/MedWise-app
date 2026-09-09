import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Card from '../components/Card';
import ActionTile from '../components/ActionTile';
import ScoreRing from '../components/ScoreRing';
import Badge from '../components/Badge';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import { CATEGORY_ICON } from '../constants/icons';
import { getDashboard } from '../api/client';
import { colors, gradients, radii, spacing, type } from '../theme';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ onOpenScan, onOpenChat }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Could not reach HealthOS.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const medicinesTaken = dashboard?.todaysMedicines?.filter((m) => m.lastTakenAt)?.length ?? 0;
  const medicinesTotal = dashboard?.todaysMedicines?.length ?? 0;
  const latestWater = dashboard?.latestWater;
  const latestBlood = dashboard?.latestBlood;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryDark} />}
    >
      <View style={styles.hero}>
        <LinearGradient colors={gradients.glow} style={styles.glow} pointerEvents="none" />
        <View style={styles.heroTopRow}>
          <View style={styles.brandRow}>
            <Logo size={32} />
            <Text style={styles.brandName}>HealthOS</Text>
          </View>
        </View>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.subtitle}>Your health, all in one place</Text>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Can't reach HealthOS</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </Card>
      ) : (
        <Card style={styles.scoreCard}>
          <ScoreRing score={dashboard?.healthScore ?? 0} />
          <Text style={styles.scoreNote}>
            {dashboard?.healthScoreNote || 'Scan a medicine, blood test, or water sample to get started.'}
          </Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.todayRow}>
        <Card style={styles.todayCard}>
          <Icon family={CATEGORY_ICON.medicine.family} name={CATEGORY_ICON.medicine.name} size={18} color={colors.medicineDark} />
          <Text style={styles.todayValue}>
            {medicinesTaken}/{medicinesTotal || 0}
          </Text>
          <Text style={styles.todayLabel}>Medicines taken</Text>
        </Card>
        <Card style={styles.todayCard}>
          <Icon family={CATEGORY_ICON.water.family} name={CATEGORY_ICON.water.name} size={18} color={colors.waterDark} />
          <Text style={styles.todayValue}>{latestWater ? `${latestWater.ph ?? '–'} pH` : '—'}</Text>
          <Text style={styles.todayLabel}>Latest water check</Text>
          {latestWater ? (
            <Badge
              label={latestWater.verdict || 'Checked'}
              tone={latestWater.verdict?.toLowerCase().includes('safe') ? 'success' : 'warning'}
            />
          ) : null}
        </Card>
        <Card style={styles.todayCard}>
          <Icon family={CATEGORY_ICON.blood.family} name={CATEGORY_ICON.blood.name} size={18} color={colors.bloodDark} />
          <Text style={styles.todayValue}>{latestBlood?.flaggedValues?.length ?? 0}</Text>
          <Text style={styles.todayLabel}>Blood values flagged</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Scan &amp; check</Text>
      <View style={styles.grid}>
        <ActionTile label="Scan Medicine" sublabel="Photo or name" tone="medicine" onPress={() => onOpenScan('medicine')} />
        <ActionTile label="Scan Blood Report" sublabel="Photo or values" tone="blood" onPress={() => onOpenScan('blood')} />
        <ActionTile label="Check Water" sublabel="pH, TDS, chlorine" tone="water" onPress={() => onOpenScan('water')} />
        <ActionTile label="AI Health Assistant" sublabel="Ask anything" tone="assistant" onPress={onOpenChat} />
      </View>

      <Text style={styles.disclaimer}>
        {dashboard?.disclaimer ||
          'HealthOS provides general health information and is not a substitute for professional medical advice.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 140,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -140,
    left: -60,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    ...type.subtitle,
    color: colors.textPrimary,
  },
  greeting: {
    ...type.display,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    ...type.body,
    color: colors.textSecondary,
  },
  scoreCard: {
    marginHorizontal: spacing.xl,
    marginTop: -8,
    alignItems: 'center',
    paddingVertical: 26,
  },
  scoreNote: {
    marginTop: 16,
    textAlign: 'center',
    ...type.body,
    color: colors.textSecondary,
    paddingHorizontal: 8,
  },
  errorCard: {
    marginHorizontal: spacing.xl,
    marginTop: -8,
    backgroundColor: colors.dangerSoft,
    borderColor: colors.bloodDark,
  },
  errorTitle: {
    ...type.subtitle,
    color: colors.bloodDark,
  },
  errorBody: {
    marginTop: 6,
    ...type.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...type.label,
    color: colors.textMuted,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
  },
  todayRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xl,
  },
  todayCard: {
    flex: 1,
    alignItems: 'flex-start',
    padding: 14,
    gap: 4,
  },
  todayValue: {
    ...type.title,
    fontSize: 18,
    color: colors.textPrimary,
  },
  todayLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.xl,
  },
  disclaimer: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xl,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
