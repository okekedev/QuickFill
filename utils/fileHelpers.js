import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Universal file reading for PDF processing
export const readFileAsBase64 = (fileAsset) => {
  return new Promise((resolve, reject) => {
    if (Platform.OS === 'web') {
      if (fileAsset.uri) {
        fetch(fileAsset.uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      } else if (fileAsset.file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fileAsset.file);
      } else {
        reject(new Error('No valid file or URI found'));
      }
    } else {
      if (fileAsset.uri && fileAsset.uri.startsWith('data:')) {
        const base64 = fileAsset.uri.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('File format not supported on this platform'));
      }
    }
  });
};

// File picking utilities
export const pickPDFFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    
    // Check if canceled (new API structure)
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    // Get the first asset from the assets array
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      return {
        success: true,
        uri: file.uri,
        name: file.name,
        size: file.size,
      };
    }
    
    return { success: false, error: 'No file selected' };
  } catch (error) {
    console.error('Error picking PDF file:', error);
    return { success: false, error: error.message };
  }
};

export const pickMultipleFiles = async (types = ['application/pdf']) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: types,
      multiple: true,
      copyToCacheDirectory: true,
    });
    
    if (result.type === 'success') {
      return {
        success: true,
        files: Array.isArray(result) ? result : [result],
      };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Error picking multiple files:', error);
    return { success: false, error: error.message };
  }
};

// File system utilities
export const saveToDevice = async (content, filename, mimeType = 'application/json') => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, content);
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri);
      return { success: true, shared: true };
    } else {
      return { success: true, saved: fileUri };
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
};

export const readFromDevice = async (fileUri) => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return { success: true, content };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (fileUri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
      return { success: true };
    } else {
      return { success: false, error: 'File does not exist' };
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// File validation utilities
export const getFileInfo = async (fileUri) => {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return {
      success: true,
      exists: info.exists,
      size: info.size,
      modificationTime: info.modificationTime,
      uri: info.uri,
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { success: false, error: error.message };
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

export const isValidFileType = (filename, allowedTypes = ['.pdf']) => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};