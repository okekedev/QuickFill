// components/PDFCombiner/PDFCombinerStyles.js
import { StyleSheet } from 'react-native';
import { colors, shadows } from '../../styles/AppStyles';

export const pdfCombinerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Section
  header: {
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.iosGrayLight,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  
  selectionIndicator: {
    backgroundColor: colors.iosBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  
  selectionCount: {
    color: colors.backgroundSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Files List
  filesList: {
    flex: 1,
  },
  
  filesListContent: {
    padding: 16,
  },
  
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.iosGrayLight,
    ...shadows.small,
  },
  
  selectedFileItem: {
    borderColor: colors.iosBlue,
    backgroundColor: '#F0F8FF', // Light blue tint
  },
  
  // Checkbox
  checkbox: {
    marginRight: 16,
  },
  
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.iosBlue,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  
  checkboxSelected: {
    backgroundColor: colors.iosBlue,
  },
  
  checkboxCheck: {
    color: colors.backgroundSecondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // File Info
  fileInfo: {
    flex: 1,
  },
  
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  
  fileSize: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  
  fileOrder: {
    fontSize: 12,
    color: colors.iosBlue,
    fontWeight: '600',
  },
  
  // Order Controls
  orderControls: {
    flexDirection: 'row',
    gap: 8,
  },
  
  orderButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.iosBlue,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  
  orderButtonDisabled: {
    backgroundColor: colors.iosGrayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  orderButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Action Buttons
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 0.5,
    borderTopColor: colors.iosGrayLight,
  },
  
  backButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: colors.iosGrayLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  
  combineButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: colors.iosBlue,
    borderRadius: 12,
    alignItems: 'center',
    ...shadows.medium,
  },
  
  combineButtonDisabled: {
    backgroundColor: colors.iosGrayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  combineButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});