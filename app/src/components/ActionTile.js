import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { CATEGORY_ICON } from '../constants/icons';
import { colors, fonts, gradients, radii, shadow, type } from '../theme';

export default function ActionTile({ label, sublabel, tone = 'primary', onPress }) {
  const grad = GRADIENT[tone] || gradients.brand;
  const light = LIGHT[tone] || colors.primaryDark;
  const icon = CATEGORY_ICON[tone] || CATEGORY_ICON.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconWrap}>
        <Icon family={icon.family} name={icon.name} size={20} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: light }]} numberOfLines={1}>
          {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const GRADIENT = {
  primary: gradients.brand,
  medicine: gradients.medicine,
  blood: gradients.blood,
  water: gradients.water,
  assistant: gradients.assistant,
};

const LIGHT = {
  primary: colors.primaryDark,
  medicine: colors.medicineDark,
  blood: colors.bloodDark,
  water: colors.waterDark,
  assistant: colors.assistantDark,
};

const styles = StyleSheet.create({
  tile: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 16,
    ...shadow.soft,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    ...type.bodyMedium,
    color: colors.textPrimary,
  },
  sublabel: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
});
