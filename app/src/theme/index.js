import { colors, gradients } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const fonts = {
  extraBold: 'PlusJakartaSans_800ExtraBold',
  bold: 'PlusJakartaSans_700Bold',
  semiBold: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
};

export const type = {
  display: { fontSize: 32, fontFamily: fonts.extraBold, letterSpacing: -0.8 },
  title: { fontSize: 20, fontFamily: fonts.bold, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, fontFamily: fonts.semiBold, letterSpacing: -0.1 },
  body: { fontSize: 15, fontFamily: fonts.regular },
  bodyMedium: { fontSize: 15, fontFamily: fonts.semiBold },
  caption: { fontSize: 13, fontFamily: fonts.medium },
  label: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
};

export { colors, gradients };
