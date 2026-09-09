import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../components/Card';
import Badge from '../components/Badge';
import HealthGraph from '../components/HealthGraph';
import { GhostButton } from '../components/Buttons';
import { colors, fonts, spacing, type } from '../theme';
import { getDashboard, listBloodScans, listMedicines, listWaterChecks } from '../api/client';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function HistoryScreen({ onOpenChat }) {
  const [dashboard, setDashboard] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [bloodScans, setBloodScans] = useState([]);
  const [waterChecks, setWaterChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [dash, meds, blood, water] = await Promise.allSettled([
      getDashboard(),
      listMedicines(),
      listBloodScans(),
      listWaterChecks(),
    ]);
    if (dash.status === 'fulfilled') setDashboard(dash.value);
    if (meds.status === 'fulfilled') setMedicines(meds.value);
    if (blood.status === 'fulfilled') setBloodScans(blood.value);
    if (water.status === 'fulfilled') setWaterChecks(water.value);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const graphNodes = useMemo(() => {
    const medsTaken = medicines.filter((m) => m.lastTakenAt).length;
    const latestBlood = bloodScans[0];
    const latestWater = waterChecks[0];
    return [
      {
        key: 'medicine',
        label: 'Medicine',
        emoji: '💊',
        tone: 'medicine',
        summary:
          medicines.length === 0
            ? 'No medicines scanned yet.'
            : `${medsTaken}/${medicines.length} taken today. Most recent: ${medicines[0]?.name}.`,
      },
      {
        key: 'blood',
        label: 'Blood',
        emoji: '🩸',
        tone: 'blood',
        summary: latestBlood
          ? `${latestBlood.flaggedValues?.length ?? 0} value(s) flagged. ${latestBlood.summary || ''}`.trim()
          : 'No blood reports scanned yet.',
      },
      {
        key: 'water',
        label: 'Water',
        emoji: '💧',
        tone: 'water',
        summary: latestWater
          ? `${latestWater.verdict || 'Checked'} · pH ${latestWater.ph ?? '–'}, TDS ${latestWater.tds ?? '–'}.`
          : 'No water checks logged yet.',
      },
      {
        key: 'assistant',
        label: 'AI Insights',
        emoji: '✨',
        tone: 'assistant',
        summary:
          dashboard?.healthScoreNote ||
          'Ask the Health Assistant to connect the dots across your medicines, blood work, and water checks.',
      },
    ];
  }, [medicines, bloodScans, waterChecks, dashboard]);

  const timeline = useMemo(() => {
    const events = [];
    medicines.forEach((m) => {
      if (m.lastTakenAt) {
        events.push({ id: `med-${m.id}`, time: m.lastTakenAt, emoji: '💊', title: `${m.name} taken`, tone: 'medicine' });
      }
    });
    bloodScans.forEach((b) => {
      events.push({ id: `blood-${b.id}`, time: b.createdAt, emoji: '🩸', title: 'Blood report analyzed', tone: 'blood' });
    });
    waterChecks.forEach((w) => {
      events.push({
        id: `water-${w.id}`,
        time: w.createdAt,
        emoji: '💧',
        title: `Water check · ${w.verdict || 'Checked'}`,
        tone: 'water',
      });
    });
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [medicines, bloodScans, waterChecks]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.pageTitle}>Your Health Dashboard</Text>
      <Text style={styles.pageSubtitle}>Every signal, connected in one picture</Text>

      <Section title="Health Graph" emoji="🕸️">
        <View style={styles.graphCard}>
          <HealthGraph score={dashboard?.healthScore ?? 0} nodes={graphNodes} size={260} />
        </View>
      </Section>

      <Section title="Today's timeline" emoji="🕐">
        {timeline.length === 0 ? (
          <EmptyRow text="Nothing logged yet — scan a medicine, blood report, or water sample." />
        ) : (
          timeline.map((event, index) => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={styles.timelineDot} />
                {index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{formatTime(event.time)}</Text>
                <Text style={styles.timelineTitle}>
                  {event.emoji} {event.title}
                </Text>
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Medicine tracking" emoji="💊">
        {medicines.length === 0 ? (
          <EmptyRow text="No medicines scanned yet." />
        ) : (
          medicines.slice(0, 6).map((med) => (
            <ListRow
              key={med.id}
              title={med.name}
              subtitle={med.frequency || med.dose}
              right={
                <Badge label={med.lastTakenAt ? 'Taken today' : 'Pending'} tone={med.lastTakenAt ? 'success' : 'neutral'} />
              }
            />
          ))
        )}
      </Section>

      <Section title="Blood results history" emoji="🩸">
        {bloodScans.length === 0 ? (
          <EmptyRow text="No blood reports scanned yet." />
        ) : (
          bloodScans.slice(0, 6).map((scan) => (
            <ListRow
              key={scan.id}
              title={scan.summary || 'Blood report'}
              subtitle={formatDate(scan.createdAt)}
              right={<Badge label={`${scan.flaggedValues?.length ?? 0} flagged`} tone={scan.flaggedValues?.length ? 'danger' : 'success'} />}
            />
          ))
        )}
      </Section>

      <Section title="Water quality log" emoji="💧">
        {waterChecks.length === 0 ? (
          <EmptyRow text="No water checks logged yet." />
        ) : (
          waterChecks.slice(0, 6).map((check) => (
            <ListRow
              key={check.id}
              title={`pH ${check.ph ?? '–'} · TDS ${check.tds ?? '–'}`}
              subtitle={formatDate(check.createdAt)}
              right={<Badge label={check.verdict || 'Checked'} tone={(check.verdict || '').toLowerCase().includes('safe') ? 'success' : 'warning'} />}
            />
          ))
        )}
      </Section>

      <Section title="Activity & vitals" emoji="⌚">
        <Card muted style={styles.connectCard}>
          <Text style={styles.connectTitle}>Connect Apple Health or Google Fit</Text>
          <Text style={styles.connectBody}>
            Bring in steps, heart rate, and sleep so the AI assistant can correlate them with your medicines and labs.
          </Text>
          <GhostButton label="Coming soon" tone="primary" onPress={() => {}} />
        </Card>
      </Section>

      <Section title="Ask the assistant" emoji="✨">
        <Card style={styles.insightCard}>
          <Text style={styles.insightBody}>
            Tap a node on the Health Graph above, or open the assistant to connect the dots yourself.
          </Text>
          <GhostButton label="Open Health Assistant →" tone="assistant" onPress={onOpenChat} />
        </Card>
      </Section>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

function Section({ title, emoji, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function ListRow({ title, subtitle, right }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listRowText}>
        <Text style={styles.listRowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.listRowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function EmptyRow({ text }) {
  return <Text style={styles.emptyRow}>{text}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 64,
    paddingBottom: 140,
  },
  pageTitle: {
    ...type.display,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    marginTop: 4,
    ...type.body,
    color: colors.textSecondary,
  },
  graphCard: {
    alignItems: 'center',
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    ...type.subtitle,
    color: colors.textPrimary,
  },
  sectionCard: {
    gap: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  listRowText: {
    flexShrink: 1,
  },
  listRowTitle: {
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  listRowSubtitle: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
  emptyRow: {
    ...type.body,
    color: colors.textMuted,
  },
  connectCard: {
    gap: 8,
    alignItems: 'flex-start',
  },
  connectTitle: {
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  connectBody: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  insightCard: {
    gap: 10,
    backgroundColor: colors.assistantSoft,
    alignItems: 'flex-start',
  },
  insightBody: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    alignItems: 'center',
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },
  timelineTitle: {
    marginTop: 2,
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  footerSpace: {
    height: 20,
  },
});
