import { fs } from './responsive';

export const DARK = {
  bg: '#0a0a14',
  surface: '#12121f',
  card: '#181830',
  cardBorder: '#1e1e3a',
  gold: '#D4A843',
  goldLight: '#F0D078',
  green: '#22C55E',
  greenBg: '#052e16',
  red: '#EF4444',
  redBg: '#2a0a0a',
  blue: '#3B82F6',
  blueBg: '#0a1a3a',
  white: '#f0f0f0',
  text: '#e0e0e0',
  subtext: '#8888a0',
  muted: '#555570',
  overlay: 'rgba(0,0,0,0.6)',
};

export const LIGHT = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  card: '#ffffff',
  cardBorder: '#e0e0e5',
  gold: '#B8860B',
  goldLight: '#D4A843',
  green: '#16A34A',
  greenBg: '#dcfce7',
  red: '#DC2626',
  redBg: '#fee2e2',
  blue: '#2563EB',
  blueBg: '#dbeafe',
  white: '#1a1a1a',
  text: '#333333',
  subtext: '#666680',
  muted: '#9999aa',
  overlay: 'rgba(0,0,0,0.4)',
};

let activeTheme = 'dark';
let C = DARK;

export function setTheme(mode) {
  activeTheme = mode;
  C = mode === 'light' ? LIGHT : DARK;
}

export function getTheme() { return activeTheme; }
export function getColors() { return C; }
export const COLORS = new Proxy({}, {
  get(_, prop) { return C[prop] || DARK[prop]; }
});
