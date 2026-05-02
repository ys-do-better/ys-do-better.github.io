// Minimalist palette: soft blue & beige-gray
export const colors = {
  // Neutrals
  background: '#F7F5F2',
  backgroundAlt: '#EDEAE5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEEB',
  border: '#E5E2DD',
  borderLight: '#EFED EA',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9E9E9E',
  textOnDark: '#FFFFFF',

  // Primary (soft blue)
  primary: '#5B8DEF',
  primaryLight: '#8BB4F5',
  primaryDark: '#3A6FD8',
  primaryBg: '#EBF2FC',

  // Accent (warm beige)
  accent: '#C9A87C',
  accentLight: '#E8D5B8',
  accentBg: '#FBF6EF',

  // Status
  success: '#6DBF7B',
  successBg: '#EDF9EF',
  warning: '#E8A849',
  warningBg: '#FFF4E3',
  danger: '#E06B6B',
  dangerBg: '#FDEDED',
  info: '#5B8DEF',
  infoBg: '#EBF2FC',

  // Module accents (muted)
  profile: '#9B8EC4',
  photos: '#D4949E',
  growth: '#6DBF7B',
  mood: '#E8A849',
  baby: '#E8956B',
  health: '#5BB5B5',
  finance: '#5B8DEF',
  books: '#5BB8A0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
};
