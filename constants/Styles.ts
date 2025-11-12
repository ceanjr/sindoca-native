import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3, // Android
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6, // Android
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textPrimary: {
    color: Colors.text,
    fontSize: 16,
  },
  textSecondary: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  textSmall: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  textBold: {
    fontWeight: '600',
  },
  textCenter: {
    textAlign: 'center',
  },
  mb8: {
    marginBottom: 8,
  },
  mb16: {
    marginBottom: 16,
  },
  mt8: {
    marginTop: 8,
  },
  mt16: {
    marginTop: 16,
  },
  p16: {
    padding: 16,
  },
  px16: {
    paddingHorizontal: 16,
  },
  py16: {
    paddingVertical: 16,
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};
