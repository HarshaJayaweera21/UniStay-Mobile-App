/**
 * UniStay Design System — Theme Tokens
 * Typography, spacing, and layout constants
 */

import { Platform } from 'react-native';

// ── Font Families ──
export const Fonts = {
  headline: 'PlusJakartaSans_700Bold',
  headlineExtraBold: 'PlusJakartaSans_800ExtraBold',
  headlineSemiBold: 'PlusJakartaSans_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
};

// ── Spacing Scale ──
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
};

// ── Border Radius ──
export const Radius = {
  sm: 4,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ── Layout ──
export const MaxContentWidth = 800;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
