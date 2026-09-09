import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ScanningOverlay from '../components/ScanningOverlay';
import { PrimaryButton } from '../components/Buttons';
import { useAsync, withMinDuration } from '../hooks/useAsync';
import { checkWater } from '../api/client';
import { colors, spacing, type } from '../theme';

function isSafe(verdict) {
  return (verdict || '').toLowerCase().includes('safe');
}

export default function CheckWaterScreen({ onBack }) {
  const [ph, setPh] = useState('');
  const [tds, setTds] = useState('');
  const [chlorine, setChlorine] = useState('');
  const [result, setResult] = useState(null);
  const { loading, error, run } = useAsync();

  const canCheck = useMemo(
    () => ph.trim() !== '' && tds.trim() !== '' && chlorine.trim() !== '',
    [ph, tds, chlorine]
  );

  const submit = () =>
    run(async () => {
      const response = await withMinDuration(
        checkWater({
          ph: Number(ph),
          tds: Number(tds),
          chlorine: Number(chlorine),
        }),
        2200
      );
      setResult(response);
      return response;
    });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScanningOverlay
        visible={loading}
        tone="water"
        steps={['Reading your values…', 'Comparing to safe ranges…', 'Connecting health context…', 'Generating insights…']}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Check Water"
          subtitle="Enter your test-strip readings"
          tone="water"
          onBack={onBack}
        />

        <Card style={styles.formCard}>
          <Field label="pH" value={ph} onChangeText={setPh} placeholder="7.2" suffix="" />
          <Field label="TDS" value={tds} onChangeText={setTds} placeholder="120" suffix="ppm" />
          <Field label="Chlorine" value={chlorine} onChangeText={setChlorine} placeholder="0.5" suffix="mg/L" />
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Checking…' : 'Check Water'}
          onPress={submit}
          disabled={!canCheck}
          loading={loading}
          tone="water"
        />

        {result ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>AI Analysis</Text>
              {result.fallback ? <Badge label="Offline estimate" tone="warning" /> : <Badge label="Gemini AI" tone="info" />}
            </View>

            <Badge
              label={result.verdict || 'Checked'}
              tone={isSafe(result.verdict) ? 'success' : 'danger'}
            />

            <View style={styles.readingsRow}>
              <Reading label="pH" value={result.ph} />
              <Reading label="TDS" value={result.tds} />
              <Reading label="Chlorine" value={result.chlorine} />
            </View>

            {result.explanation ? <Text style={styles.explanation}>{result.explanation}</Text> : null}

            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          </Card>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, suffix }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.fieldInput}
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function Reading({ label, value }) {
  return (
    <View style={styles.reading}>
      <Text style={styles.readingValue}>{value ?? '–'}</Text>
      <Text style={styles.readingLabel}>{label}</Text>
    </View>
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
    paddingBottom: 40,
    gap: spacing.lg,
  },
  formCard: {
    gap: 16,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 12,
    ...type.subtitle,
    color: colors.textPrimary,
  },
  fieldSuffix: {
    ...type.caption,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.bloodDark,
    ...type.caption,
  },
  resultCard: {
    backgroundColor: colors.waterSoft,
    gap: 14,
    alignItems: 'flex-start',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  resultTitle: {
    ...type.subtitle,
    color: colors.waterDark,
  },
  readingsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  reading: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  readingValue: {
    ...type.subtitle,
    color: colors.textPrimary,
  },
  readingLabel: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
  explanation: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footerSpace: {
    height: 40,
  },
});
