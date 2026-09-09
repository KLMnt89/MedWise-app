import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii, type } from '../theme';

export function PrimaryButton({ label, onPress, disabled, loading, tone = 'primary', icon }) {
  const grad = TONE_GRADIENT[tone] || gradients.brand;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }]}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <>
            {icon}
            <Text style={styles.primaryText}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, icon }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondary,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      {icon}
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, tone = 'primary' }) {
  const color = TONE_TEXT[tone] || colors.primary;
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Text style={[styles.ghostText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const TONE_GRADIENT = {
  primary: gradients.brand,
  medicine: gradients.medicine,
  blood: gradients.blood,
  water: gradients.water,
  assistant: gradients.assistant,
  success: gradients.score,
};

const TONE_TEXT = {
  primary: colors.primary,
  medicine: colors.medicineDark,
  blood: colors.bloodDark,
  water: colors.waterDark,
  assistant: colors.assistantDark,
};

const styles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  primaryText: {
    color: colors.textOnPrimary,
    ...type.subtitle,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.textPrimary,
    ...type.bodyMedium,
  },
  ghostText: {
    ...type.bodyMedium,
  },
});
