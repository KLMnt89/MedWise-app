import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AnimatedNumber from './AnimatedNumber';
import { colors, fonts, type } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ScoreRing({ score = 0, size = 120, strokeWidth = 12, label = 'Health Score' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= 70 ? colors.success : clamped >= 40 ? colors.warning : colors.blood;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={tone}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            fill="none"
          />
        </Svg>
      </View>
      <View style={styles.center} pointerEvents="none">
        <View style={styles.scoreRow}>
          <AnimatedNumber value={Math.round(clamped)} style={[styles.score, { color: colors.textPrimary }]} />
        </View>
        <Text style={styles.max}>/ 100</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
  },
  score: {
    fontSize: 30,
    fontFamily: fonts.extraBold,
    lineHeight: 32,
  },
  max: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: -2,
  },
  label: {
    marginTop: 4,
    ...type.caption,
    color: colors.textSecondary,
  },
});
