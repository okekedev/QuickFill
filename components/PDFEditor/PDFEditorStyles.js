// components/PDFEditor/PDFEditorStyles.js - Updated with better field styling
import { StyleSheet, Platform } from 'react-native';
import { colors, shadows } from '../../styles/AppStyles';

export const pdfEditorStyles = StyleSheet.create({
  // Main PDF Editor Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  editorContainer: {
    flex: 1,
    position: 'relative',
  },
  
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  
  fieldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
});

export const pdfToolbarStyles = StyleSheet.create({
  toolbar: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.iosGrayLight,
    paddingVertical: 8,
    ...shadows.small,
  },
  
  toolbarContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  
  toolSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: colors.iosGrayLight,
  },
  
  toolButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.iosGrayLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  
  toolButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.iosGrayLight,
  },
  
  toolButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.iosBlue,
  },
  
  toolButtonTextDisabled: {
    color: colors.iosGray,
  },
  
  // Page Indicator
  pageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 6,
    marginHorizontal: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  
  pageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Scale Indicator
  scaleIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 6,
    marginHorizontal: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  
  scaleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export const editableFieldStyles = StyleSheet.create({
  fieldTouchable: {
    flex: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 20,
  },
  
  fieldText: {
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    lineHeight: 1.3,
    textAlign: 'left',
    color: '#000000', // Black by default
    fontWeight: '400',
  },
  
  fieldInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    padding: 2,
    margin: 0,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#000000', // Black text
    fontWeight: '400',
  },
  
  checkboxContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
  },
  
  checkboxText: {
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#000000',
  },
  
  signatureImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  resizeHandle: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 16,
    height: 16,
    backgroundColor: colors.iosBlue,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.iosBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 122, 255, 0.3)',
      },
    }),
  },
  
  resizeHandleIndicator: {
    width: 4,
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 2,
  },
});

export const signatureDialogStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalDialog: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  signatureCanvas: {
    borderWidth: 1,
    borderColor: colors.iosGrayLight,
    borderRadius: 8,
    backgroundColor: colors.backgroundTertiary,
    marginBottom: 8,
  },
  
  canvasHint: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: colors.iosGrayLight,
  },
  
  clearButton: {
    backgroundColor: colors.warning,
  },
  
  saveButton: {
    backgroundColor: colors.iosBlue,
  },
  
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  
  clearButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  
  saveButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export const signatureOptionsStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalDialog: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    ...shadows.large,
  },
  
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  optionButtons: {
    marginBottom: 20,
  },
  
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...shadows.small,
  },
  
  useExistingButton: {
    backgroundColor: colors.iosBlue,
  },
  
  replaceButton: {
    backgroundColor: colors.warning,
  },
  
  createNewButton: {
    backgroundColor: colors.success,
  },
  
  optionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  
  optionButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  
  cancelButton: {
    backgroundColor: colors.iosGrayLight,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});