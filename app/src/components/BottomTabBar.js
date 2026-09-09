import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, gradients, radii, shadow } from '../theme';

const TABS = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'history', label: 'History', emoji: '📊' },
  { key: 'chat', label: 'Chat', emoji: '💬' },
  { key: 'profile', label: 'Profile', emoji: '🙂' },
];

export default function BottomTabBar({ active, onChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.item} hitSlop={6}>
              {isActive ? (
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapActive}
                >
                  <Text style={styles.emoji}>{tab.emoji}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.iconWrap}>
                  <Text style={styles.emoji}>{tab.emoji}</Text>
                </View>
              )}
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.select({ ios: 24, android: 16, default: 20 }),
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...shadow.card,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primaryDark,
  },
});
