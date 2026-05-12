'use client';
import { useTheme } from './theme';

export interface Palette {
  // Backgrounds
  pageBg: string;
  cardBg: string;
  cardSolid: string;
  navBg: string;
  dropdownBg: string;
  inputBg: string;
  rowBg: string;
  // Borders
  border: string;
  borderTint: string;
  // Text
  textPrimary: string;
  textBody: string;
  textMuted: string;
  // Accents — bold in both modes
  violet: string;
  midViolet: string;
  coral: string;
  cyan: string;
  lime: string;
  amber: string;
  pink: string;
  // Glow helpers
  glow: boolean;
  glowStr: (color: string, spread?: number) => string;
  shadow: (color: string) => string;
}

const DARK: Palette = {
  pageBg:      '#1C1C24',
  cardBg:      'rgba(28,28,36,0.88)',
  cardSolid:   '#22212e',
  navBg:       'rgba(28,28,36,0.6)',
  dropdownBg:  '#19163a',
  inputBg:     'rgba(139,124,255,0.08)',
  rowBg:       'rgba(139,124,255,0.04)',
  border:      'rgba(139,124,255,0.18)',
  borderTint:  'rgba(139,124,255,0.12)',
  textPrimary: '#EEEDFE',
  textBody:    '#B7B3DC',
  textMuted:   '#7B7796',
  violet:      '#8B7CFF',
  midViolet:   '#7F77DD',
  coral:       '#F0997B',
  cyan:        '#56E0FF',
  lime:        '#B6FF6E',
  amber:       '#FFCB5C',
  pink:        '#FF6FD8',
  glow:        true,
  glowStr:     (c, s = 18) => `0 0 ${s}px ${c}`,
  shadow:      (c) => `0 0 20px ${c}80`,
};

const LIGHT: Palette = {
  pageBg:      '#F2F1FC',
  cardBg:      'rgba(255,255,255,0.97)',
  cardSolid:   '#FFFFFF',
  navBg:       'rgba(242,241,252,0.92)',
  dropdownBg:  '#FFFFFF',
  inputBg:     'rgba(83,74,183,0.07)',
  rowBg:       'rgba(83,74,183,0.04)',
  border:      'rgba(83,74,183,0.16)',
  borderTint:  'rgba(83,74,183,0.1)',
  textPrimary: '#1C1C24',
  textBody:    '#3D3960',
  textMuted:   '#7B7796',
  // Bold, saturated versions for light bg
  violet:      '#5548D9',
  midViolet:   '#6B63CC',
  coral:       '#D9614A',
  cyan:        '#007FAA',
  lime:        '#4A9200',
  amber:       '#A06800',
  pink:        '#AA008C',
  glow:        false,
  glowStr:     () => 'none',
  shadow:      (c) => `0 2px 12px ${c}40`,
};

export function usePalette(): Palette {
  const { theme } = useTheme();
  return theme === 'dark' ? DARK : LIGHT;
}

export { DARK, LIGHT };
