import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import PhotoCapture from '../components/PhotoCapture';
import ScanningOverlay from '../components/ScanningOverlay';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { PrimaryButton } from '../components/Buttons';
import { useAsync, withMinDuration } from '../hooks/useAsync';
import { scanBlood } from '../api/client';
import { colors, spacing, type } from '../theme';

const STATUS_TONE = {
  high: 'danger',
  low: 'warning',
  normal: 'success',
};

export default function ScanBloodScreen({ onBack }) {
  const [image, setImage] = useState(null);
  const [values, setValues] = useState('');
  const [result, setResult] = useState(null);
  const { loading, error, run } = useAsync();

  const canAnalyze = Boolean(image || values.trim());

  const analyze = () =>
    run(async () => {
      const response = await withMinDuration(scanBlood({ values: values.trim() || undefined, image }), 2600);
      setResult(response);
      return response;
    });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScanningOverlay visible={loading} imageUri={image?.uri} tone="blood" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Scan Blood Report"
          subtitle="Photo of the report, or enter values"
          tone="blood"
          onBack={onBack}
        />

        <PhotoCapture
          image={image}
          onChange={setImage}
          tone="blood"
          hint="Lay the report flat and make sure the numbers are readable."
        />

        <Text style={styles.orText}>or enter values manually</Text>
        <TextInput
          value={values}
          onChangeText={setValues}
          placeholder="e.g. Glucose 7.2, Vitamin D 18, HbA1c 5.4"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Analyzing…' : 'Analyze'}
          onPress={analyze}
          disabled={!canAnalyze}
          loading={loading}
          tone="blood"
        />

        {result ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>AI Analysis</Text>
              {result.fallback ? <Badge label="Basic analysis" tone="warning" /> : <Badge label="Exa" tone="danger" />}
            </View>

            {result.summary ? <Text style={styles.summary}>{result.summary}</Text> : null}

            {result.flaggedValues?.length ? (
              <View style={styles.valuesList}>
                {result.flaggedValues.map((flag, index) => (
                  <View key={`${flag.name}-${index}`} style={styles.valueRow}>
                    <View style={styles.valueMain}>
                      <Text style={styles.valueName}>{flag.name}</Text>
                      {flag.note ? <Text style={styles.valueNote}>{flag.note}</Text> : null}
                    </View>
                    <View style={styles.valueRight}>
                      <Text style={styles.valueAmount}>{flag.value}</Text>
                      <Badge
                        label={flag.status || 'flagged'}
                        tone={STATUS_TONE[(flag.status || '').toLowerCase()] || 'neutral'}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {result.recommendations?.length ? (
              <View style={styles.recWrap}>
                <Text style={styles.recTitle}>Recommendations</Text>
                {result.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.recItem}>
                    •  {rec}
                  </Text>
                ))}
              </View>
            ) : null}

            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          </Card>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  orText: {
    textAlign: 'center',
    ...type.caption,
    color: colors.textMuted,
  },
  input: {
    minHeight: 80,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlignVertical: 'top',
    ...type.body,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.bloodDark,
    ...type.caption,
  },
  resultCard: {
    backgroundColor: colors.bloodSoft,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    ...type.subtitle,
    color: colors.bloodDark,
  },
  summary: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  valuesList: {
    gap: 10,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  valueMain: {
    flexShrink: 1,
    paddingRight: 8,
  },
  valueName: {
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  valueNote: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
  valueRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  valueAmount: {
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  recWrap: {
    gap: 4,
  },
  recTitle: {
    ...type.label,
    color: colors.bloodDark,
    marginBottom: 2,
  },
  recItem: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footerSpace: {
    height: 40,
  },
});
