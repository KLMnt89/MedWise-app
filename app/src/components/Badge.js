import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';

const TONES = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
  success: { bg: colors.successSoft, fg: colors.assistantDark },
  warning: { bg: colors.warningSoft, fg: '#B54708' },
  danger: { bg: colors.dangerSoft, fg: colors.bloodDark },
  info: { bg: colors.waterSoft, fg: colors.waterDark },
  primary: { bg: colors.primarySoft, fg: colors.primaryDark },
};

export default function Badge({ label, tone = 'neutral', icon }) {
  const palette = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }]}>
      {icon}
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  text: {
    ...type.caption,
  },
});
