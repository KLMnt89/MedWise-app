import { StyleSheet, View } from 'react-native';
import { colors, radii, shadow } from '../theme';

export default function Card({ style, children, muted = false }) {
  return <View style={[styles.base, muted && styles.muted, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadow.card,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
});
