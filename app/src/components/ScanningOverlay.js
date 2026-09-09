import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const DEFAULT_STEPS = [
  'Analyzing…',
  'Extracting information…',
  'Connecting health context…',
  'Generating insights…',
];

const FRAME = 220;

export default function ScanningOverlay({ visible, imageUri, tone = 'primary', steps = DEFAULT_STEPS }) {
  const [stepIndex, setStepIndex] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;
  const accent = ACCENT[tone] || colors.primary;

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      return undefined;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1 < steps.length ? i + 1 : i));
    }, 900);
    return () => clearInterval(interval);
  }, [visible, steps.length]);

  useEffect(() => {
    if (!visible) return undefined;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  const translateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [4, FRAME - 4] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.frameWrap}>
          <View style={[styles.frame, { borderColor: accent }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderEmoji}>🔎</Text>
              </View>
            )}
            <Animated.View style={[styles.scanLine, { backgroundColor: accent, transform: [{ translateY }] }]} />
            <Corner style={[styles.cornerTL, { borderColor: accent }]} />
            <Corner style={[styles.cornerTR, { borderColor: accent }]} />
            <Corner style={[styles.cornerBL, { borderColor: accent }]} />
            <Corner style={[styles.cornerBR, { borderColor: accent }]} />
          </View>
          <View style={[styles.statusPill, { borderColor: accent }]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={styles.statusText}>{steps[stepIndex]}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Corner({ style }) {
  return <View style={[styles.corner, style]} />;
}

const ACCENT = {
  primary: colors.primary,
  medicine: colors.medicine,
  blood: colors.blood,
  water: colors.water,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: {
    alignItems: 'center',
  },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: colors.navyMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
    opacity: 0.85,
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: colors.textOnPrimary,
  },
  cornerTL: { top: -1, left: -1, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: -1, right: -1, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: -1, left: -1, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -1, right: -1, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 12 },
  statusPill: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
});
