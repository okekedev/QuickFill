// components/FileUploader/FileUploader.js - Clean component with imported styles
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Platform,
  Alert 
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { fileUploaderStyles } from './FileUploaderStyles';

const FileUploader = ({ 
  onFileUpload, 
  uploadedFiles, 
  onOpenPDF, 
  onCombinePDFs 
}) => {
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        onFileUpload(file);
      }
    } catch (error) {
      console.error('❌ Error picking file:', error);
      if (Platform.OS === 'web') {
        alert('Error selecting file: ' + error.message);
      } else {
        Alert.alert('Error', 'Failed to select file: ' + error.message);
      }
    }
  };

  const renderFileItem = ({ item }) => (
    <TouchableOpacity
      style={fileUploaderStyles.fileCard}
      onPress={() => item.mimeType === 'application/pdf' && onOpenPDF(item)}
      activeOpacity={0.7}
    >
      <View style={fileUploaderStyles.fileIconContainer}>
        <Text style={fileUploaderStyles.fileIcon}>
          {item.mimeType === 'application/pdf' ? '📄' : '🖼️'}
        </Text>
      </View>
      
      <View style={fileUploaderStyles.fileInfo}>
        <Text style={fileUploaderStyles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={fileUploaderStyles.fileDetails}>
          {item.mimeType === 'application/pdf' ? 'PDF Document' : 'Image'} • {Math.round(item.size / 1024)}KB
        </Text>
      </View>
      
      {item.mimeType === 'application/pdf' && (
        <View style={fileUploaderStyles.editBadge}>
          <Text style={fileUploaderStyles.editBadgeText}>Edit</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const pdfCount = uploadedFiles.filter(f => f.mimeType === 'application/pdf').length;

  return (
    <View style={fileUploaderStyles.container}>
      {/* Hero Section */}
      <View style={fileUploaderStyles.heroSection}>
        <Text style={fileUploaderStyles.heroTitle}>PDF Form Filler</Text>
        <Text style={fileUploaderStyles.heroSubtitle}>
          Upload PDFs and images to fill out forms quickly
        </Text>
        
        <TouchableOpacity style={fileUploaderStyles.uploadButton} onPress={handleFilePicker}>
          <View style={fileUploaderStyles.uploadButtonContent}>
            <Text style={fileUploaderStyles.uploadIcon}>📎</Text>
            <Text style={fileUploaderStyles.uploadButtonText}>Choose File</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Files List */}
      {uploadedFiles.length > 0 && (
        <View style={fileUploaderStyles.filesSection}>
          <View style={fileUploaderStyles.filesSectionHeader}>
            <Text style={fileUploaderStyles.sectionTitle}>
              {uploadedFiles.length} {uploadedFiles.length === 1 ? 'File' : 'Files'}
            </Text>
            {pdfCount > 1 && (
              <TouchableOpacity style={fileUploaderStyles.combineButton} onPress={onCombinePDFs}>
                <Text style={fileUploaderStyles.combineButtonText}>Combine {pdfCount} PDFs</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={uploadedFiles}
            renderItem={renderFileItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            style={fileUploaderStyles.filesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && (
        <View style={fileUploaderStyles.emptyState}>
          <Text style={fileUploaderStyles.emptyIcon}>📱</Text>
          <Text style={fileUploaderStyles.emptyTitle}>No files yet</Text>
          <Text style={fileUploaderStyles.emptyDescription}>
            Upload PDF files to fill out forms{'\n'}or add images to convert to PDF
          </Text>
        </View>
      )}
    </View>
  );
};

export default FileUploader;