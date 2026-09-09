import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import PhotoCapture from '../components/PhotoCapture';
import ScanningOverlay from '../components/ScanningOverlay';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { PrimaryButton, GhostButton } from '../components/Buttons';
import { useAsync, withMinDuration } from '../hooks/useAsync';
import { scanMedicine, markMedicineTaken } from '../api/client';
import { colors, spacing, type } from '../theme';

export default function ScanMedicineScreen({ onBack }) {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const { loading, error, run } = useAsync();
  const takenState = useAsync();

  const canAnalyze = Boolean(image || name.trim());

  const analyze = () =>
    run(async () => {
      const response = await withMinDuration(scanMedicine({ name: name.trim() || undefined, image }), 2600);
      setResult(response);
      return response;
    });

  const markTaken = () =>
    takenState.run(async () => {
      const updated = await markMedicineTaken(result.id);
      setResult(updated);
      return updated;
    });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScanningOverlay visible={loading} imageUri={image?.uri} tone="medicine" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Scan Medicine"
          subtitle="Photo of the label, or type the name"
          tone="medicine"
          onBack={onBack}
        />

        <PhotoCapture
          image={image}
          onChange={setImage}
          tone="medicine"
          hint="A clear photo of the medicine box or label works best."
        />

        <Text style={styles.orText}>or type the name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Paracetamol 500mg"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          label={loading ? 'Analyzing…' : 'Analyze'}
          onPress={analyze}
          disabled={!canAnalyze}
          loading={loading}
          tone="medicine"
        />

        {result ? (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>AI Analysis</Text>
              {result.fallback ? <Badge label="Offline estimate" tone="warning" /> : <Badge label="Gemini AI" tone="primary" />}
            </View>

            <Row label="Name" value={result.name} />
            <Row label="Purpose" value={result.purpose} />
            <Row label="Dose" value={result.dose} />
            <Row label="Frequency" value={result.frequency} />
            <Row label="Water" value={result.waterIntakeNote} />

            {result.explanation ? <Text style={styles.explanation}>{result.explanation}</Text> : null}

            <PrimaryButton
              label={result.lastTakenAt ? 'Marked as taken ✓' : 'Mark as taken'}
              onPress={markTaken}
              disabled={Boolean(result.lastTakenAt)}
              loading={takenState.loading}
              tone="success"
            />

            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
          </Card>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
  orText: {
    textAlign: 'center',
    ...type.caption,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...type.body,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.bloodDark,
    ...type.caption,
  },
  resultCard: {
    backgroundColor: colors.medicineSoft,
    gap: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTitle: {
    ...type.subtitle,
    color: colors.medicineDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    ...type.caption,
    color: colors.textSecondary,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  explanation: {
    marginTop: 4,
    ...type.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  disclaimer: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  footerSpace: {
    height: 40,
  },
});
