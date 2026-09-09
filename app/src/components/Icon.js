import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const FAMILIES = {
  feather: Feather,
  ionicons: Ionicons,
  mci: MaterialCommunityIcons,
};

export default function Icon({ family = 'feather', name, size = 20, color = '#FFFFFF', style }) {
  const Component = FAMILIES[family] || Feather;
  return <Component name={name} size={size} color={color} style={style} />;
}
