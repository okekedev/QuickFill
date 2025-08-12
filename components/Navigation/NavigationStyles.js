// components/Navigation/NavigationStyles.js
import { StyleSheet, Platform } from 'react-native';
import { colors, shadows } from '../../styles/AppStyles';

export const navigationStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // iOS safe area
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.iosGrayLight,
    ...shadows.small,
  },
  
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  // Title Styling
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.4, // iOS-style tight letter spacing
  },
  
  // Back Button
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  backButtonText: {
    color: colors.iosBlue,
    fontSize: 17,
    fontWeight: '400',
  },
  
  // Action Button (Combine)
  actionButton: {
    backgroundColor: colors.iosBlue,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20, // iOS pill shape
  },
  
  actionButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});