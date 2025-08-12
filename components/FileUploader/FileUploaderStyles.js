// components/FileUploader/FileUploaderStyles.js
import { StyleSheet } from 'react-native';
import { colors, shadows } from '../../styles/AppStyles';

export const fileUploaderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Hero Section
  heroSection: {
    padding: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Upload Button (iOS iMessage style)
  uploadButton: {
    backgroundColor: colors.iosBlue,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 200,
    ...shadows.medium,
  },
  
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  uploadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  
  uploadButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 17,
    fontWeight: '600',
  },
  
  // Files Section
  filesSection: {
    flex: 1,
    padding: 16,
  },
  
  filesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  // Combine Button
  combineButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  
  combineButtonText: {
    color: colors.backgroundSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // File Cards (iOS-style)
  filesList: {
    flex: 1,
  },
  
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 8,
    ...shadows.small,
  },
  
  fileIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  fileIcon: {
    fontSize: 20,
  },
  
  fileInfo: {
    flex: 1,
  },
  
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  
  fileDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Edit Badge
  editBadge: {
    backgroundColor: colors.iosBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  editBadgeText: {
    color: colors.backgroundSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  
  emptyDescription: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});