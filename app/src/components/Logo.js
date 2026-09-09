import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const HEART_PATH =
  'M12 21.02l-1.35-1.24C5.65 15.24 2 11.86 2 7.9 2 4.68 4.5 2.2 7.7 2.2c1.8 0 3.55.86 4.3 2.2.75-1.34 2.5-2.2 4.3-2.2 3.2 0 5.7 2.48 5.7 5.7 0 3.96-3.65 7.34-8.65 11.9L12 21.02z';

const PULSE_PATH = 'M4.5 12h3.1l1.6-3.4 2.3 7.6 1.9-4.2h2l1.3 1.6h3.3';

export default function Logo({ size = 40, radius, gradientId = 'healthosLogoGradient' }) {
  const r = radius ?? size * 0.28;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3956E8" />
            <Stop offset="100%" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="24" height="24" rx={24 * (r / size)} fill={`url(#${gradientId})`} />
        <Path d={HEART_PATH} fill="#FFFFFF" fillOpacity={0.95} />
        <Path
          d={PULSE_PATH}
          fill="none"
          stroke="#2A3FC0"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
