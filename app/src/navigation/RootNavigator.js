import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScanMedicineScreen from '../screens/ScanMedicineScreen';
import ScanBloodScreen from '../screens/ScanBloodScreen';
import CheckWaterScreen from '../screens/CheckWaterScreen';
import { colors } from '../theme';

const SCAN_SCREENS = {
  medicine: ScanMedicineScreen,
  blood: ScanBloodScreen,
  water: CheckWaterScreen,
};

export default function RootNavigator() {
  const [tab, setTab] = useState('home');
  const [scan, setScan] = useState(null);

  const openScan = useCallback((kind) => setScan(kind), []);
  const closeScan = useCallback(() => setScan(null), []);
  const openChat = useCallback(() => {
    setScan(null);
    setTab('chat');
  }, []);

  if (scan) {
    const ScanScreen = SCAN_SCREENS[scan];
    return (
      <View style={styles.root}>
        <ScanScreen onBack={closeScan} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        {tab === 'home' && <HomeScreen onOpenScan={openScan} onOpenChat={openChat} />}
        {tab === 'history' && <HistoryScreen onOpenChat={openChat} />}
        {tab === 'chat' && <ChatScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      <BottomTabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
});
