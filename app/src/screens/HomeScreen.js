import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pingHealth } from '../api/client';

const UPCOMING = [
  { label: 'Scan medicine', owner: 'frontend' },
  { label: 'Scan blood report', owner: 'frontend' },
  { label: 'Check water', owner: 'frontend' },
  { label: 'AI Health Assistant', owner: 'frontend' },
  { label: 'Dashboard', owner: 'frontend' },
];

export default function HomeScreen() {
  const [status, setStatus] = useState('idle');
  const [detail, setDetail] = useState('Tap Start to check the API.');

  const start = useCallback(async () => {
    setStatus('checking');
    setDetail('Connecting to MedWise…');
    try {
      const body = await pingHealth();
      if (body?.status === 'ok') {
        setStatus('ok');
        setDetail('API is up. Base is ready — scans and chat come next.');
      } else {
        setStatus('error');
        setDetail('API answered, but health was not ok.');
      }
    } catch {
      setStatus('error');
      setDetail(
        'Could not reach the API. Start the Spring Boot server, or set EXPO_PUBLIC_API_URL to your computer IP / Render URL.'
      );
    }
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <View style={styles.screen}>
      <Text style={styles.mark}>🩺</Text>
      <Text style={styles.title}>MedWise</Text>
      <Text style={styles.tagline}>One AI. Every health signal. One clear next step.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Starting task</Text>
        <Text style={styles.cardTitle}>Connect to the health API</Text>
        <Text
          style={[
            styles.badge,
            status === 'ok' && styles.badgeOk,
            status === 'error' && styles.badgeError,
            status === 'checking' && styles.badgeBusy,
          ]}
        >
          {status === 'ok' ? 'Connected' : status === 'error' ? 'Not connected' : 'Checking…'}
        </Text>
        <Text style={styles.detail}>{detail}</Text>
        <Pressable style={styles.button} onPress={start}>
          <Text style={styles.buttonText}>{status === 'ok' ? 'Check again' : 'Start'}</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Coming in this app</Text>
      {UPCOMING.map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowHint}>teammate</Text>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        MedWise is general health information, not a diagnosis or a substitute for a doctor or pharmacist.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7F5',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  mark: {
    fontSize: 36,
    textAlign: 'center',
  },
  title: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#14352C',
  },
  tagline: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#4A635C',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D7E4DE',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#2F6F5E',
  },
  cardTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '600',
    color: '#14352C',
  },
  badge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#E8EEEB',
    color: '#3A4A45',
  },
  badgeOk: {
    backgroundColor: '#D8F3E4',
    color: '#146C43',
  },
  badgeError: {
    backgroundColor: '#FDE8E8',
    color: '#9B1C1C',
  },
  badgeBusy: {
    backgroundColor: '#E8F0FF',
    color: '#1D4ED8',
  },
  detail: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 21,
    color: '#3A4A45',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#1F6F5B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7C76',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E3EBE7',
  },
  rowLabel: {
    fontSize: 15,
    color: '#2C3D38',
  },
  rowHint: {
    fontSize: 13,
    color: '#8A9A94',
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7C76',
  },
});
