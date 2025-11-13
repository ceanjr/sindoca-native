export const Colors = {
  primary: '#ff6b9d',
  primaryDark: '#ff4581',
  primaryLight: '#ffb3cf',
  secondary: '#FFD93D', // Amarelo suave
  secondaryDark: '#2980e8',
  secondaryLight: '#8ec5ff',
  accent: '#6BCF7F', // Verde menta
  lavender: '#7B68EE', // Lavanda/Roxo
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundGradient: '#fafafa', // Off-white suave
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ffcc00',
  info: '#5ac8fa',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

const tintColorLight = '#ff6b9d';
const tintColorDark = '#ff6b9d';

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Colors.white,
    background: Colors.black,
    tint: tintColorDark,
    tabIconDefault: '#666',
    tabIconSelected: tintColorDark,
  },
};
