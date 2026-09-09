import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { TAB_ICON } from '../constants/icons';
import { colors, fonts, gradients, radii, shadow } from '../theme';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'history', label: 'History' },
  { key: 'chat', label: 'Chat' },
  { key: 'profile', label: 'Profile' },
];

export default function BottomTabBar({ active, onChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const icon = TAB_ICON[tab.key];
          return (
            <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.item} hitSlop={6}>
              {isActive ? (
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapActive}
                >
                  <Icon family={icon.family} name={icon.name} size={17} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View style={styles.iconWrap}>
                  <Icon family={icon.family} name={icon.name} size={17} color={colors.textMuted} />
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
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
  label: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primaryDark,
  },
});
