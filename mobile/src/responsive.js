import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;

const scale = SCREEN_WIDTH / BASE_WIDTH;
export function s(size) { return Math.round(size * Math.min(scale, 1.5)); }
export function vs(size) {
  const vScale = SCREEN_HEIGHT / 812;
  return Math.round(size * Math.min(vScale, 1.5));
}
export function ms(size, factor = 0.5) {
  return Math.round(size + (s(size) - size) * factor);
}
export function fs(size) {
  const fontScale = PixelRatio.getFontScale();
  return Math.round(s(size) * Math.min(fontScale, 1.3));
}
export function isTablet() { return SCREEN_WIDTH >= 600; }
export function isSmall() { return SCREEN_WIDTH < 360; }
export { SCREEN_WIDTH, SCREEN_HEIGHT };
