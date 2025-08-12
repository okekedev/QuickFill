// styles/AppStyles.js - Global Colors & App-Level Styles Only
import { StyleSheet, Platform } from 'react-native';

// iOS iMessage Color Palette
export const colors = {
  // Primary Blues (iMessage bubble colors)
  iosBlue: '#007AFF',
  iosBlueLight: '#5AC8FA', 
  iosBlueDark: '#0051D5',
  
  // Secondary Colors
  iosGray: '#8E8E93',
  iosGrayLight: '#C7C7CC',
  iosGrayDark: '#48484A',
  
  // Backgrounds (iOS system colors)
  background: '#F2F2F7',           // iOS system background
  backgroundSecondary: '#FFFFFF',   // iOS secondary background
  backgroundTertiary: '#F2F2F7',   // iOS tertiary background
  
  // Text Colors
  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  
  // Message Bubble Colors
  sent: '#007AFF',        // Blue for sent messages
  received: '#E9E9EB',    // Light gray for received
  
  // Status Colors
  success: '#34C759',     // iOS green
  warning: '#FF9500',     // iOS orange  
  error: '#FF3B30',       // iOS red
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.4)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

// Common shadow styles for reuse
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  }),
  
  medium: Platform.select({
    ios: {
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    },
  }),
  
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
  }),
};

// App-level styles only
export const styles = StyleSheet.create({
  // Main App Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Content area (below navigation)
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      ios: {
        paddingTop: 0, // iOS handles safe area
      },
      android: {
        paddingTop: 10,
      },
      web: {
        paddingTop: 0,
      },
    }),
  },
});