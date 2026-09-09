import { StyleSheet, Text, View } from 'react-native';
import Card from './Card';
import { colors, type } from '../theme';

export default function StatCard({ emoji, label, value, hint, tone = 'primary' }) {
  const soft = SOFT[tone] || colors.primarySoft;
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: soft }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Card>
  );
}

const SOFT = {
  primary: colors.primarySoft,
  medicine: colors.medicineSoft,
  blood: colors.bloodSoft,
  water: colors.waterSoft,
  assistant: colors.assistantSoft,
};

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    padding: 16,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 16,
  },
  value: {
    ...type.title,
    color: colors.textPrimary,
  },
  label: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
});
