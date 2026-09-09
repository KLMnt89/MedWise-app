import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';

const SOFT = {
  primary: colors.primarySoft,
  medicine: colors.medicineSoft,
  blood: colors.bloodSoft,
  water: colors.waterSoft,
};
const DARK = {
  primary: colors.primaryDark,
  medicine: colors.medicineDark,
  blood: colors.bloodDark,
  water: colors.waterDark,
};

export default function PhotoCapture({ image, onChange, tone = 'primary', hint }) {
  const [busy, setBusy] = useState(false);
  const soft = SOFT[tone] || colors.primarySoft;
  const dark = DARK[tone] || colors.primaryDark;

  const pick = async (fromCamera) => {
    try {
      setBusy(true);
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });

      if (!result.canceled && result.assets?.[0]) {
        onChange(result.assets[0]);
      }
    } finally {
      setBusy(false);
    }
  };

  if (image) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri: image.uri }} style={styles.preview} />
        <Pressable
          onPress={() => onChange(null)}
          style={[styles.retakeBtn, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.retakeText, { color: dark }]}>Retake photo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.dropzone, { borderColor: soft, backgroundColor: soft + '55' }]}>
      <Text style={styles.dropIcon}>📷</Text>
      <Text style={styles.dropTitle}>Add a photo</Text>
      {hint ? <Text style={styles.dropHint}>{hint}</Text> : null}
      <View style={styles.dropActions}>
        <Pressable
          disabled={busy}
          onPress={() => pick(true)}
          style={[styles.dropButton, { backgroundColor: dark }]}
        >
          <Text style={styles.dropButtonText}>Take photo</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => pick(false)}
          style={[styles.dropButton, styles.dropButtonGhost, { borderColor: dark }]}
        >
          <Text style={[styles.dropButtonText, { color: dark }]}>Choose from library</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
  },
  dropIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  dropTitle: {
    ...type.subtitle,
    color: colors.textPrimary,
  },
  dropHint: {
    marginTop: 4,
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dropActions: {
    marginTop: 16,
    width: '100%',
    gap: 10,
  },
  dropButton: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  dropButtonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  dropButtonText: {
    ...type.bodyMedium,
    color: colors.textOnPrimary,
  },
  previewWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
  },
  retakeBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  retakeText: {
    ...type.caption,
    fontWeight: '700',
  },
});
