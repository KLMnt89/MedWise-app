import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';

export default function ScreenHeader({ title, subtitle, onBack, tone = 'primary', right }) {
  const soft = SOFT[tone] || colors.primarySoft;
  const dark = DARK[tone] || colors.primaryDark;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: soft }]} hitSlop={8}>
            <Text style={[styles.backArrow, { color: dark }]}>‹</Text>
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const SOFT = {
  primary: colors.primarySoft,
  medicine: colors.medicineSoft,
  blood: colors.bloodSoft,
  water: colors.waterSoft,
  assistant: colors.assistantSoft,
};
const DARK = {
  primary: colors.primaryDark,
  medicine: colors.medicineDark,
  blood: colors.bloodDark,
  water: colors.waterDark,
  assistant: colors.assistantDark,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    ...type.caption,
    color: colors.textSecondary,
  },
});
