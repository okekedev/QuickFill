import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const components = StyleSheet.create({
  // Button styles
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  
  buttonPrimary: {
    backgroundColor: colors.primary[500],
  },
  
  buttonSecondary: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  
  buttonSuccess: {
    backgroundColor: colors.success.main,
  },
  
  buttonError: {
    backgroundColor: colors.error.main,
  },
  
  buttonDisabled: {
    backgroundColor: colors.gray[200],
    opacity: 0.6,
  },
  
  // Button text styles
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonTextPrimary: {
    color: colors.white,
  },
  
  buttonTextSecondary: {
    color: colors.text.primary,
  },
  
  buttonTextSuccess: {
    color: colors.white,
  },
  
  buttonTextError: {
    color: colors.white,
  },
  
  buttonTextDisabled: {
    color: colors.text.disabled,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardHeader: {
    marginBottom: 12,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
    minWidth: 300,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  modalCloseButton: {
    padding: 4,
  },
  
  // Text styles
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  bodyText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
  },
  
  caption: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  
  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  
  inputFocused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  
  inputError: {
    borderColor: colors.error.main,
  },
  
  // Spinner/Loading styles
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  spinnerText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
  },
  
  // PDF-specific component styles
  pdfField: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.transparent,
    backgroundColor: colors.pdf.field,
    minHeight: 20,
    minWidth: 30,
  },
  
  pdfFieldSelected: {
    borderColor: colors.pdf.selected,
    backgroundColor: colors.primary[50],
  },
  
  pdfFieldEditing: {
    borderColor: colors.primary[700],
    backgroundColor: colors.white,
  },
  
  pdfFieldText: {
    padding: 4,
    fontSize: 12,
    color: colors.text.primary,
  },
  
  pdfToolbar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  
  pdfToolbarButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  
  pdfToolbarButtonActive: {
    backgroundColor: colors.primary[100],
  },
  
  // Navigation styles
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    marginHorizontal: 4,
  },
  
  navButtonDisabled: {
    backgroundColor: colors.gray[300],
    opacity: 0.6,
  },
  
  navButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});